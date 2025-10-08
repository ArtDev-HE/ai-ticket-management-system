const express = require('express');
const router = express.Router();

// Dev-only login endpoint
// Returns a static dev token for local development. DO NOT USE IN PRODUCTION.
router.post('/dev-login', (req, res) => {
    // Optional: accept username/password body but ignore them
    const devToken = process.env.DEV_AUTH_TOKEN || 'dev-token-x-please-replace';
    return res.json({ token: devToken });
});

module.exports = router;
