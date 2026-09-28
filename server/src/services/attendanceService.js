const pool = require('../config/database');
const faceService = require('./faceService');

const THRESHOLD = 0.9; // Strictness for ArcFace

const logAttendance = async (userId, sessionId, type, image) => {
    const { rows } = await pool.query(
        'INSERT INTO attendance (user_id, session_id, type, image) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, sessionId, type, image]
    );
    return rows[0].id;
};

const checkDuplicate = async (userId, sessionId, type) => {
    if (!sessionId) return false;
    const { rows } = await pool.query(
        'SELECT id FROM attendance WHERE user_id = $1 AND session_id = $2 AND type = $3',
        [userId, sessionId, type]
    );
    return rows.length > 0;
};

const verifyFace = async (descriptor) => {
    // The match logic is now entirely handled by faceService.findMatchingFace
    // which compares the incoming 128D array against all stored descriptors.
    const match = await faceService.findMatchingFace(descriptor);

    if (match) {
        return match.userId;
    }

    return null;
};

const getAttendanceLogs = async (search, sessionIdParam = null, filterDate = null) => {
    let query = `
    SELECT a.id, to_char(a.timestamp, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as timestamp, a.type, a.image, u.name, u.matric_no, u.level, u.department, s.name as session_name, c.code as class_code
    FROM attendance a 
    JOIN users u ON a.user_id = u.id 
    LEFT JOIN sessions s ON a.session_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
  `;

    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (search) {
        conditions.push(`(u.name ILIKE $${paramIndex} OR u.matric_no ILIKE $${paramIndex + 1} OR date(a.timestamp)::text = $${paramIndex + 2})`);
        params.push(`%${search}%`, `%${search}%`, search);
        paramIndex += 3;
    }

    if (sessionIdParam) {
        conditions.push(`a.session_id = $${paramIndex}`);
        params.push(sessionIdParam);
        paramIndex += 1;
    }

    if (filterDate) {
        conditions.push(`date(a.timestamp)::text = $${paramIndex}`);
        params.push(filterDate);
        paramIndex += 1;
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.timestamp DESC';
    const { rows } = await pool.query(query, params);
    return rows;
};

const deleteAttendance = async (id) => {
    await pool.query('DELETE FROM attendance WHERE id = $1', [id]);
};

const deleteAttendanceByDate = async (date) => {
    await pool.query('DELETE FROM attendance WHERE date(timestamp)::text = $1', [date]);
};

const getAttendanceMatrix = async (classId) => {
    // 1. Get all sessions for this class
    let sessionQuery = 'SELECT id, name, to_char(start_time, \'YYYY-MM-DD\') as date FROM sessions WHERE 1=1';
    const params = [];
    
    if (classId) {
        sessionQuery += ' AND class_id = $1';
        params.push(classId);
    }
    sessionQuery += ' ORDER BY start_time ASC';
    const { rows: sessions } = await pool.query(sessionQuery, params);

    if (sessions.length === 0) return { sessions: [], data: [] };

    // 2. Get all students explicitly enrolled (including soft deleted since we want historical matrix accuracy)
    let userQuery = `
        SELECT u.id, u.name, u.matric_no
        FROM users u
        ${classId ? 'JOIN enrollments e ON u.id = e.user_id WHERE e.class_id = $1' : ''}
        ORDER BY u.name ASC
    `;
    const userParams = classId ? [classId] : [];
    const { rows: users } = await pool.query(userQuery, userParams);

    // 3. Get all attendance records for these sessions
    const sessionIds = sessions.map(s => s.id);
    if (sessionIds.length === 0) return { sessions, data: [] };

    // Build parameterized query for IN array
    const inParams = sessionIds.map((_, i) => `$${i + 1}`).join(',');
    const attendanceQuery = `
        SELECT user_id, session_id 
        FROM attendance 
        WHERE session_id IN (${inParams}) AND type = 'in'
    `;
    const { rows: attendanceRecords } = await pool.query(attendanceQuery, sessionIds);

    // 4. Build Matrix
    const attendanceMap = {};
    attendanceRecords.forEach(r => {
        attendanceMap[`${r.user_id}_${r.session_id}`] = true;
    });

    const matrix = users.map((user, index) => {
        const row = {
            'S/N': index + 1,
            name: user.name,
            matric_no: user.matric_no,
            attendance: {}
        };
        sessions.forEach(session => {
            row.attendance[session.id] = attendanceMap[`${user.id}_${session.id}`] ? 1 : 0;
        });
        return row;
    });

    return { sessions, data: matrix };
};

module.exports = {
    logAttendance,
    checkDuplicate,
    verifyFace,
    getAttendanceLogs,
    deleteAttendance,
    deleteAttendanceByDate,
    getAttendanceMatrix
};
