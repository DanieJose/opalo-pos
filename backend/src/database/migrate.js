const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  console.log('💎 Ópalo Accesorios - Asistente de Inicialización de Base de Datos');
  console.log('📍 Conectando al servidor MySQL...');

  const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'opalo_pos_db';
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || null;

  let connection;
  try {
    if (dbUrl) {
      connection = await mysql.createConnection({
        uri: dbUrl,
        multipleStatements: true
      });
    } else {
      connection = await mysql.createConnection({
        host,
        user,
        password,
        port,
        multipleStatements: true
      });
    }

    console.log(`✅ Conexión establecida con MySQL (${host || 'vía URI'})`);

    // Asegurar base de datos activa
    if (database) {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`; USE \`${database}\`;`);
    }

    // Leer schema.sql adaptando el nombre de la BD si es necesario
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    if (database && database !== 'opalo_pos_db') {
      schemaSql = schemaSql
        .replace(/CREATE DATABASE IF NOT EXISTS `?opalo_pos_db`?[^;]*;/gi, '')
        .replace(/USE `?opalo_pos_db`?;/gi, `USE \`${database}\`;`);
    }

    console.log('⚙️ Ejecutando schema.sql (creación de base de datos y tablas)...');
    await connection.query(schemaSql);
    console.log('✅ Esquema creado exitosamente.');

    // Leer seed.sql adaptando el nombre de la BD si es necesario
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      let seedSql = fs.readFileSync(seedPath, 'utf8');
      if (database && database !== 'opalo_pos_db') {
        seedSql = seedSql.replace(/USE `?opalo_pos_db`?;/gi, `USE \`${database}\`;`);
      }
      console.log('🌱 Ejecutando seed.sql (datos iniciales de prueba y roles)...');
      await connection.query(seedSql);
      console.log('✅ Datos iniciales cargados exitosamente.');
    }

    console.log(`\n🎉 ¡Base de datos "${database}" lista para operar!`);
    console.log('Usuarios listos para usar:');
    console.log('  - Administrador: admin@opalo.hn / Admin123!');
    console.log('  - Cajero: caja1@opalo.hn / Admin123!');
  } catch (err) {
    console.error('❌ Error durante la migración de base de datos:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();

