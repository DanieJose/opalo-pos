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

  // 1. Tabla de Gastos Financieros / Egresos
  await db.query(`
    CREATE TABLE IF NOT EXISTS gastos_financieros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoria ENUM(
        'ALQUILER',
        'SERVICIOS_PUBLICOS',
        'PAGO_PROVEEDORES',
        'NOMINA_SALARIOS',
        'TRANSPORTE_FLETES',
        'MARKETING_PUBLICIDAD',
        'EMPAQUES_SUMINISTROS',
        'MANTENIMIENTO',
        'IMPUESTOS',
        'OTROS'
      ) NOT NULL DEFAULT 'OTROS',
      proveedor_id INT NULL,
      usuario_id INT NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      monto DECIMAL(10, 2) NOT NULL,
      metodo_pago ENUM('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE') NOT NULL DEFAULT 'EFECTIVO',
      banco_origen VARCHAR(50) NULL,
      numero_comprobante VARCHAR(100) NULL,
      comprobante_url VARCHAR(500) NULL,
      fecha_gasto DATE NOT NULL,
      estado ENUM('PAGADO', 'PENDIENTE') NOT NULL DEFAULT 'PAGADO',
      notas TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_gastos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE,
      CONSTRAINT fk_gastos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE SET NULL ON UPDATE CASCADE,
      INDEX idx_gastos_fecha (fecha_gasto),
      INDEX idx_gastos_categoria (categoria),
      INDEX idx_gastos_proveedor (proveedor_id)
    ) ENGINE=InnoDB;
  `);
  console.log('Tabla gastos_financieros creada/verificada exitosamente.');

  // 2. Tabla de Cuentas por Pagar (Deudas a Proveedores)
  await db.query(`
    CREATE TABLE IF NOT EXISTS cuentas_por_pagar (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proveedor_id INT NOT NULL,
      numero_factura_proveedor VARCHAR(100) NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      monto_total DECIMAL(10, 2) NOT NULL,
      monto_pagado DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      saldo_pendiente DECIMAL(10, 2) NOT NULL,
      fecha_emision DATE NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      estado ENUM('PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO', 'VENCIDO') NOT NULL DEFAULT 'PENDIENTE',
      notas TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_cxp_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON UPDATE CASCADE,
      INDEX idx_cxp_vencimiento (fecha_vencimiento),
      INDEX idx_cxp_estado (estado),
      INDEX idx_cxp_proveedor (proveedor_id)
    ) ENGINE=InnoDB;
  `);
  console.log('Tabla cuentas_por_pagar creada/verificada exitosamente.');

  // 3. Sembrar gastos de ejemplo para el mes en curso si está vacía
  const [gastosCount] = await db.query('SELECT COUNT(*) AS total FROM gastos_financieros');
  if (gastosCount[0].total === 0) {
    const today = new Date().toISOString().split('T')[0];
    await db.query(`
      INSERT INTO gastos_financieros (categoria, usuario_id, descripcion, monto, metodo_pago, banco_origen, numero_comprobante, fecha_gasto, estado)
      VALUES 
      ('ALQUILER', 1, 'Alquiler local comercial Ópalo Accesorios - Barrio El Centro', 8500.00, 'TRANSFERENCIA', 'BAC Credomatic', 'TR-982103', ?, 'PAGADO'),
      ('SERVICIOS_PUBLICOS', 1, 'Factura de Energía Eléctrica ENEE local comercial', 1450.00, 'EFECTIVO', NULL, 'ENEE-2026-8812', ?, 'PAGADO'),
      ('EMPAQUES_SUMINISTROS', 1, 'Bolsas boutique personalizadas con logo Ópalo y papel seda', 1200.00, 'EFECTIVO', NULL, 'REC-0451', ?, 'PAGADO'),
      ('MARKETING_PUBLICIDAD', 1, 'Campaña publicitaria en Instagram y Facebook Ads nueva colección', 800.00, 'TARJETA', 'BAC Credomatic', 'FB-ADS-1982', ?, 'PAGADO')
    `, [today, today, today, today]);
    console.log('Gastos financieros iniciales sembrados con éxito.');
  }

  // 4. Sembrar cuenta por pagar de ejemplo si hay proveedores
  const [cxpCount] = await db.query('SELECT COUNT(*) AS total FROM cuentas_por_pagar');
  if (cxpCount[0].total === 0) {
    const [provs] = await db.query('SELECT id FROM proveedores LIMIT 1');
    if (provs.length > 0) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      const strToday = today.toISOString().split('T')[0];
      const strDue = nextMonth.toISOString().split('T')[0];

      await db.query(`
        INSERT INTO cuentas_por_pagar (proveedor_id, numero_factura_proveedor, descripcion, monto_total, monto_pagado, saldo_pendiente, fecha_emision, fecha_vencimiento, estado)
        VALUES (?, 'FACT-MODA-2026-90', 'Pedido de Vestidos y Aretes de Temporada', 15000.00, 5000.00, 10000.00, ?, ?, 'PAGADO_PARCIAL')
      `, [provs[0].id, strToday, strDue]);
      console.log('Cuenta por pagar inicial sembrada con éxito.');
    }
  }

  await db.end();
  console.log('Migración del Módulo de Finanzas completada exitosamente.');
}

migrate().catch(err => {
  console.error('Error durante la migración de finanzas:', err);
  process.exit(1);
});

