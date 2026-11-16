-- =============================================================================
-- DATOS INICIALES (SEED): ÓPALO ACCESORIOS
-- =============================================================================

USE opalo_pos_db;

-- 1. Roles iniciales
INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'ADMIN', 'Acceso total al sistema, reportes, usuarios y configuración'),
(2, 'CAJERO', 'Acceso a pantalla de POS, ventas, clientes y consulta de stock')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 2. Usuario Administrador por defecto (Credenciales: admin@opalo.hn / Admin123!)
INSERT INTO usuarios (id, rol_id, nombre, email, password_hash, telefono, estado) VALUES
(1, 1, 'Administrador Ópalo', 'admin@opalo.hn', '$2b$10$u8CHBmZVYche392pl/QMuOZ/LAd5MUAdN/HkKoE1tHOS3GQpKpyb2', '+504 9999-0000', 'ACTIVO'),
(2, 2, 'Cajera Turno Tocoa', 'caja1@opalo.hn', '$2b$10$u8CHBmZVYche392pl/QMuOZ/LAd5MUAdN/HkKoE1tHOS3GQpKpyb2', '+504 9888-1111', 'ACTIVO')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 3. Categorías típicas de Ópalo Accesorios
INSERT INTO categorias (id, nombre, descripcion) VALUES
(1, 'Aretes y Joyería Fina', 'Aretes de acero inoxidable, chapa de oro, bisutería fina y perlas'),
(2, 'Collares y Dijes', 'Cadenas, chokers, gargantillas y conjuntos de temporada'),
(3, 'Bolsos y Carteras', 'Bolsos cruzados, carteras de mano, tote bags y mochilas de moda'),
(4, 'Ropa de Dama', 'Blusas, vestidos veraniegos, faldas y conjuntos casuales'),
(5, 'Accesorios para el Cabello', 'Scrunchies, diademas, ganchos y lazos decorativos')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 4. Productos de ejemplo
INSERT INTO productos (id, categoria_id, nombre, descripcion, precio_base, estado) VALUES
(1, 4, 'Vestido Casual Floral Tocoa', 'Vestido fresco de tela suave con estampado floral, ideal para clima cálido', 450.00, 'ACTIVO'),
(2, 4, 'Blusa Satinada Elegante', 'Blusa cuello V de satén con mangas estilo campana', 320.00, 'ACTIVO'),
(3, 1, 'Aretes Hoops Dorados con Circonia', 'Argollas clásicas en baño de oro de 18k con incrustaciones brillantes', 180.00, 'ACTIVO'),
(4, 3, 'Bolso Crossbody Mini Ópalo', 'Bolso compacto con correa ajustable y detalles dorados', 550.00, 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 5. Variantes de los productos (Talla y Color con SKU y Stock individual)
INSERT INTO variantes_producto (id, producto_id, sku, codigo_barras, talla, color, precio_venta, precio_adicional, stock, stock_minimo) VALUES
-- Variantes Vestido Casual (Producto 1)
(1, 1, 'VES-FLOR-S-ROSA', '7421001001', 'S', 'Rosa Pastel', 450.00, 0.00, 8, 2),
(2, 1, 'VES-FLOR-M-ROSA', '7421001002', 'M', 'Rosa Pastel', 450.00, 0.00, 12, 3),
(3, 1, 'VES-FLOR-L-ROSA', '7421001003', 'L', 'Rosa Pastel', 450.00, 0.00, 6, 2),
(4, 1, 'VES-FLOR-M-AZUL', '7421001004', 'M', 'Azul Cielo', 450.00, 0.00, 10, 3),

-- Variantes Blusa Satinada (Producto 2)
(5, 2, 'BLU-SAT-S-BLAN', '7421002001', 'S', 'Blanco Marfil', 320.00, 0.00, 5, 2),
(6, 2, 'BLU-SAT-M-BLAN', '7421002002', 'M', 'Blanco Marfil', 320.00, 0.00, 9, 3),
(7, 2, 'BLU-SAT-S-VERD', '7421002003', 'S', 'Verde Esmeralda', 320.00, 0.00, 4, 2),
(8, 2, 'BLU-SAT-M-VERD', '7421002004', 'M', 'Verde Esmeralda', 340.00, 20.00, 7, 2),

-- Variantes Aretes Hoops (Producto 3)
(9, 3, 'ART-HOOP-U-DOR', '7421003001', 'Única', 'Dorado', 180.00, 0.00, 25, 5),
(10, 3, 'ART-HOOP-U-PLA', '7421003002', 'Única', 'Plata', 180.00, 0.00, 15, 5),

-- Variantes Bolso Crossbody (Producto 4)
(11, 4, 'BOL-CROS-U-NEG', '7421004001', 'Única', 'Negro', 550.00, 0.00, 6, 2),
(12, 4, 'BOL-CROS-U-BEI', '7421004002', 'Única', 'Beige Nude', 550.00, 0.00, 8, 2)
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

-- 6. Cliente inicial (Consumidor Final y Cliente Frecuente con QR)
INSERT INTO clientes (id, nombre, rtn_dni, telefono, email, direccion, codigo_qr_lealtad, puntos_lealtad) VALUES
(1, 'Consumidor Final', '0000000000000', '0000-0000', 'cliente@opalo.hn', 'Tocoa, Colón', 'OPALO-CF-0001', 0),
(2, 'María Fernanda Rivera', '0209199500123', '+504 9777-2233', 'maria.rivera@gmail.com', 'Barrio El Centro, Tocoa', 'OPALO-LOYAL-0002', 120)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

