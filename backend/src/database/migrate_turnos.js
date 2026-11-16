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

  const sql = `
    CREATE TABLE IF NOT EXISTS turnos_caja (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      monto_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      monto_final_esperado DECIMAL(10, 2) NULL,
      monto_final_real DECIMAL(10, 2) NULL,
      diferencia DECIMAL(10, 2) NULL,
      estado ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'ABIERTA',
      fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_cierre TIMESTAMP NULL,
      notas VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_turnos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE,
      INDEX idx_turnos_usuario (usuario_id),
      INDEX idx_turnos_estado (estado),
      INDEX idx_turnos_fecha (fecha_apertura)
    ) ENGINE=InnoDB;
  `;

  await pool.query(sql);
  console.log('Tabla turnos_caja creada exitosamente en opalo_pos_db');
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error migrando turnos_caja:', err);
  process.exit(1);
});

