const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function checkAndRunAutoMigration() {
  try {
    // Verificar si la tabla usuarios ya existe
    const [rows] = await db.query("SHOW TABLES LIKE 'usuarios'");
    if (rows && rows.length > 0) {
      // Ya existen tablas, aseguramos columnas adicionales si faltan
      try {
        const [modulosCol] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'modulos_permitidos'");
        if (!modulosCol || modulosCol.length === 0) {
          await db.query("ALTER TABLE usuarios ADD COLUMN modulos_permitidos JSON NULL DEFAULT NULL AFTER estado");
          console.log('[Auto-Migrate] Columna modulos_permitidos agregada a usuarios.');
        }
      } catch (err) {
        // Silencioso si falla verificación menor
      }
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

    // Asegurar columna modulos_permitidos
    try {
      const [modulosCol] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'modulos_permitidos'");
      if (!modulosCol || modulosCol.length === 0) {
        await db.query("ALTER TABLE usuarios ADD COLUMN modulos_permitidos JSON NULL DEFAULT NULL AFTER estado");
        await db.query("UPDATE usuarios SET modulos_permitidos = '[\"pos\",\"inventario\",\"etiquetas\",\"ventas\",\"clientes\"]' WHERE rol_id = 2");
        await db.query("UPDATE usuarios SET modulos_permitidos = '[\"pos\",\"inventario\",\"etiquetas\",\"ventas\",\"clientes\",\"caja\",\"compras\",\"devoluciones\",\"finanzas\",\"reportes\",\"reclutamiento\",\"configuracion\",\"usuarios\",\"logs\"]' WHERE rol_id = 1");
      }
    } catch (e) {}

  } catch (err) {
    console.error('❌ [Auto-Migrate Error]:', err.message);
  }
}

module.exports = { checkAndRunAutoMigration };
