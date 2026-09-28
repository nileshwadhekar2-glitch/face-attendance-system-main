const pool = require('../config/database');

const createSession = async (name, type = 'in', duration = 0, classId = null) => {
    // Deactivate all other sessions first
    await pool.query('UPDATE sessions SET is_active = 0');
    
    const { rows } = await pool.query(
        'INSERT INTO sessions (class_id, name, type, duration) VALUES ($1, $2, $3, $4) RETURNING id',
        [classId, name, type, duration]
    );
    return { id: rows[0].id, name, type, duration, class_id: classId, is_active: 1 };
};

const getActiveSession = async () => {
    // 1. Fetch the raw active session
    const { rows } = await pool.query(`
        SELECT s.*, c.code as class_code, c.name as class_name 
        FROM sessions s 
        LEFT JOIN classes c ON s.class_id = c.id 
        WHERE s.is_active = 1 
        ORDER BY s.id DESC LIMIT 1
    `);
    const session = rows[0];

    if (session) {
        // Postgres returns Date objects for TIMESTAMPTZ, toISOString() handles it
        const sessionStartTime = new Date(session.start_time);
        session.start_time = sessionStartTime.toISOString();

        // 2. Auto-Termination Check
        const duration = parseInt(session.duration, 10) || 0;
        if (duration > 0) {
            const startTimeMs = sessionStartTime.getTime();
            const nowMs = Date.now();
            const expiryTimeMs = startTimeMs + (duration * 60000);

            if (nowMs >= expiryTimeMs) {
                console.log(`[Auto-Terminate] Session ${session.id} expired natively. Marking inactive.`);
                await pool.query('UPDATE sessions SET is_active = 0 WHERE id = $1', [session.id]);
                return null;
            }
        }
    }

    return session || null;
};

const getSessionHistory = async () => {
    const { rows } = await pool.query(`
        SELECT s.*, c.code as class_code 
        FROM sessions s 
        LEFT JOIN classes c ON s.class_id = c.id 
        ORDER BY s.start_time DESC LIMIT 50
    `);
    return rows;
};

const deleteSession = async (id) => {
    await pool.query('DELETE FROM attendance WHERE session_id = $1', [id]);
    await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
};

const toggleSession = async (id, isActive) => {
    if (isActive) {
        await pool.query('UPDATE sessions SET is_active = 0');
    }
    await pool.query('UPDATE sessions SET is_active = $1 WHERE id = $2', [isActive ? 1 : 0, id]);
};

const toggleSessionType = async (id) => {
    const { rows } = await pool.query('SELECT type FROM sessions WHERE id = $1', [id]);
    const session = rows[0];
    
    if (session) {
        const newType = session.type === 'in' ? 'out' : 'in';
        await pool.query('UPDATE sessions SET type = $1 WHERE id = $2', [newType, id]);
        return newType;
    }
    return null;
};

const getSessionStats = async (sessionId) => {
    const { rows } = await pool.query(`
    SELECT 
      COUNT(DISTINCT user_id) as total_students,
      SUM(CASE WHEN type = 'in' THEN 1 ELSE 0 END) as total_in,
      SUM(CASE WHEN type = 'out' THEN 1 ELSE 0 END) as total_out
    FROM attendance 
    WHERE session_id = $1
  `, [sessionId]);
  
    // COALESCE SUM results can be null instead of 0
    return {
        total_students: parseInt(rows[0].total_students || 0, 10),
        total_in: parseInt(rows[0].total_in || 0, 10),
        total_out: parseInt(rows[0].total_out || 0, 10)
    };
};

module.exports = {
    createSession,
    getActiveSession,
    getSessionHistory,
    deleteSession,
    toggleSession,
    toggleSessionType,
    getSessionStats
};
