const express = require('express');
const router = express.Router();
const classService = require('../services/classService');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, code, department } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });
        const newClass = await classService.createClass(name, code, department);
        res.json(newClass);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await classService.deleteClass(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
