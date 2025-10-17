#!/usr/bin/env node
// devops/make_and_use_jwt.js
// Create a JWT signed with SUPABASE_JWT_SECRET containing custom claims
// (role, employee_id, department_id) and call PostgREST /rest/v1/tickets with it.
// Usage:
//   1) npm install jsonwebtoken
//   2) set env: SUPABASE_URL, SUPABASE_ANON_KEY (optional but recommended), SUPABASE_JWT_SECRET
//   3) node devops/make_and_use_jwt.js [--role=employee|director] [--employee_id=EMP-1] [--department_id=DEP-1] [--sub=<user-uuid>]

const jwt = require('jsonwebtoken');

// prefer global fetch (Node 18+), fallback to node-fetch if available
let fetchFn = global.fetch;
if (!fetchFn) {
    try {
        // node-fetch v2 exports a function
        fetchFn = require('node-fetch');
    } catch (e) {
        console.error('No global fetch available and node-fetch is not installed. Install Node 18+ or run: npm install node-fetch');
        process.exit(1);
    }
}

function parseArgs() {
    const args = process.argv.slice(2);
    const out = {};
    args.forEach(a => {
        const m = a.match(/^--([^=]+)=(.*)$/);
        if (m) out[m[1]] = m[2];
    });
    return out;
}

async function main() {
    const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
    const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

    if (!SUPABASE_URL || !JWT_SECRET) {
        console.error('Missing required env vars. Set SUPABASE_URL and SUPABASE_JWT_SECRET (and optionally SUPABASE_ANON_KEY).');
        process.exit(1);
    }

    const opts = parseArgs();
    const role = (opts.role || 'employee');
    const employee_id = opts.employee_id || 'EMP-TEST-1';
    const department_id = opts.department_id || 'DEP-1';
    const sub = opts.sub || undefined; // optional user id

    const now = Math.floor(Date.now() / 1000);
    const payload = Object.assign({},
        sub ? { sub } : {},
        {
            role,
            employee_id,
            department_id,
            iat: now,
            exp: now + 3600
        }
    );

    console.log('Signing JWT with payload:', JSON.stringify(payload));
    const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
    console.log('Token created (first 80 chars):', token.slice(0, 80) + '...');

    // Prepare a sample ticket
    const ticket = {
        id: `T-RLS-JWT-${Date.now()}`,
        codigo_actividad: 'ACT-1',
        codigo_linea_trabajo: 'LT-1',
        codigo_procedimiento: 'PROC-1',
        titulo: `rls jwt insert (${role})`,
        descripcion: 'insert via custom JWT test',
        asignado_por: employee_id,
        tiempo_estimado: 5
    };

    const url = `${SUPABASE_URL}/rest/v1/tickets`;
    console.log('Calling PostgREST URL:', url);

    const res = await fetchFn(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            apikey: ANON_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
        },
        body: JSON.stringify(ticket)
    });

    console.log('Status:', res.status);
    try {
        const body = await res.json();
        console.log('Body:', JSON.stringify(body, null, 2));
    } catch (e) {
        console.log('No JSON body or failed to parse response');
    }

    // If success, optionally delete the inserted row using anon/service key
    if (res.status >= 200 && res.status < 300) {
        console.log('Insert succeeded. If you want to clean up, delete the inserted id above via the admin/service key.');
    } else {
        console.log('Insert failed or was denied by RLS. Check policies and claim names.');
    }
}

main().catch(err => { console.error(err); process.exit(1); });
