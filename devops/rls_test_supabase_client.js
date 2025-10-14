#!/usr/bin/env node
// devops/rls_test_supabase_client.js
// Runs a quick RLS test using Supabase Auth + PostgREST endpoints.
// Requires these env vars to be set (do NOT paste secrets into chat):
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Node 18+ recommended (global fetch available).

function b64urlDecodeToJson(part) {
    // base64url -> base64
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    // pad
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const bin = Buffer.from(b64 + pad, 'base64').toString('utf8');
    try { return JSON.parse(bin); } catch (e) { return bin; }
}

async function main() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
        console.error('Missing one of SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in env');
        process.exit(1);
    }

    // Generate test user
    const email = `rls-test-${Date.now()}@example.com`;
    const password = `P@ssw0rd-${Math.floor(Math.random() * 9000) + 1000}`;
    console.log('Creating temp user:', email);

        // Create user via Admin API
        // Use the admin/users endpoint and include the 'apikey' header (required by Supabase)
        const createRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, email_confirm: true })
        });

    if (!createRes.ok) {
        console.error('Failed to create user:', createRes.status, await createRes.text());
        process.exit(1);
    }
    const created = await createRes.json();
    const uid = created.id || created.user && created.user.id || null;
    console.log('Created user id:', uid);

    // Sign in as the user (password grant)
    const tokenRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': ANON_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ username: email, password })
    });

    if (!tokenRes.ok) {
        console.error('Failed to sign in user:', tokenRes.status, await tokenRes.text());
        // cleanup user
        if (uid) await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${SERVICE_KEY}` } });
        process.exit(1);
    }

    const tokenJson = await tokenRes.json();
    const access_token = tokenJson.access_token;
    console.log('Access token obtained. Decoding payload...');
    const parts = access_token.split('.');
    const payload = parts.length >= 2 ? b64urlDecodeToJson(parts[1]) : null;
    console.log('Decoded token payload (inspect claims):\n', JSON.stringify(payload, null, 2));

    // Try an INSERT via PostgREST using the user's JWT (this will be subject to RLS)
    const testId = `T-RLS-SUP-CLIENT-${Date.now()}`;
    const ticket = {
        id: testId,
        codigo_actividad: 'ACT-1',
        codigo_linea_trabajo: 'LT-1',
        codigo_procedimiento: 'PROC-1',
        titulo: 'rls client insert test',
        descripcion: 'run from supabase client test',
        asignado_por: payload && payload.employee_id ? payload.employee_id : null,
        tiempo_estimado: 30
    };

    console.log('Attempting INSERT as the test user (this request is RLS-filtered)');
    const insertRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/tickets`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'apikey': ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(ticket)
    });

    console.log('INSERT status:', insertRes.status);
    try { console.log('INSERT response:', JSON.stringify(await insertRes.json(), null, 2)); } catch (e) { console.log('No JSON response'); }

    // Try an UPDATE (attempt to update the title) via PostgREST
    console.log('Attempting UPDATE as the test user (RLS-filtered)');
    const updateRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/tickets?id=eq.${encodeURIComponent(testId)}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'apikey': ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ titulo: 'rls client update test' })
    });

    console.log('UPDATE status:', updateRes.status);
    try { console.log('UPDATE response:', JSON.stringify(await updateRes.json(), null, 2)); } catch (e) { console.log('No JSON response'); }

    // Cleanup: delete inserted row (attempt via service key) and delete user
    console.log('Cleaning up: deleting test row and user');
    await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/tickets?id=eq.${encodeURIComponent(testId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': ANON_KEY }
    });

    if (uid) {
        await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${SERVICE_KEY}` } });
        console.log('Deleted temp user', uid);
    }

    console.log('Done. Review the decoded token payload and insert/update responses above to verify RLS behavior.');
}

main().catch(err => { console.error(err); process.exit(1); });
