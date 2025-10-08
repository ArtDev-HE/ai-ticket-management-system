const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 6543,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

pool.on('error', (err) => {  
console.error('Unexpected idle client error', err);
  
// process.exit(-1); // optional

});
// Connection test

(async () => {  
try {
   const client = await pool.connect();    
try {
   const res = await client.query('SELECT 1 as connected');      
console.log('DB connected:', res.rows[0].connected); 
// should log: DB connected: 1
    } finally {
      client.release();
    }
  } 
catch (err) {  
console.error('Error connecting to DB:', err.message || err);
  }
})();
module.exports = pool;