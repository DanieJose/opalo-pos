require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3307', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'opalo_pos_db';

  console.log(`Conectando a MySQL en ${host}:${port}...`);
  const db = await mysql.createConnection({ host, port, user, password, database });

  // 1. Ampliar estados de ventas para incluir devoluciones
  await db.query(`
    ALTER TABLE ventas 
    MODIFY COLUMN estado ENUM('COMPLETADA', 'ANULADA', 'PENDIENTE', 'DEVOLUCION_PARCIAL', 'DEVUELTA') NOT NULL DEFAULT 'COMPLETADA'
  `);
  console.log('Estados de tabla ventas actualizados con DEVOLUCION_PARCIAL y DEVUELTA.');

  // 2. Crear tabla devoluciones
  await db.query(`
    CREATE TABLE IF NOT EXISTS devoluciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venta_id INT NOT NULL,
      numero_devolucion VARCHAR(50) NOT NULL UNIQUE,
      usuario_id INT NOT NULL,
      cliente_id INT NULL,
      monto_subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      monto_isv_15 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      monto_isv_18 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      monto_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      motivo VARCHAR(150) NOT NULL DEFAULT 'Cambio de prenda',
      metodo_reembolso ENUM('EFECTIVO', 'TRANSFERENCIA', 'NOTA_CREDITO', 'SALDO_A_FAVOR') NOT NULL DEFAULT 'EFECTIVO',
      observaciones TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_devoluciones_venta FOREIGN KEY (venta_id) REFERENCES ventas (id) ON UPDATE CASCADE,
      CONSTRAINT fk_devoluciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE,
      CONSTRAINT fk_devoluciones_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL ON UPDATE CASCADE,
      INDEX idx_devoluciones_fecha (created_at),
      INDEX idx_devoluciones_venta (venta_id),
      INDEX idx_devoluciones_numero (numero_devolucion)
    ) ENGINE=InnoDB;
  `);
  console.log('Tabla devoluciones creada/verificada exitosamente.');

  // 3. Crear tabla detalle_devoluciones
  await db.query(`
    CREATE TABLE IF NOT EXISTS detalle_devoluciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      devolucion_id INT NOT NULL,
      detalle_venta_id INT NULL,
      variante_id INT NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(10, 2) NOT NULL,
      descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      subtotal DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_det_dev_devolucion FOREIGN KEY (devolucion_id) REFERENCES devoluciones (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_det_dev_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto (id) ON UPDATE CASCADE,
      CONSTRAINT fk_det_dev_det_venta FOREIGN KEY (detalle_venta_id) REFERENCES detalle_ventas (id) ON DELETE SET NULL ON UPDATE CASCADE,
      INDEX idx_det_dev_devolucion (devolucion_id),
      INDEX idx_det_dev_variante (variante_id)
    ) ENGINE=InnoDB;
  `);
  console.log('Tabla detalle_devoluciones creada/verificada exitosamente.');

  await db.end();
  console.log('Migración de devoluciones completada con éxito.');
}

migrate().catch(err => {
  console.error('Error durante la migración de devoluciones:', err);
  process.exit(1);
});

