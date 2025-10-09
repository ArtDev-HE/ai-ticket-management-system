const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Simple dev JWT login
// Fast-path for development: accepts username/password (no DB) and issues a JWT embedding employeeId.
// Guarded: if NODE_ENV==='production' and ALLOW_DEV_AUTH is not true, this route will refuse to run.
// POST /api/auth/login - dev fast-path or real flow when DB users exist
router.post('/login', async (req, res) => {
    const { username, password, employeeId } = req.body || {};
    const allowDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_AUTH === 'true';
    if (!allowDev) return res.status(403).json({ error: 'Dev login disabled' });

    // Try to find a user in DB first (if a users table exists). This allows seeds to create a hashed user.
    try {
        // Note: the project may not have a users table. We attempt a safe query and fall back to in-memory dev path.
        const userResult = await pool.query("SELECT id, username, password_hash, employee_id FROM users WHERE username = $1 LIMIT 1", [username || 'dev']);
        if (userResult && userResult.rows && userResult.rows.length > 0) {
            const user = userResult.rows[0];
            // Compare provided password with stored hash
            const ok = await bcrypt.compare(password || '', user.password_hash || '');
            if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

            const payload = { sub: user.username || user.id || 'dev', employeeId: user.employee_id || employeeId || process.env.DEV_EMPLOYEE_ID || null };
            const secret = process.env.JWT_SECRET || 'dev-jwt-secret-please-change';
            const token = jwt.sign(payload, secret, { expiresIn: '8h' });
            return res.json({ token, expiresIn: 8 * 3600 });
        }
    } catch (e) {
        // If users table doesn't exist or query fails, fall back to dev fast-path
        // console.debug('User lookup failed (falling back to dev fast-path):', e.message);
    }

    // Dev fast-path: no DB user found — derive employeeId from username if possible
    const normalized = (username || '').toLowerCase();
    // Disallow the generic 'dev' account to prevent accidental use
    if (normalized === 'dev') {
        return res.status(403).json({ error: 'Generic dev account disabled. Create a seeded user or enable an explicit dev account.' });
    }
    let inferredEmployeeId = null;
    if (/emp-?test/i.test(normalized) || normalized === 'emp-test' || normalized === 'emp_test') inferredEmployeeId = process.env.DEV_EMPLOYEE_ID || 'EMP-TEST';
    if (/emp-?0?01/i.test(normalized) || normalized === 'emp-001' || normalized === 'emp001') inferredEmployeeId = 'EMP-001';
    const payload = {
        sub: username || 'dev',
        employeeId: employeeId || inferredEmployeeId || process.env.DEV_EMPLOYEE_ID || null
    };

    const secret = process.env.JWT_SECRET || 'dev-jwt-secret-please-change';
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });
    return res.json({ token, expiresIn: 8 * 3600 });
});

// Protected endpoint to return current user + employee mapping
const verifyJwt = require('../middleware/verifyJwt');
router.get('/me', verifyJwt, (req, res) => {
    const user = req.user || {};
    return res.json({ user: { id: user.sub }, employeeId: user.employeeId || null });
});

module.exports = router;
