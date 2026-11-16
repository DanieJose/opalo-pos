const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function runMigration() {
  console.log('[Migración] Iniciando migración de permisos granulares por módulo para cajeros y usuarios...');
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'modulos_permitidos'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE usuarios ADD COLUMN modulos_permitidos JSON NULL DEFAULT NULL AFTER rol_id");
      console.log('✓ Columna "modulos_permitidos" agregada exitosamente a la tabla "usuarios".');
    } else {
      console.log('ℹ Columna "modulos_permitidos" ya existe en la tabla "usuarios".');
    }

    // Módulos por defecto para cajeros
    const defaultCashierModules = JSON.stringify(['pos', 'inventario', 'etiquetas', 'ventas', 'clientes']);
    await db.query(
      "UPDATE usuarios SET modulos_permitidos = ? WHERE rol_id = 2 AND modulos_permitidos IS NULL",
      [defaultCashierModules]
    );
    console.log('✓ Permisos por defecto asignados a usuarios Cajeros existentes.');

    // Módulos para administradores (acceso total)
    const allModules = JSON.stringify([
      'pos', 'inventario', 'etiquetas', 'ventas', 'clientes',
      'proveedores', 'finanzas', 'reportes', 'reclutamiento',
      'usuarios', 'logs', 'configuracion'
    ]);
    await db.query(
      "UPDATE usuarios SET modulos_permitidos = ? WHERE rol_id = 1 AND modulos_permitidos IS NULL",
      [allModules]
    );
    console.log('✓ Permisos totales asignados a Administradores.');

    const [users] = await db.query(
      "SELECT u.id, u.nombre, u.email, r.nombre AS rol_nombre, u.modulos_permitidos FROM usuarios u INNER JOIN roles r ON u.rol_id = r.id"
    );
    console.log('Usuarios y sus permisos actuales:');
    users.forEach(u => {
      console.log(`- [${u.rol_nombre}] ${u.nombre}:`, u.modulos_permitidos);
    });

    console.log('[Migración] Finalizada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

runMigration();
