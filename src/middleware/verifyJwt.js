const jwt = require('jsonwebtoken');

module.exports = function verifyJwt(req, res, next) {
    const auth = req.headers.authorization || '';
    const match = auth.match(/^Bearer (.+)$/i);
    if (!match) return res.status(401).json({ error: 'Missing Authorization header' });
    const token = match[1];
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret-please-change';
    try {
        const payload = jwt.verify(token, secret);
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
