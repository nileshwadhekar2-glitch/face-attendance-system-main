const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');
const sessionService = require('../services/sessionService');
const xlsx = require('xlsx');
const userService = require('../services/userService');
const db = require('../config/database');
const multer = require('multer');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { markAttendanceSchema } = require('../validations/attendanceSchema');

// Configure Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Log attendance (Scan Face)
router.post('/', upload.any(), validate(markAttendanceSchema), async (req, res) => {
    let { faceLandmarks } = req.body;
    let userId = null;

    // Find any image file
    const file = req.files ? req.files.find(f => f.mimetype.startsWith('image/')) : null;

    try {
        if (!faceLandmarks) {
             return res.status(400).json({ error: 'Facial biometric data is required' });
        }

        // VERIFY FACE
        console.log(`Verifying face from provided landmarks...`);
        let descriptor = faceLandmarks;
        if (typeof descriptor === 'string') {
            try {
                descriptor = JSON.parse(descriptor);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid faceLandmarks payload' });
            }
        }

        const recognizedUserId = await attendanceService.verifyFace(descriptor);

        if (!recognizedUserId) {
            return res.status(401).json({ error: 'Face not recognized' });
        }
        userId = recognizedUserId;

        const activeSession = await sessionService.getActiveSession();

        if (!activeSession) {
            return res.status(403).json({ error: 'No active session. Please wait for lecturer to start a session.' });
        }

        const sessionMode = activeSession.type;
        const sessionId = activeSession.id;

        // Class Enrollment Restriction
        if (activeSession.class_id) {
            const { rows: enrollResult } = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND class_id = $2', [userId, activeSession.class_id]);
            if (enrollResult.length === 0) {
                return res.status(403).json({ error: 'You are not enrolled in this class session' });
            }
        }

        // Duplicate check
        const isDuplicate = await attendanceService.checkDuplicate(userId, sessionId, sessionMode);
        if (isDuplicate) {
            const { rows: userRows } = await db.query('SELECT name, matric_no FROM users WHERE id = $1', [userId]);
            return res.status(200).json({ success: true, duplicate: true, user: userRows[0], message: 'Already marked for this session' });
        }

        const entryId = await attendanceService.logAttendance(userId, sessionId, sessionMode, null);

        // Fetch user details to return
        const { rows: userRows } = await db.query('SELECT name, matric_no FROM users WHERE id = $1', [userId]);

        res.json({ success: true, entryId, session: activeSession, user: userRows[0] });
    } catch (err) {
        console.error("Attendance error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get attendance logs
router.get('/', auth, async (req, res) => {
    try {
        const { search, sessionId, date } = req.query;
        const logs = await attendanceService.getAttendanceLogs(search, sessionId, date);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/bulk', auth, async (req, res) => {
    const { date } = req.body;
    try {
        if (date) {
            await attendanceService.deleteAttendanceByDate(date);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Date is required' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await attendanceService.deleteAttendance(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export attendance records with the same filters as the log view.
router.get('/export', auth, async (req, res) => {
    try {
        const rows = await attendanceService.getAttendanceLogs(req.query.search, req.query.sessionId, req.query.date);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(rows), 'Attendance');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance.xlsx"');
        res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Matrix Excel
router.get('/export-matrix', auth, async (req, res) => {
    try {
        const { sessionName, classId } = req.query;

        if (classId) {
            const result = await attendanceService.getAttendanceMatrix(classId);
            const { sessions, data } = result;

            if (sessions.length === 0) return res.status(404).json({ error: 'No sessions found for this class' });

            const headers = ['Matric No', 'Name'];
            sessions.forEach(s => headers.push(`${s.name} (${s.date})`));

            const excelRows = data.map(row => {
                const r = {
                    'Matric No': row.matric_no || 'N/A',
                    'Name': row.name
                };
                sessions.forEach(s => {
                    r[`${s.name} (${s.date})`] = row.attendance[s.id];
                });
                return r;
            });

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(excelRows);
            xlsx.utils.book_append_sheet(wb, ws, 'Attendance Matrix');

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', `attachment; filename="class_matrix_${classId}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
            return;
        }

        if (!sessionName) return res.status(400).json({ error: 'sessionName or classId is required' });

        const { rows: users } = await db.query('SELECT id, matric_no, name, department, course FROM users WHERE is_active = 1 ORDER BY name ASC');
        const { rows: sessions } = await db.query('SELECT id, to_char(start_time, \'YYYY-MM-DD\') as date FROM sessions WHERE name = $1 ORDER BY start_time ASC', [sessionName]);

        if (sessions.length === 0) return res.status(404).json({ error: 'No sessions found with this name' });

        const dates = [...new Set(sessions.map(s => s.date))];
        const sessionIdsByDate = {};
        dates.forEach(d => {
            sessionIdsByDate[d] = sessions.filter(s => s.date === d).map(s => s.id);
        });

        const sessionIds = sessions.map(s => s.id);
        const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(',');
        const { rows: attendance } = await db.query(`SELECT user_id, session_id FROM attendance WHERE session_id IN (${placeholders})`, sessionIds);

        const matrixData = users.map(user => {
            const row = {
                'Matric No': user.matric_no || 'N/A',
                'Name': user.name,
                'Department': user.department || 'N/A',
                'Course': user.course || 'N/A'
            };

            dates.forEach(date => {
                const idsForDate = sessionIdsByDate[date];
                const wasPresent = attendance.some(a => a.user_id === user.id && idsForDate.includes(a.session_id));
                row[date] = wasPresent ? 1 : 0;
            });

            return row;
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(matrixData);
        xlsx.utils.book_append_sheet(wb, ws, 'Attendance Matrix');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="attendance_matrix_${sessionName.replace(/\s+/g, '_')}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
