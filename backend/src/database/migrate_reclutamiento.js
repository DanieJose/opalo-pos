const mysql = require('mysql2/promise');

async function migrate() {
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'opalo_pos_db'
  });

  console.log('Conectado a MySQL...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS vacantes_empleo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      departamento VARCHAR(80) NOT NULL DEFAULT 'Ventas',
      ubicacion VARCHAR(120) NOT NULL DEFAULT 'Tocoa, Colón',
      tipo_contrato ENUM('TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'TEMPORAL', 'POR_TEMPORADA') DEFAULT 'TIEMPO_COMPLETO',
      salario_ofrecido VARCHAR(80) NULL,
      descripcion TEXT NOT NULL,
      requisitos TEXT NULL,
      beneficios TEXT NULL,
      estado ENUM('ABIERTA', 'CERRADA', 'PAUSADA') NOT NULL DEFAULT 'ABIERTA',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
  console.log('Tabla vacantes_empleo lista.');

  await db.query(`
    CREATE TABLE IF NOT EXISTS candidatos_postulaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vacante_id INT NULL,
      nombre_completo VARCHAR(150) NOT NULL,
      identidad_dni VARCHAR(30) NULL,
      telefono VARCHAR(30) NOT NULL,
      email VARCHAR(120) NULL,
      ciudad_direccion VARCHAR(200) NULL,
      puesto_interes VARCHAR(150) NULL,
      experiencia_previa TEXT NULL,
      cv_archivo_url VARCHAR(500) NOT NULL,
      estado ENUM('NUEVO', 'EN_REVISION', 'ENTREVISTA', 'CONTRATADO', 'DESCARTADO') NOT NULL DEFAULT 'NUEVO',
      notas_internas TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_postulaciones_vacante FOREIGN KEY (vacante_id) REFERENCES vacantes_empleo (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);
  console.log('Tabla candidatos_postulaciones lista.');

  const [rows] = await db.query('SELECT COUNT(*) AS total FROM vacantes_empleo');
  if (rows[0].total === 0) {
    await db.query(`
      INSERT INTO vacantes_empleo (titulo, departamento, ubicacion, tipo_contrato, salario_ofrecido, descripcion, requisitos, beneficios, estado)
      VALUES 
      ('Cajera & Asesora de Ventas de Moda', 'Ventas & Mostrador', 'Tocoa, Colón', 'TIEMPO_COMPLETO', 'L. 11,500 - L. 13,000 + Comisión', 
       'Buscamos una persona apasionada por la moda y el servicio al cliente para cobro en caja POS, atención a clientes y asesoramiento en prendas de vestir y accesorios de Ópalo.',
       'Secundaria completa o pasante universitaria.\\nExperiencia mínima de 6 meses en atención al cliente o caja.\\nExcelente presentación personal y actitud de servicio.\\nDisponibilidad de horario.',
       'Salario base + comisiones por metas.\\nDescuento exclusivo en prendas y accesorios de la tienda.\\nAmbiente laboral agradable y capacitaciones continuas.',
       'ABIERTA'),
      ('Encargada de Inventario & Control de Calidad', 'Almacén & Logística', 'Tocoa, Colón', 'TIEMPO_COMPLETO', 'L. 12,000 - L. 14,000',
       'Responsable del etiquetado con código de barras, control de tallas y colores, recepción de pedidos de proveedores y verificación de existencias en tiempo real.',
       'Habilidad numérica y atención al detalle.\\nManejo básico de computadoras o sistemas POS.\\nResponsabilidad y puntualidad comprobable.',
       'Estabilidad laboral.\\nBeneficios conforme a ley.\\nCapacitación en sistemas tecnológicos de inventario.',
       'ABIERTA')
    `);
    console.log('Vacantes semilla insertadas.');
  }

  await db.end();
  console.log('Migración completada con éxito.');
}

migrate().catch(console.error);

