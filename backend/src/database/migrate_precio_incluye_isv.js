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

  try {
    // 1. Agregar precio_incluye_isv a productos
    const [colsProd] = await db.query("SHOW COLUMNS FROM productos LIKE 'precio_incluye_isv'");
    if (colsProd.length === 0) {
      await db.query(`
        ALTER TABLE productos 
        ADD COLUMN precio_incluye_isv TINYINT(1) NOT NULL DEFAULT 0 AFTER tipo_impuesto
      `);
      console.log('✅ Columna precio_incluye_isv agregada a productos.');
    } else {
      console.log('ℹ️ Columna precio_incluye_isv ya existe en productos.');
    }

    // 2. Agregar precio_incluye_isv a variantes_producto (para consistencia si se requiere)
    const [colsVar] = await db.query("SHOW COLUMNS FROM variantes_producto LIKE 'precio_incluye_isv'");
    if (colsVar.length === 0) {
      await db.query(`
        ALTER TABLE variantes_producto 
        ADD COLUMN precio_incluye_isv TINYINT(1) NOT NULL DEFAULT 0 AFTER precio_venta
      `);
      console.log('✅ Columna precio_incluye_isv agregada a variantes_producto.');
    } else {
      console.log('ℹ️ Columna precio_incluye_isv ya existe en variantes_producto.');
    }

    // 3. Agregar precio_incluye_isv a detalle_ventas
    const [colsDetalle] = await db.query("SHOW COLUMNS FROM detalle_ventas LIKE 'precio_incluye_isv'");
    if (colsDetalle.length === 0) {
      await db.query(`
        ALTER TABLE detalle_ventas 
        ADD COLUMN precio_incluye_isv TINYINT(1) NOT NULL DEFAULT 0 AFTER tipo_impuesto
      `);
      console.log('✅ Columna precio_incluye_isv agregada a detalle_ventas.');
    } else {
      console.log('ℹ️ Columna precio_incluye_isv ya existe en detalle_ventas.');
    }

    console.log('🎉 Migración precio_incluye_isv completada con éxito.');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();

