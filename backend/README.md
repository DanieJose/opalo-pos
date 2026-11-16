# 💎 Ópalo Accesorios - POS Backend API
**Ubicación:** Tocoa, Colón, Honduras  
**Stack:** Node.js, Express, MySQL, JWT, Dotenv, Bcryptjs

---

## 📋 Requisitos Previos
1. **Node.js** (v18 o superior)
2. **MySQL Server** (v8.0+ o MariaDB v10.4+)
3. Herramienta cliente de base de datos como MySQL Workbench, phpMyAdmin, DBeaver o CLI.

---

## 🚀 Puesta en Marcha

### 1. Configuración de Base de Datos
1. Ejecuta el script de creación del esquema en tu servidor MySQL:
   ```bash
   mysql -u root -p < src/database/schema.sql
   ```
2. Carga los datos iniciales (roles, usuarios, categorías, productos con variantes de talla/color):
   ```bash
   mysql -u root -p < src/database/seed.sql
   ```

### 2. Variables de Entorno (`.env`)
Asegúrate de configurar los accesos de tu MySQL en `backend/.env`:
```ini
PORT=4000
NODE_ENV=development

# Conexión MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=opalo_pos_db
DB_PORT=3306

# Seguridad JWT
JWT_SECRET=opalo_accesorios_secret_key_tocoa_2026_super_secure
JWT_EXPIRES_IN=24h

# Configuración de Negocio (Honduras)
IMPUESTO_ISV_PORCENTAJE=15
MONEDA_CODIGO=HNL
MONEDA_SIMBOLO=L
```

### 3. Ejecución del Servidor
```bash
# Modo desarrollo con recarga automática:
npm run dev

# Modo producción:
npm start
```

---

## 🔐 Usuarios de Prueba (Seed)

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@opalo.hn` | `Admin123!` |
| **Cajero** | `caja1@opalo.hn` | `Admin123!` |

---

## 📡 Módulos y Endpoints RESTful Implementados

### 1. Autenticación (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Login con generación de JWT.
- `GET /api/v1/auth/profile`: Perfil del usuario autenticado.
- `PUT /api/v1/auth/change-password`: Cambio seguro de contraseña.

### 2. Productos y Variantes (`/api/v1/productos`)
- `GET /api/v1/productos`: Lista paginada con stock consolidado y variantes agrupadas.
- `GET /api/v1/productos/:id`: Detalle completo con desglose de tallas y colores.
- `GET /api/v1/productos/buscar/codigo?term=...`: Búsqueda instantánea por SKU o Código de Barras (pistola escáner en caja).
- `POST /api/v1/productos`: [Admin] Creación transaccional de producto y sus variantes.
- `PUT /api/v1/productos/:id`: [Admin] Edición de producto y sus variantes.
- `DELETE /api/v1/productos/:id`: [Admin] Inactivación lógica (o eliminación física con `?force=true`).
- `PATCH /api/v1/productos/variantes/:id/stock`: [Admin] Ajuste rápido de inventario por variante.

### 3. Categorías (`/api/v1/categorias`)
- `GET /api/v1/categorias`: Listado de categorías (Aretes, Collares, Bolsos, Ropa, etc.).
- `POST /api/v1/categorias`: [Admin] Crear categoría.
- `PUT /api/v1/categorias/:id`: [Admin] Actualizar categoría.
- `DELETE /api/v1/categorias/:id`: [Admin] Eliminar categoría (valida que no tenga productos asociados).

### 4. Clientes y Lealtad QR (`/api/v1/clientes`)
- `GET /api/v1/clientes`: Lista de compradoras con paginación y búsqueda (DNI/RTN, teléfono, QR).
- `GET /api/v1/clientes/buscar/qr/:codigo`: Búsqueda rápida por escaneo de código QR en caja.
- `GET /api/v1/clientes/:id`: Detalle e historial de compras recientes.
- `POST /api/v1/clientes`: Registro con auto-generación de código QR único de lealtad.
- `PUT /api/v1/clientes/:id`: Actualizar datos del cliente.

### 5. Ventas / POS Checkout (`/api/v1/ventas`)
- `POST /api/v1/ventas`: Registro transaccional de cobro en caja con bloqueo pesimista `FOR UPDATE`, deducción automática de stock por variante, cálculo del 15% de ISV y asignación de puntos de lealtad.
- `GET /api/v1/ventas`: Historial de ventas con filtros de fecha, cajero, cliente y método de pago.
- `GET /api/v1/ventas/:id`: Detalle del recibo de venta y productos facturados.
- `PUT /api/v1/ventas/:id/anular`: [Admin] Anulación de venta con restauración de inventario y reversión de puntos.

### 6. Reportes y Métricas (`/api/v1/reportes`)
- `GET /api/v1/reportes/dashboard`: Arqueo y cierre diario de caja (ventas totales, ISV, desglose por efectivo/tarjeta/transferencia) y métricas de inventario.
- `GET /api/v1/reportes/stock-bajo`: Listado de variantes en o por debajo de su stock mínimo para reabastecimiento.
- `GET /api/v1/reportes/top-vendidos`: Ranking de los productos y variantes con mayores ventas.
