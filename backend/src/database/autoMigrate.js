const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function ensureColumnsExist() {
  // 1. Columnas en ventas
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM ventas LIKE 'monto_efectivo'");
    if (!cols || cols.length === 0) {
      await db.query(`
        ALTER TABLE ventas 
        ADD COLUMN monto_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER metodo_pago,
        ADD COLUMN monto_tarjeta DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER monto_efectivo,
        ADD COLUMN monto_transferencia DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER monto_tarjeta
      `);
      console.log('✅ [Auto-Migrate] Columnas de desglose (monto_efectivo, monto_tarjeta, monto_transferencia) agregadas a ventas.');
    }
  } catch (err) {
    console.warn('⚠️ [Auto-Migrate] Verificación de columnas en ventas:', err.message);
  }

  // 2. Columna en usuarios
  try {
    const [modulosCol] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'modulos_permitidos'");
    if (!modulosCol || modulosCol.length === 0) {
      await db.query("ALTER TABLE usuarios ADD COLUMN modulos_permitidos JSON NULL DEFAULT NULL AFTER estado");
      await db.query("UPDATE usuarios SET modulos_permitidos = '[\"pos\",\"inventario\",\"etiquetas\",\"ventas\",\"clientes\"]' WHERE rol_id = 2");
      await db.query("UPDATE usuarios SET modulos_permitidos = '[\"pos\",\"inventario\",\"etiquetas\",\"ventas\",\"clientes\",\"caja\",\"compras\",\"devoluciones\",\"finanzas\",\"reportes\",\"reclutamiento\",\"configuracion\",\"usuarios\",\"logs\"]' WHERE rol_id = 1");
      console.log('✅ [Auto-Migrate] Columna modulos_permitidos agregada a usuarios.');
    }
  } catch (err) {
    console.warn('⚠️ [Auto-Migrate] Verificación de modulos_permitidos en usuarios:', err.message);
  }

  // 3. Columna imagen_url en productos
  try {
    const [imgCol] = await db.query("SHOW COLUMNS FROM productos LIKE 'imagen_url'");
    if (!imgCol || imgCol.length === 0) {
      await db.query("ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(500) NULL AFTER precio_con_descuento");
      console.log('✅ [Auto-Migrate] Columna imagen_url agregada a productos.');
    }
  } catch (err) {}

  // 4. Columna imagen_url en variantes_producto
  try {
    const [varImgCol] = await db.query("SHOW COLUMNS FROM variantes_producto LIKE 'imagen_url'");
    if (!varImgCol || varImgCol.length === 0) {
      await db.query("ALTER TABLE variantes_producto ADD COLUMN imagen_url VARCHAR(255) NULL AFTER stock_minimo");
      console.log('✅ [Auto-Migrate] Columna imagen_url agregada a variantes_producto.');
    }
  } catch (err) {}

  // 5. Columna turno_caja_id en gastos_financieros
  try {
    const [turnoCol] = await db.query("SHOW COLUMNS FROM gastos_financieros LIKE 'turno_caja_id'");
    if (!turnoCol || turnoCol.length === 0) {
      await db.query("ALTER TABLE gastos_financieros ADD COLUMN turno_caja_id INT NULL AFTER usuario_id, ADD INDEX idx_gastos_turno (turno_caja_id)");
      console.log('✅ [Auto-Migrate] Columna turno_caja_id agregada a gastos_financieros.');
    }
  } catch (err) {
    console.warn('⚠️ [Auto-Migrate] Verificación de turno_caja_id en gastos_financieros:', err.message);
  }
}

async function checkAndRunAutoMigration() {
  try {
    // Verificar si la tabla usuarios ya existe
    const [rows] = await db.query("SHOW TABLES LIKE 'usuarios'");
    if (rows && rows.length > 0) {
      // Ya existen tablas, aseguramos columnas adicionales necesarias
      await ensureColumnsExist();
      return;
    }

    console.log('🔄 [Auto-Migrate] No se encontraron tablas. Inicializando esquema de base de datos...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');
      // Remover sentencias de creación de BD específica para respetar la BD activa de Railway o local
      schemaSql = schemaSql
        .replace(/CREATE DATABASE IF NOT EXISTS `?[a-zA-Z0-9_-]+`?[^;]*;/gi, '')
        .replace(/USE `?[a-zA-Z0-9_-]+`?;/gi, '');

      // Ejecutar declaraciones una a una o por bloques
      const statements = schemaSql
        .split(/;\s*[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const sql of statements) {
        try {
          await db.query(sql);
        } catch (e) {
          if (!e.message.includes('already exists') && !e.message.includes('Duplicate')) {
            console.warn(`[Auto-Migrate Schema Warning]: ${e.message}`);
          }
        }
      }
      console.log('✅ [Auto-Migrate] Tablas del esquema creadas exitosamente.');
    }

    // Ejecutar seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      let seedSql = fs.readFileSync(seedPath, 'utf8');
      seedSql = seedSql.replace(/USE `?[a-zA-Z0-9_-]+`?;/gi, '');

      const seedStatements = seedSql
        .split(/;\s*[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const sql of seedStatements) {
        try {
          await db.query(sql);
        } catch (e) {
          if (!e.message.includes('Duplicate')) {
            console.warn(`[Auto-Migrate Seed Warning]: ${e.message}`);
          }
        }
      }
      console.log('🌱 [Auto-Migrate] Datos iniciales y usuarios creados exitosamente (admin@opalo.hn / Admin123!).');
    }

    // Asegurar columnas de todas las tablas
    await ensureColumnsExist();

  } catch (err) {
    console.error('❌ [Auto-Migrate Error]:', err.message);
  }
}

module.exports = { checkAndRunAutoMigration };
