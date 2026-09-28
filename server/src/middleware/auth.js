const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'Authentication token missing. Access denied.' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'supersecret';
        const decoded = jwt.verify(token, jwtSecret);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token. Access denied.' });
    }
};

module.exports = auth;
