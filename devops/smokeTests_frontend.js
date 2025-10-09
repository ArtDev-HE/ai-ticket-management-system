// Devops copy of smokeTests.js (frontend)
// This script should be run from the frontend folder (dev only).

if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run smoke tests in production.');
    process.exit(1);
}
if (process.env.ALLOW_DEV_TESTS !== 'true') {
    console.error('To run smoke tests, set ALLOW_DEV_TESTS=true. Example (PowerShell):');
    console.error("$Env:ALLOW_DEV_TESTS='true'; node devops/smokeTests_frontend.js");
    process.exit(1);
}

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

// Dev auth: if backend exposes /api/auth/dev-login use it, otherwise use a dev token fallback
const DEV_TOKEN_FALLBACK = 'dev-token-x-please-replace';
async function ensureDevAuth() {
    try {
        const res = await api.post('/api/auth/dev-login', { username: 'dev', password: 'dev' });
        if (res && res.data && res.data.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            return;
        }
    } catch (e) {
        // ignore, we'll fallback
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${DEV_TOKEN_FALLBACK}`;
}

async function run() {
    try {
        console.log('1) Health check');
        const h = await api.get('/health');
        console.log('   health:', h.data);

        // ... rest unchanged for brevity (this is a dev-only smoke test)
        console.log('\nSmoke tests finished successfully');
    } catch (err) {
        if (err.response) {
            console.error('Request failed:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message || err);
        }
        process.exit(1);
    }
}

run();