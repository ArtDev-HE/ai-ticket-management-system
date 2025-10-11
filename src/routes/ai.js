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

    // Decide whether to forward to n8n or use the built-in mock/canned responses.
    // USE_N8N env controls whether the server attempts to contact an n8n webhook.
    const useN8n = process.env.USE_N8N === 'true';
    const allowMock = process.env.USE_N8N_MOCK === 'true' || process.env.NODE_ENV !== 'production';

    // If n8n is disabled or mock explicitly requested, return canned response (validated when possible)
    if (!useN8n || allowMock) {
        let resp = cannedResponseForPrompt(prompt);
        if (validate) {
            try {
                const ok = validate(resp);
                if (!ok) {
                    console.warn('AI descriptor failed schema validation in canned response', validate.errors);
                    resp = { text: `Fallback descriptor for prompt: ${String(prompt).slice(0, 120)}` };
                }
            } catch (err) {
                console.warn('Validator threw while validating canned response', err && err.stack ? err.stack : err);
                resp = { text: `Fallback descriptor for prompt: ${String(prompt).slice(0, 120)}` };
            }
        }
        return res.json(resp);
    }

    // Forward to configured n8n webhook endpoint
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) return res.status(500).json({ error: 'AI backend not configured (N8N_WEBHOOK_URL missing)' });

    // Optional auth token for n8n webhook
    const n8nAuth = process.env.N8N_WEBHOOK_AUTH_TOKEN;
    const timeoutMs = parseInt(process.env.N8N_REQUEST_TIMEOUT_MS || '7000', 10);

    // Use AbortController to implement timeout for node-fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (n8nAuth) headers['Authorization'] = `Bearer ${n8nAuth}`;

        const fetchRes = await fetch(n8nUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, meta: { source: 'backend-proxy' } }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        // If the remote returned a non-2xx, treat as error but try to parse JSON body for more info
        if (!fetchRes.ok) {
            let textBody = '';
            try { textBody = await fetchRes.text(); } catch (e) { /* ignore */ }
            console.warn('n8n webhook returned non-2xx', fetchRes.status, textBody);
            // fall back to canned response rather than failing clients
            const fallback = cannedResponseForPrompt(prompt);
            return res.json(fallback);
        }

        let json = null;
        try {
            json = await fetchRes.json();
        } catch (e) {
            console.warn('Failed to parse JSON from n8n webhook response', e && e.stack ? e.stack : e);
            return res.json(cannedResponseForPrompt(prompt));
        }

        if (validate) {
            try {
                const ok = validate(json);
                if (!ok) {
                    console.warn('AI descriptor from n8n failed schema validation', validate.errors);
                    return res.json(cannedResponseForPrompt(prompt));
                }
            } catch (err) {
                console.warn('Validator threw while validating n8n response', err && err.stack ? err.stack : err);
                return res.json(cannedResponseForPrompt(prompt));
            }
        }

        return res.json(json);
    } catch (err) {
        clearTimeout(timeout);
        // If fetch was aborted due to timeout, produce a helpful log and fallback
        if (err && err.name === 'AbortError') {
            console.error('n8n request timed out after', timeoutMs, 'ms');
            return res.json(cannedResponseForPrompt(prompt));
        }
        console.error('Error forwarding to n8n webhook:', err && err.stack ? err.stack : err);
        return res.status(502).json({ error: 'AI workflow request failed' });
    }
});

module.exports = router;
