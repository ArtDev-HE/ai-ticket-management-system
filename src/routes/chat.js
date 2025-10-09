const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const verifyJwt = require('../middleware/verifyJwt');

function getSecret() {
    return process.env.CHAT_EXPORT_SECRET || process.env.JWT_SECRET || 'dev-chat-export-secret';
}

// POST /api/chat/export
// Accepts { employeeId, exportedAt, messages, md } and returns { signature }
// Requires authentication so only owners can export
router.post('/export', verifyJwt, (req, res) => {
    const payload = req.body || {};
    const user = req.user || {};
    // Basic validation
    if (!payload.employeeId || !Array.isArray(payload.messages)) {
        return res.status(400).json({ error: 'Invalid export payload' });
    }
    // Ensure requester owns the export
    if (user.employeeId && payload.employeeId !== user.employeeId) {
        return res.status(403).json({ error: 'Cannot export another user\'s chat' });
    }

    const secret = getSecret();
    const toSign = JSON.stringify({ employeeId: payload.employeeId, exportedAt: payload.exportedAt, messages: payload.messages });
    const signature = crypto.createHmac('sha256', secret).update(toSign).digest('hex');
    return res.json({ signature });
});

// POST /api/chat/import
// Accepts { employeeId, exportedAt, messages, md, signature }
// Verifies signature and that authenticated user matches employeeId
router.post('/import', verifyJwt, (req, res) => {
    const payload = req.body || {};
    const user = req.user || {};
    if (!payload.employeeId || !Array.isArray(payload.messages) || !payload.signature) {
        return res.status(400).json({ error: 'Invalid import payload' });
    }

    // Ensure requester owns the import target
    if (user.employeeId && payload.employeeId !== user.employeeId) {
        return res.status(403).json({ error: 'Cannot import chat for another user' });
    }

    const secret = getSecret();
    const toVerify = JSON.stringify({ employeeId: payload.employeeId, exportedAt: payload.exportedAt, messages: payload.messages });
    const expected = crypto.createHmac('sha256', secret).update(toVerify).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.signature))) {
        return res.status(400).json({ error: 'Signature mismatch or corrupted file' });
    }

    // At this point payload.messages is trusted and belongs to the authenticated user
    // For now we just return the messages to the client to be merged into UI; in the future we could persist them server-side
    return res.json({ imported: true, messages: payload.messages });
});

module.exports = router;
