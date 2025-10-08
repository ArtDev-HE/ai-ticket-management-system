/*
  Simple smoke test script for frontend-backend integration.
  Usage: node scripts/smokeTests.js
  Ensure you run this from the frontend folder: frontend/ai_management_ticket_system
  Requires: node (v16+), npm install axios
*/

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

// Dev auth: if backend exposes /api/auth/dev-login use it, otherwise use a dev token fallback
const DEV_TOKEN_FALLBACK = 'dev-token-x-please-replace';
async function ensureDevAuth() {
    try {
        // Try backend dev-login endpoint
        const res = await api.post('/api/auth/dev-login', { username: 'dev', password: 'dev' });
        if (res && res.data && res.data.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            return;
        }
    } catch (e) {
        // ignore, we'll fallback
    }
    // Fallback: set a static dev token in header
    api.defaults.headers.common['Authorization'] = `Bearer ${DEV_TOKEN_FALLBACK}`;
}

async function run() {
    try {
        console.log('1) Health check');
        const h = await api.get('/health');
        console.log('   health:', h.data);

        console.log('\n2) List tickets (should return array)');
        const list = await api.get('/api/tickets', { params: { limit: 5 } });
        console.log('   tickets count:', Array.isArray(list.data) ? list.data.length : (list.data?.length || 0));

        // Ensure test procedure exists so KPIs submission won't fail
        const testProcedureCode = 'PROC-001';
        try {
            await api.get(`/api/procedimientos/${testProcedureCode}`);
            console.log('\n(Procedure exists)');
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log('\n(Procedure not found) Creating test procedure...');
                const procPayload = {
                    id: 'PROC-' + Math.random().toString(36).slice(2, 9),
                    codigo: testProcedureCode,
                    nombre: 'Smoke Test Procedure',
                    descripcion: 'Auto-created by smokeTests',
                    tiempo_estimado_horas: 2,
                    complejidad: 'BAJA',
                    departamento_id: null,
                    activo: true,
                    recursos: {},
                    kpis: {},
                    responsabilidades: {},
                    validaciones: {}
                };
                try {
                    const createdProc = await api.post('/api/procedimientos', procPayload);
                    console.log('   created procedure:', createdProc.data.codigo || createdProc.data);
                } catch (err) {
                    console.error('   failed creating procedure:', err.response ? err.response.data : err.message);
                    throw err;
                }
            } else {
                console.error('   error checking procedure:', e.response ? e.response.data : e.message);
                throw e;
            }
        }

        console.log('\n3) Create ticket');
        const ticketId = 'TKT-' + uuidv4().split('-')[0];
        const newTicket = {
            id: ticketId,
            codigo_actividad: 'ACT-001',
            codigo_linea_trabajo: 'LT-001',
            codigo_procedimiento: testProcedureCode,
            titulo: 'Smoke test ticket',
            descripcion: 'Created by smokeTests.js',
            asignado_a: null,
            asignado_por: 'EMP-001',
            tiempo_estimado: 4,
            flujo: {},
            hitos: [{ porcentaje: 50, completado: false }, { porcentaje: 100, completado: false }],
            kpis: {},
            recursos: {},
            metadatos: {},
            triggers: []
        };

        const created = await api.post('/api/tickets', newTicket);
        console.log('   created id:', created.data.id);

        console.log('\n4) Accept ticket (employee accepts)');
        const accept = await api.patch(`/api/tickets/${ticketId}/accept`, { empleado_id: 'EMP-001' });
        console.log('   accepted ticket estado:', accept.data.estado);

        console.log('\n5) Update hito 100% (complete)');
        const hito = await api.patch(`/api/tickets/${ticketId}/hito`, { porcentaje: 100, completado: true });
        console.log('   new estado (should be EN_REVISION):', hito.data.estado);

        console.log('\n6) Submit KPIs (dummy)');
        const kpis = await api.post(`/api/tickets/${ticketId}/kpis`, { kpis_especificos: {} });
        console.log('   kpi summary:', kpis.data.kpi_summary || kpis.data);

        console.log('\n7) Review (approve)');
        const review = await api.post(`/api/tickets/${ticketId}/review`, {
            revisor_id: 'EMP-999',
            accion: 'aprobar',
            feedback: 'Looks good',
            hito_porcentaje: 100
        });
        console.log('   review response:', review.data.message || review.data);

        console.log('\n8) Employee analytics (if any)');
        const analytics = await api.get('/api/analytics/employee/EMP-001');
        console.log('   analytics keys:', Object.keys(analytics.data || {}));

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
