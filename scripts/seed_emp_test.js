const pool = require('../src/config/db');
const { v4: uuidv4 } = require('uuid');

(async () => {
    try {
        console.log('Seeding EMP-TEST deterministic completed tickets...');

        const existing = await pool.query("SELECT COUNT(*) as cnt FROM tickets WHERE asignado_a = $1", ['EMP-TEST']);
        const count = parseInt(existing.rows[0].cnt, 10);
        if (count >= 5) {
            console.log('EMP-TEST already has', count, 'tickets. Skipping seeding.');
            process.exit(0);
        }

        const now = new Date();
        const tickets = [
            { titulo: 'Test ticket A', fecha_actualizado: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120), tiempo_estimado: 8, tiempo_real: 7 },
            { titulo: 'Test ticket B', fecha_actualizado: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90), tiempo_estimado: 6, tiempo_real: 5 },
            { titulo: 'Test ticket C', fecha_actualizado: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60), tiempo_estimado: 4, tiempo_real: 4 },
            { titulo: 'Test ticket D', fecha_actualizado: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), tiempo_estimado: 10, tiempo_real: 8 },
            { titulo: 'Test ticket E', fecha_actualizado: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), tiempo_estimado: 3, tiempo_real: 2 }
        ];

        for (const t of tickets) {
            const id = 'TKT-' + uuidv4().split('-')[0];
            // idempotent check by title and assigned
            const exists = await pool.query('SELECT id FROM tickets WHERE id = $1 OR (asignado_a = $2 AND titulo = $3) LIMIT 1', [id, 'EMP-TEST', t.titulo]);
            if (exists.rows.length > 0) {
                console.log('Skipping existing ticket:', t.titulo);
                continue;
            }

            await pool.query(
                `INSERT INTO tickets (
                             id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento,
                             titulo, descripcion, asignado_a, asignado_por,
                             estado, fecha_creacion, fecha_actualizado, tiempo_estimado, tiempo_real, eficiencia_temporal
                         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)` ,
                [
                    id,
                    'ACT-TEST',
                    'LINE-TEST',
                    'PROC-TEST',
                    t.titulo,
                    'Seeded test ticket',
                    'EMP-TEST',
                    'SYSTEM',
                    'COMPLETADO',
                    t.fecha_actualizado,
                    t.fecha_actualizado,
                    t.tiempo_estimado,
                    t.tiempo_real,
                    (t.tiempo_estimado / t.tiempo_real)
                ]
            );
            console.log('Inserted', id, t.titulo);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
})();
