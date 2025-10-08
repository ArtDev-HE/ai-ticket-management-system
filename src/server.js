const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// Import routes
const ticketRoutes = require('./routes/tickets');
const procedimientosRoutes = require('./routes/procedimientos');
const empleadosRoutes = require('./routes/empleados');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✓ Database connected successfully');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/procedimientos', procedimientosRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints available:`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/tickets`);
  console.log(`   - PATCH /api/tickets/:id/request-reassignment`);
  console.log(`   - POST /api/tickets/:id/review`);
  console.log(`   - POST /api/tickets/:id/kpis`);
  console.log(`   - PATCH /api/tickets/:id/pause`);
  console.log(`   - PATCH /api/tickets/:id/resume`);
  console.log(`   - GET  /api/procedimientos`);
  console.log(`   - GET  /api/empleados`);
  console.log(`   - GET  /api/empleados/:id/workload`);
  console.log(`   - GET  /api/analytics/employee/:id`);
  console.log(`   - GET  /api/analytics/procedure/:codigo`);
  console.log(`   - GET  /api/analytics/department/:id`);
  console.log(`   - GET  /api/analytics/linea/:id`);
});

module.exports = app;