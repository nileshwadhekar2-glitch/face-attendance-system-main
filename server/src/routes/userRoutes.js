const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const validate = require('../middleware/validate');
const { registerSchema } = require('../validations/userSchema');
const multer = require('multer');
const faceService = require('../services/faceService');
const auth = require('../middleware/auth');

// Configure Cloudinary using Environment Variable 
// (Ensure CLOUDINARY_URL is set in .env)

// Configure Multer (Memory Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to parse JSON fields from FormData
const parseFormData = (req, res, next) => {
    if (req.body.classIds && typeof req.body.classIds === 'string') {
        try {
            req.body.classIds = JSON.parse(req.body.classIds);
        } catch (e) {
            req.body.classIds = [];
        }
    }
    next();
};

// Register a new user
router.post('/register', upload.any(), parseFormData, validate(registerSchema), async (req, res) => {
    console.log(`[UserRoute] Headers:`, req.headers['content-type']);
    console.log(`[UserRoute] Body Keys:`, Object.keys(req.body));
    console.log(`[UserRoute] Files:`, req.files ? req.files.map(f => `${f.fieldname} (${f.mimetype})`) : 'none');

    // Collect all uploaded images regardless of field name
    const images = req.files ? req.files.filter(f => f.mimetype.startsWith('image/')) : [];
    console.log(`[UserRoute] Found ${images.length} candidate images.`);

    // req.body contains text fields
    const { name, matric_no, level, department, course, section, classIds, faceLandmarks } = req.body;
    let { photo } = req.body;

    let descriptor = null;
    if (faceLandmarks) {
        try {
            descriptor = typeof faceLandmarks === 'string' ? JSON.parse(faceLandmarks) : faceLandmarks;
        } catch (error) {
            return res.status(400).json({ success: false, error: 'Invalid faceLandmarks' });
        }
    }

    if (images.length > 0) {
        photo = `data:${images[0].mimetype};base64,${images[0].buffer.toString('base64')}`;
    }

    // fallback if no image/descriptor
    if (!descriptor || !photo) {
        return res.status(400).json({ success: false, error: 'Both a Photo and a valid Biometric Descriptor are strictly required' });
    }

    try {
        const result = await userService.registerUser({
            name, matric_no, level, department, course,
            descriptor,
            section,
            classIds: classIds ? (Array.isArray(classIds) ? classIds : JSON.parse(classIds)) : [],
            photo
        });
        res.json({ success: true, userId: result.userId, created: result.created });
    } catch (err) {
        console.error("Registration error:", err);
        // Postgres unique constraint error handling
        if (err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
             return res.status(400).json({ success: false, error: 'Student with this Matric Number already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get all users (Paginated)
router.get('/', auth, async (req, res) => {
    try {
        const { search, sort, page, limit } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = await userService.getAllUsers(search, sort, pageNum, limitNum);

        const usersWithDescriptors = result.data.map(u => ({
            ...u,
            descriptor: JSON.parse(u.descriptor)
        }));

        res.json({
            users: usersWithDescriptors,
            total: result.total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(result.total / limitNum)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
