const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'opalo_pos_db'
  });

  const [cols] = await pool.query("SHOW COLUMNS FROM productos LIKE 'imagen_url'");
  if (cols.length === 0) {
    await pool.query("ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(500) NULL AFTER precio_base");
    console.log('Columna imagen_url agregada exitosamente a la tabla productos');
  } else {
    console.log('Columna imagen_url ya existe en la tabla productos');
  }

  await pool.end();
}

run().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

