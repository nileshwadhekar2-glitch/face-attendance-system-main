const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const jwtSecret = process.env.JWT_SECRET || 'supersecret';

        if (username === validUsername && password === validPassword) {
            const token = jwt.sign(
                { role: 'admin', username },
                jwtSecret,
                { expiresIn: '12h' }
            );
            return res.json({ success: true, token });
        }

        return res.status(401).json({ success: false, error: 'Invalid administrative credentials.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
    }
});

module.exports = router;
