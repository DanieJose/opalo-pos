-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: ÓPALO ACCESORIOS - SISTEMA POS
-- Ubicación: Tocoa, Colón, Honduras
-- Motor: MySQL 8.0+ / MariaDB 10.4+
-- Codificación: UTF-8 (utf8mb4)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS opalo_pos_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE opalo_pos_db;

-- -----------------------------------------------------------------------------
-- 1. TABLA: ROLES
-- Control de perfiles de usuario (Administrador, Cajero, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. TABLA: USUARIOS
-- Personal de la tienda autenticable con JWT y contraseña cifrada con bcrypt
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rol_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(25) NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles (id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. TABLA: CATEGORIAS
-- Familias de productos (Collares, Aretes, Bolsos, Ropa casual, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. TABLA: PRODUCTOS
-- Cabecera o producto base (ropa o accesorios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT NOT NULL,
  proveedor_id INT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  precio_costo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  precio_base DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tipo_impuesto ENUM('ISV_15', 'ISV_18', 'EXENTO') NOT NULL DEFAULT 'ISV_15',
  precio_incluye_isv TINYINT(1) NOT NULL DEFAULT 0,
  aplica_descuento TINYINT(1) NOT NULL DEFAULT 0,
  descuento_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  precio_con_descuento DECIMAL(10, 2) NULL,
  imagen_url VARCHAR(500) NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categorias FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON UPDATE CASCADE,
  INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. TABLA: VARIANTES_PRODUCTO
-- Control específico por Talla (S, M, L, Única) y Color con SKU y Stock individual
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS variantes_producto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  codigo_barras VARCHAR(60) NULL UNIQUE,
  talla VARCHAR(20) NOT NULL DEFAULT 'Única',
  color VARCHAR(50) NOT NULL DEFAULT 'Estándar',
  precio_costo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  precio_venta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  precio_incluye_isv TINYINT(1) NOT NULL DEFAULT 0,
  descuento_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  precio_con_descuento DECIMAL(10, 2) NULL,
  precio_adicional DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 3,
  imagen_url VARCHAR(255) NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_producto_talla_color UNIQUE (producto_id, talla, color),
  INDEX idx_variantes_sku (sku),
  INDEX idx_variantes_codigo_barras (codigo_barras),
  INDEX idx_variantes_stock (stock)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. TABLA: CLIENTES
-- Clientes frecuentes de Ópalo Accesorios con soporte para Lealtad y Facturación
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  rtn_dni VARCHAR(25) NULL,
  telefono VARCHAR(25) NULL,
  email VARCHAR(120) NULL,
  direccion VARCHAR(255) NULL,
  codigo_qr_lealtad VARCHAR(100) NULL UNIQUE,
  puntos_lealtad INT NOT NULL DEFAULT 0,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clientes_rtn_dni (rtn_dni),
  INDEX idx_clientes_telefono (telefono),
  INDEX idx_clientes_qr (codigo_qr_lealtad)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. TABLA: VENTAS
-- Registro de transacciones del POS con ISV (15% en Honduras)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_factura VARCHAR(50) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  cliente_id INT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  isv_15 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  isv_18 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  metodo_pago ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO') NOT NULL DEFAULT 'EFECTIVO',
  monto_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_tarjeta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_transferencia DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  banco_transferencia VARCHAR(50) NULL, -- Atlántida, BAC Credomatic, Ficohsa, Banrural, Occidente, etc.
  monto_recibido DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cambio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  notas VARCHAR(255) NULL,
  estado ENUM('COMPLETADA', 'ANULADA', 'PENDIENTE') NOT NULL DEFAULT 'COMPLETADA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE,
  CONSTRAINT fk_ventas_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_ventas_fecha (created_at),
  INDEX idx_ventas_factura (numero_factura)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. TABLA: DETALLE_VENTAS
-- Detalle de los ítems vendidos por variante con cantidad y precio unitario
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  variante_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10, 2) NOT NULL,
  tipo_impuesto ENUM('ISV_15', 'ISV_18', 'EXENTO') NOT NULL DEFAULT 'ISV_15',
  precio_incluye_isv TINYINT(1) NOT NULL DEFAULT 0,
  impuesto_monto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_detalle_ventas_venta FOREIGN KEY (venta_id) REFERENCES ventas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_ventas_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto (id) ON UPDATE CASCADE,
  INDEX idx_detalle_venta (venta_id),
  INDEX idx_detalle_variante (variante_id)
) ENGINE=InnoDB;


-- -----------------------------------------------------------------------------
-- 9. TABLA: LOGS_SISTEMA (AUDITORÍA)
-- Registro de eventos críticos, accesos, cambios de inventario y transacciones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  usuario_nombre VARCHAR(120) NULL,
  modulo VARCHAR(50) NOT NULL,
  accion VARCHAR(80) NOT NULL,
  descripcion TEXT NOT NULL,
  ip VARCHAR(45) NULL,
  detalles JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_logs_fecha (created_at),
  INDEX idx_logs_modulo (modulo),
  INDEX idx_logs_accion (accion),
  INDEX idx_logs_usuario (usuario_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. TABLA: TURNOS_CAJA (APERTURA Y FONDO INICIAL DE CAMBIO)
-- Registro del cambio inicial con que el cajero abre turno y arqueo final
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  monto_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_final_esperado DECIMAL(10, 2) NULL,
  monto_final_real DECIMAL(10, 2) NULL,
  diferencia DECIMAL(10, 2) NULL,
  estado ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'ABIERTA',
  fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP NULL,
  notas VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_turnos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE,
  INDEX idx_turnos_usuario (usuario_id),
  INDEX idx_turnos_estado (estado),
  INDEX idx_turnos_fecha (fecha_apertura)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. TABLA: PROVEEDORES
-- Gestión de distribuidores y fabricantes de prendas, joyas y accesorios
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 12. TABLA: VACANTES_EMPLEO
-- Gestión de plazas y puestos de trabajo disponibles para reclutamiento
-- -----------------------------------------------------------------------------
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vacantes_estado (estado),
  INDEX idx_vacantes_titulo (titulo)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. TABLA: CANDIDATOS_POSTULACIONES
-- Hojas de vida y postulaciones recibidas desde el portal público o código QR
-- -----------------------------------------------------------------------------
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
  CONSTRAINT fk_postulaciones_vacante FOREIGN KEY (vacante_id) REFERENCES vacantes_empleo (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_postulaciones_estado (estado),
  INDEX idx_postulaciones_vacante (vacante_id),
  INDEX idx_postulaciones_fecha (created_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. TABLA: configuracion_empresa (Datos fiscales, RTN, Logo y Ticket POS)
-- -----------------------------------------------------------------------------
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
  isv_18_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  cai_sar VARCHAR(120) NULL DEFAULT 'E54D7A-B981F2-9942B5-17C3D8-72AE10-94',
  rango_autorizado_sar VARCHAR(150) NULL DEFAULT '000-001-01-00000001 a 000-001-01-00050000',
  fecha_limite_emision DATE NULL,
  mensaje_ticket_pie TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 14. TABLA: devoluciones
-- Registro de devoluciones totales o parciales de productos con retorno a stock
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devoluciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  numero_devolucion VARCHAR(50) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  cliente_id INT NULL,
  monto_subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_isv_15 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_isv_18 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  motivo VARCHAR(150) NOT NULL DEFAULT 'Cambio de prenda',
  metodo_reembolso ENUM('EFECTIVO', 'TRANSFERENCIA', 'NOTA_CREDITO', 'SALDO_A_FAVOR') NOT NULL DEFAULT 'EFECTIVO',
  observaciones TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_devoluciones_venta FOREIGN KEY (venta_id) REFERENCES ventas (id) ON UPDATE CASCADE,
  CONSTRAINT fk_devoluciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE,
  CONSTRAINT fk_devoluciones_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_devoluciones_fecha (created_at),
  INDEX idx_devoluciones_venta (venta_id),
  INDEX idx_devoluciones_numero (numero_devolucion)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 15. TABLA: detalle_devoluciones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_devoluciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id INT NOT NULL,
  detalle_venta_id INT NULL,
  variante_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_det_dev_devolucion FOREIGN KEY (devolucion_id) REFERENCES devoluciones (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_det_dev_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto (id) ON UPDATE CASCADE,
  CONSTRAINT fk_det_dev_det_venta FOREIGN KEY (detalle_venta_id) REFERENCES detalle_ventas (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_det_dev_devolucion (devolucion_id),
  INDEX idx_det_dev_variante (variante_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 16. TABLA: gastos_financieros (Egresos y Gastos Operativos)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 17. TABLA: cuentas_por_pagar (Obligaciones y Deudas a Proveedores)
-- -----------------------------------------------------------------------------
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
