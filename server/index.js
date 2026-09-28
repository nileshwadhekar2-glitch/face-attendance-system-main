require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./src/routes/userRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'https://face-attendance-system-prod.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Match localhost, development IPs, or any onrender.com subdomain
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            /\.onrender\.com$/.test(origin) ||
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

        if (!isAllowed) {
            console.log(`[CORS Blocked] Origin: ${origin}`);
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/classes', require('./src/routes/classRoutes'));

// Serve built React frontend (MUST be after API routes)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Global Error Handler
app.use((err, req, res, next) => {
    // Multer error handling
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            error: `Unexpected field: "${err.field}". Enrollment uses "images" and Attendance uses "image".`
        });
    }

    console.error("Caught Error:", err);
    res.status(500).json({
        success: false,
        error: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Catch-all route: serve React app for any non-API route (enables React Router)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Process Level Fatal Error Logging
process.on('uncaughtException', (err) => {
    console.error('FATAL EXCEPTION:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const pool = require('./src/config/database');
pool.initDb().then(() => {
    app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(() => process.exit(1));

