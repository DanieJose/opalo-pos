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

  // 1. Agregar isv_18_porcentaje a configuracion_empresa
  const [colsConfig] = await db.query("SHOW COLUMNS FROM configuracion_empresa LIKE 'isv_18_porcentaje'");
  if (colsConfig.length === 0) {
    await db.query(`
      ALTER TABLE configuracion_empresa 
      ADD COLUMN isv_18_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 18.00 AFTER isv_porcentaje
    `);
    console.log('Columna isv_18_porcentaje agregada a configuracion_empresa.');
  } else {
    console.log('Columna isv_18_porcentaje ya existe en configuracion_empresa.');
  }

  // 2. Agregar isv_18 a ventas
  const [colsVentas] = await db.query("SHOW COLUMNS FROM ventas LIKE 'isv_18'");
  if (colsVentas.length === 0) {
    await db.query(`
      ALTER TABLE ventas 
      ADD COLUMN isv_18 DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER isv_15
    `);
    console.log('Columna isv_18 agregada a ventas.');
  } else {
    console.log('Columna isv_18 ya existe en ventas.');
  }

  // 3. Agregar tipo_impuesto a productos
  const [colsProd] = await db.query("SHOW COLUMNS FROM productos LIKE 'tipo_impuesto'");
  if (colsProd.length === 0) {
    await db.query(`
      ALTER TABLE productos 
      ADD COLUMN tipo_impuesto ENUM('ISV_15', 'ISV_18', 'EXENTO') NOT NULL DEFAULT 'ISV_15' AFTER precio_base
    `);
    console.log('Columna tipo_impuesto agregada a productos.');
  } else {
    console.log('Columna tipo_impuesto ya existe en productos.');
  }

  // 4. Agregar tipo_impuesto e impuesto_monto a detalle_ventas
  const [colsDetalle] = await db.query("SHOW COLUMNS FROM detalle_ventas LIKE 'tipo_impuesto'");
  if (colsDetalle.length === 0) {
    await db.query(`
      ALTER TABLE detalle_ventas 
      ADD COLUMN tipo_impuesto ENUM('ISV_15', 'ISV_18', 'EXENTO') NOT NULL DEFAULT 'ISV_15' AFTER precio_unitario,
      ADD COLUMN impuesto_monto DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER subtotal
    `);
    console.log('Columnas tipo_impuesto e impuesto_monto agregadas a detalle_ventas.');
  } else {
    console.log('Columnas ya existen en detalle_ventas.');
  }

  await db.end();
  console.log('Migración de ISV 18% completada exitosamente.');
}

migrate().catch(err => {
  console.error('Error durante la migración de ISV 18%:', err);
  process.exit(1);
});

