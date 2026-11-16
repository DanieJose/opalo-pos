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

  console.log('Conectando a la base de datos...');

  const sql = `
    CREATE TABLE IF NOT EXISTS proveedores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_empresa VARCHAR(150) NOT NULL,
      contacto_nombre VARCHAR(120) NULL,
      rtn VARCHAR(25) NULL UNIQUE,
      telefono VARCHAR(25) NOT NULL,
      telefono_secundario VARCHAR(25) NULL,
      email VARCHAR(120) NULL,
      direccion VARCHAR(255) NULL,
      ciudad VARCHAR(100) NOT NULL DEFAULT 'Tocoa',
      categoria_suministro VARCHAR(100) NULL,
      dias_credito INT NOT NULL DEFAULT 0,
      banco VARCHAR(50) NULL,
      cuenta_bancaria VARCHAR(100) NULL,
      notas TEXT NULL,
      estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_proveedores_nombre (nombre_empresa),
      INDEX idx_proveedores_rtn (rtn),
      INDEX idx_proveedores_telefono (telefono),
      INDEX idx_proveedores_estado (estado)
    ) ENGINE=InnoDB;
  `;

  await pool.query(sql);
  console.log('Tabla proveedores creada o verificada');

  // Verificar si la tabla productos ya tiene la columna proveedor_id
  const [cols] = await pool.query(`SHOW COLUMNS FROM productos LIKE 'proveedor_id'`);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE productos 
      ADD COLUMN proveedor_id INT NULL AFTER categoria_id,
      ADD CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log('Columna proveedor_id agregada a la tabla productos');
  }

  // Insertar proveedores iniciales de muestra para Ópalo Accesorios
  const [existing] = await pool.query('SELECT COUNT(*) as count FROM proveedores');
  if (existing[0].count === 0) {
    await pool.query(`
      INSERT INTO proveedores (nombre_empresa, contacto_nombre, rtn, telefono, email, direccion, ciudad, categoria_suministro, dias_credito, banco, cuenta_bancaria, notas) VALUES
      ('Distribuidora Joyas & Acero Honduras', 'Lic. Carlos Mejía', '08011990123456', '+504 9876-5432', 'ventas@joyasdehonduras.hn', 'Bo. El Centro, Ave. Morazán', 'San Pedro Sula', 'Joyería de Acero y Baño de Oro', 15, 'BAC Credomatic', '741289563', 'Entrega por Expreso del Valle en 24h'),
      ('Confecciones & Modas Centroamericanas', 'Brenda Zelaya', '05011985789012', '+504 9543-2109', 'contacto@modashn.com', 'Col. Satélite, Blv. del Sur', 'San Pedro Sula', 'Ropa Casual & Vestidos', 30, 'Banco Atlántida', '11029837465', 'Descuento por pronto pago 5%'),
      ('Importadora Elegance Accesorios', 'Roberto Canales', '01011992456789', '+504 9912-3456', 'elegance.accesorios@gmail.com', 'Col. Tepeyac, Calle Principal', 'Tegucigalpa', 'Bolsos, Carteras y Billeteras', 0, 'Banco Ficohsa', '20003498127', 'Pago de contado al despachar'),
      ('Empaques & Cajas de Regalo Ópalo', 'Sayda Martínez', '02011994678123', '+504 8876-1234', 'empaques.martinez@yahoo.com', 'Bo. San José, Calle del Comercio', 'Tocoa', 'Bolsas de Boutique y Cajitas', 0, 'Banrural', '00329182736', 'Proveedor local en Tocoa, entrega a domicilio')
    `);
    console.log('Proveedores hondureños de muestra insertados con éxito');
  } else {
    console.log(`Ya existen ${existing[0].count} proveedores en la base de datos`);
  }

  await pool.end();
  console.log('Migración completada con éxito.');
}

run().catch((e) => {
  console.error('Error durante la migración de proveedores:', e);
  process.exit(1);
});

