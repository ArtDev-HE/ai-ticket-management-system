const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const Ajv = require('ajv');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv();
const schemaPath = path.join(__dirname, '..', 'schemas', 'aiDescriptor.schema.json');
let descriptorSchema = null;
try {
    descriptorSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (e) {
    // will validate later only if schema present
}
const validate = descriptorSchema ? ajv.compile(descriptorSchema) : null;

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 }); // 60 requests per minute

// Dev-only canned responses helper
function cannedResponseForPrompt(prompt) {
    const text = (prompt || '').toString();
    if (/EMP-[A-Za-z0-9_-]+/i.test(text) && /trend|efficien|efficiency/i.test(text)) {
        const emp = (text.match(/(EMP-[A-Za-z0-9_-]+)/i) || [])[1] || 'EMP-UNKNOWN';
        return {
            text: `Efficiency trend for ${emp}`,
            visualization: {
                key: 'trendline_efficiency',
                data: [
                    { date: '2025-01-01', value: 72 },
                    { date: '2025-02-01', value: 75 },
                    { date: '2025-03-01', value: 78 },
                    { date: '2025-04-01', value: 80 }
                ]
            },
            analytics: { employeeId: emp }
        };
    }

    // Default canned text-only response
    return { text: 'I could not identify a structured command; here is a text response.' };
}

// POST /api/ai/query
router.post('/query', limiter, async (req, res) => {
    const body = req.body || {};
    const prompt = body.prompt || body.text || '';

    // If dev mode or explicit flag, return canned response
    const useMock = process.env.USE_N8N_MOCK === 'true' || process.env.NODE_ENV !== 'production';
    if (useMock) {
        let resp = cannedResponseForPrompt(prompt);
        // validate if possible - if canned resp doesn't validate, fallback to a minimal safe descriptor
        if (validate) {
            const ok = validate(resp);
            if (!ok) {
                console.warn('AI descriptor failed schema validation in dev canned response', validate.errors);
                // fallback to the simplest safe descriptor (must include text)
                resp = { text: `Fallback descriptor for prompt: ${String(prompt).slice(0, 120)}` };
            }
        }
        return res.json(resp);
    }

    // Production: forward to N8N webhook if configured
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) return res.status(500).json({ error: 'AI backend not configured' });

    try {
        const fetchRes = await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        let json = await fetchRes.json();
        if (validate) {
            const ok = validate(json);
            if (!ok) {
                console.warn('AI descriptor failed schema validation', validate.errors);
                // Instead of failing the request, return a safe canned descriptor so callers still get a usable response
                json = cannedResponseForPrompt(prompt) || { text: `Fallback descriptor for prompt: ${String(prompt).slice(0, 120)}` };
            }
        }
        return res.json(json);
    } catch (err) {
        console.error('Error forwarding to n8n:', err);
        return res.status(502).json({ error: 'AI workflow request failed' });
    }
});

module.exports = router;
