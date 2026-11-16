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

  await db.query(`
    CREATE TABLE IF NOT EXISTS configuracion_empresa (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_empresa VARCHAR(150) NOT NULL DEFAULT 'Ópalo Accesorios',
      nombre_comercial VARCHAR(150) NULL DEFAULT 'Ópalo',
      rtn VARCHAR(30) NOT NULL DEFAULT '02091995001230',
      logo_url VARCHAR(500) NULL,
      telefono VARCHAR(50) NULL DEFAULT '+504 9876-5432',
      email VARCHAR(120) NULL DEFAULT 'contacto@opalo.hn',
      direccion TEXT NULL,
      ciudad VARCHAR(100) NULL DEFAULT 'Tocoa, Colón',
      pais VARCHAR(80) NULL DEFAULT 'Honduras',
      moneda_simbolo VARCHAR(10) NOT NULL DEFAULT 'L.',
      moneda_codigo VARCHAR(10) NOT NULL DEFAULT 'HNL',
      isv_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 15.00,
      cai_sar VARCHAR(120) NULL DEFAULT 'E54D7A-B981F2-9942B5-17C3D8-72AE10-94',
      rango_autorizado_sar VARCHAR(150) NULL DEFAULT '000-001-01-00000001 a 000-001-01-00050000',
      fecha_limite_emision DATE NULL,
      mensaje_ticket_pie TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  console.log('Tabla configuracion_empresa verificada/creada exitosamente.');

  // Verificar si ya existe el registro inicial id=1
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM configuracion_empresa');
  if (rows[0].total === 0) {
    await db.query(`
      INSERT INTO configuracion_empresa (
        id, nombre_empresa, nombre_comercial, rtn, logo_url, telefono, email,
        direccion, ciudad, pais, moneda_simbolo, moneda_codigo, isv_porcentaje,
        cai_sar, rango_autorizado_sar, fecha_limite_emision, mensaje_ticket_pie
      ) VALUES (
        1,
        'Ópalo Accesorios',
        'Ópalo',
        '02091995001230',
        NULL,
        '+504 9876-5432',
        'contacto@opalo.hn',
        'Barrio El Centro, Calle Principal, frente a Parque Central',
        'Tocoa, Colón',
        'Honduras',
        'L.',
        'HNL',
        15.00,
        'E54D7A-B981F2-9942B5-17C3D8-72AE10-94',
        '000-001-01-00000001 a 000-001-01-00050000',
        '2026-12-31',
        '¡Gracias por su compra en Ópalo Accesorios!\nPrendas y accesorios con estilo único.\nNo se aceptan devoluciones sin este recibo.'
      )
    `);
    console.log('Registro de configuración inicial de Ópalo insertado con éxito.');
  } else {
    console.log('Configuración de empresa existente encontrada.');
  }

  await db.end();
  console.log('Migración completada exitosamente.');
}

migrate().catch(err => {
  console.error('Error en la migración:', err);
  process.exit(1);
});

