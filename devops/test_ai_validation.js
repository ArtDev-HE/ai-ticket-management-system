// Devops copy of test_ai_validation.js
// This script is for local testing and will refuse to run in production unless ALLOW_DEV_TESTS=true

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run dev test in production.');
  process.exit(1);
}
if (process.env.ALLOW_DEV_TESTS !== 'true') {
  console.error('To run this validation test, set ALLOW_DEV_TESTS=true in your environment. Example (PowerShell):');
  console.error("$Env:ALLOW_DEV_TESTS='true'; node devops/test_ai_validation.js");
  process.exit(1);
}

const fetch = require('node-fetch');
const express = require('express');
const app = express();

app.use(express.json());

// Mock n8n endpoint that returns an invalid descriptor (missing 'text')
app.post('/mock-n8n', (req, res) => {
    return res.json({ visualization: { key: 12345, data: 'not-an-array' } });
});

const server = app.listen(4010, async () => {
    console.log('Mock n8n listening on http://localhost:4010/mock-n8n (dev only)');

    // Call our backend /api/ai/query pointing to the mock n8n
    try {
        const backendUrl = 'http://localhost:3000/api/ai/query';
        process.env.N8N_WEBHOOK_URL = 'http://localhost:4010/mock-n8n';

        const res = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Test invalid descriptor' })
        });
        const json = await res.json();
        console.log('Backend response:', json);

        if (json && typeof json.text === 'string') {
            console.log('✅ Fallback behavior working: received safe descriptor with text.');
            process.exit(0);
        } else {
            console.error('❌ Unexpected backend response; expected fallback descriptor with text.');
            process.exit(2);
        }
    } catch (err) {
        console.error('Error during test:', err);
        process.exit(3);
    } finally {
        server.close();
    }
});