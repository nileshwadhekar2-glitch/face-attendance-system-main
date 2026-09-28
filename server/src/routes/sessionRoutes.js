const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    const { name, type, action, id, duration, class_id } = req.body;
    try {
        if (action === 'create') {
            const parsedClassId = class_id ? parseInt(class_id, 10) : null;
            const session = await sessionService.createSession(name, type || 'in', duration || 0, parsedClassId);
            res.json(session);
        } else if (action === 'toggle') {
            await sessionService.toggleSession(id, req.body.isActive);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/active', async (req, res) => {
    try {
        const session = await sessionService.getActiveSession();
        res.json(session || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/history', auth, async (req, res) => {
    try {
        const sessions = await sessionService.getSessionHistory();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await sessionService.deleteSession(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/type', auth, async (req, res) => {
    try {
        const newType = await sessionService.toggleSessionType(req.params.id);
        res.json({ success: true, newType });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/stats', auth, async (req, res) => {
    try {
        const stats = await sessionService.getSessionStats(req.params.id);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
