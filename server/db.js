const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('attendance.db', { verbose: console.log });

// Initializing Schema song playing: Heartless the weeknd
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    matric_no TEXT,
    level TEXT,
    department TEXT,
    course TEXT,
    photo TEXT,
    descriptor TEXT NOT NULL,
    section TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'in', 
    duration INTEGER DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    type TEXT DEFAULT 'in',
    image TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

const registerUser = (user) => {
  const { name, matric_no, level, department, course, photo, descriptor, section } = user;
  const stmt = db.prepare('INSERT INTO users (name, matric_no, level, department, course, photo, descriptor, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(name, matric_no, level, department, course, photo, descriptor, section);
  return info.lastInsertRowid;
};

const getAllUsers = (search, sort) => {
  // Format created_at as ISO UTC string
  let query = "SELECT id, name, matric_no, level, department, course, photo, descriptor, section, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) as created_at FROM users";
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR matric_no LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'matric') {
    query += ' ORDER BY matric_no ASC';
  } else {
    query += ' ORDER BY name ASC';
  }

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const deleteUser = (id) => {
  // Delete attendance first to satisfy foreign key constraints (or logical cleanup)
  db.prepare('DELETE FROM attendance WHERE user_id = ?').run(id);
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  return stmt.run(id);
};


// Session Management
const createSession = (name, type = 'in', duration = 0) => {
  // Deactivate all other sessions first
  db.prepare('UPDATE sessions SET is_active = 0').run();
  const stmt = db.prepare('INSERT INTO sessions (name, type, duration) VALUES (?, ?, ?)');
  const info = stmt.run(name, type, duration);
  return { id: info.lastInsertRowid, name, type, duration, is_active: 1 };
};

const getActiveSession = () => {
  const stmt = db.prepare('SELECT * FROM sessions WHERE is_active = 1 ORDER BY id DESC LIMIT 1');
  return stmt.get();
};

const getSessionHistory = () => {
  const stmt = db.prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT 50');
  return stmt.all();
};

const deleteSession = (id) => {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  return stmt.run(id);
}

const toggleSession = (id, isActive) => {
  if (isActive) {
    db.prepare('UPDATE sessions SET is_active = 0').run();
  }
  const stmt = db.prepare('UPDATE sessions SET is_active = ? WHERE id = ?');
  stmt.run(isActive ? 1 : 0, id);
};

const toggleSessionType = (id) => {
  const session = db.prepare('SELECT type FROM sessions WHERE id = ?').get(id);
  if (session) {
    const newType = session.type === 'in' ? 'out' : 'in';
    db.prepare('UPDATE sessions SET type = ? WHERE id = ?').run(newType, id);
    return newType;
  }
  return null;
};

const getSessionStats = (sessionId) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT user_id) as total_students,
      SUM(CASE WHEN type = 'in' THEN 1 ELSE 0 END) as total_in,
      SUM(CASE WHEN type = 'out' THEN 1 ELSE 0 END) as total_out
    FROM attendance 
    WHERE session_id = ?
  `).get(sessionId);
  return stats;
};

// Attendance
const logAttendance = (userId, sessionId, type, image) => {
  const stmt = db.prepare('INSERT INTO attendance (user_id, session_id, type, image) VALUES (?, ?, ?, ?)');
  const info = stmt.run(userId, sessionId, type, image);
  return info.lastInsertRowid;
};

const checkDuplicate = (userId, sessionId, type) => {
  if (!sessionId) return false;
  const stmt = db.prepare('SELECT id FROM attendance WHERE user_id = ? AND session_id = ? AND type = ?');
  return !!stmt.get(userId, sessionId, type);
};

const getAttendanceLogs = (search) => {
  // Use strftime to format as ISO8601 with T separator and Z suffix so JS Date parses it as UTC
  let query = `
    SELECT a.id, strftime('%Y-%m-%dT%H:%M:%SZ', a.timestamp) as timestamp, a.type, a.image, u.name, u.matric_no, u.level, u.department, s.name as session_name
    FROM attendance a 
    JOIN users u ON a.user_id = u.id 
    LEFT JOIN sessions s ON a.session_id = s.id
  `;

  const params = [];
  if (search) {
    query += ' WHERE u.name LIKE ? OR u.matric_no LIKE ? OR date(a.timestamp) = ?';
    params.push(`%${search}%`, `%${search}%`, search);
  }

  query += ' ORDER BY a.timestamp DESC';
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const deleteAttendance = (id) => {
  const stmt = db.prepare('DELETE FROM attendance WHERE id = ?');
  return stmt.run(id);
};

const deleteAttendanceByDate = (dateStr) => {
  // dateStr format YYYY-MM-DD
  const stmt = db.prepare("DELETE FROM attendance WHERE date(timestamp) = ?");
  return stmt.run(dateStr);
};

module.exports = {
  registerUser,
  getAllUsers,
  deleteUser,
  createSession,
  getActiveSession,
  getSessionHistory,
  deleteSession,
  toggleSession,
  logAttendance,
  checkDuplicate,
  getAttendanceLogs,
  deleteAttendance,
  deleteAttendanceByDate,
  toggleSessionType,
  getSessionStats
};

