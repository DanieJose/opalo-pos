# 💎 Ópalo Accesorios - Sistema Punto de Venta (POS) Integral
**Ubicación:** Tocoa, Colón, Honduras  
**Arquitectura:** Full Stack Modular Multiplataforma (Backend RESTful + Web POS Nuxt 3 + App Móvil Flutter)

---

## 🛠️ Stack Tecnológico Completo

1. **Backend:**
   - Node.js + Express
   - Base de Datos: MySQL 8.0 (Pool transaccional `mysql2/promise`)
   - Seguridad: JWT + `bcryptjs` + RBAC (`ADMIN` y `CAJERO`)
   - Negocio: ISV 15% Honduras, multimoneda (Lempiras), arqueo diario y fidelización QR

2. **Frontend Web (Caja POS de Mostrador):**
   - Nuxt.js (SSR) + Vue 3
   - Tailwind CSS con paleta inspirada en Ópalo
   - Carrito de venta reactivo, selector de tallas y colores, escáner de código de barras USB y ticket térmico 80mm

3. **Aplicación Móvil (Android & iOS):**
   - Flutter + Dart
   - Gestión de estado: `Provider`
   - Consumo de API: `Dio` con interceptor JWT
   - Escáner nativo de cámara: `mobile_scanner` (Códigos de barra de prendas y QR de clientas)
   - Pasarela de cobros móviles (Efectivo, Tarjeta, Transferencias en BAC, Atlántida, Ficohsa, Banrural)

---

## 📂 Estructura del Repositorio

```text
Punto Venta/
├── docker-compose.yml        # Despliegue completo con 1 comando (MySQL + Backend + Nuxt)
├── opalo_pos_postman_collection.json # Colección oficial para Postman
│
├── backend/                  # API RESTful en Node.js, Express y MySQL
│   ├── Dockerfile
│   ├── src/
│   │   ├── config/           # Conexión MySQL pool y variables (.env)
│   │   ├── database/         # schema.sql, seed.sql y migrate.js (Auto-migración)
│   │   ├── controllers/      # Auth, Productos, Categorías, Clientes, Ventas, Reportes
│   │   ├── middlewares/      # verifyToken, authorizeRoles, errorHandler
│   │   ├── routes/           # Rutas versionadas (/api/v1)
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── frontend/                 # Aplicación Web POS en Nuxt 3 + Tailwind CSS
│   ├── Dockerfile
│   ├── composables/          # useAuth (JWT), useApi (Dio/Fetch), useCart (Carrito reactivo POS)
│   ├── layouts/              # Barra superior con marca Ópalo, cajero en turno y navegación
│   ├── middleware/           # Protección global de sesión (auth.global.ts)
│   ├── pages/
│   │   ├── index.vue         # 🛒 Pantalla táctil de Caja (POS) con buscador de código de barras
│   │   ├── login.vue         # 🔐 Acceso de cajeros y administradores
│   │   ├── inventario.vue    # 👗 Gestión de stock por talla y color
│   │   ├── ventas.vue        # 🧾 Historial de facturas y Arqueo/Cierre de caja
│   │   ├── clientes.vue      # 💎 Directorio de compradoras y QR de lealtad
│   │   └── usuarios.vue      # 👥 Control de usuarios, roles (Admin/Cajero) y permisos
│   ├── nuxt.config.ts
│   └── package.json
│
└── mobile/                   # Aplicación Móvil en Flutter (Android e iOS)
    ├── lib/
    │   ├── core/             # Colores, API Client (Dio con interceptores) y formateadores
    │   ├── models/           # UserModel, ProductModel, VariantModel, CustomerModel, SaleModel
    │   ├── providers/        # AuthProvider, CartProvider, ProductProvider, CustomerProvider
    │   ├── screens/          # Login, Navegación, POS, Escáner Cámara, Checkout, Recibo, Inventario
    │   └── main.dart         # MultiProvider y tema visual
    └── pubspec.yaml
```

---

## ⚡ Guía de Puesta en Marcha

### Opción A: Despliegue con Docker (Recomendado para servidores)
Con un solo comando se inicia MySQL (con tablas y datos iniciales ya cargados), el Backend y el Frontend:
```bash
docker compose up -d
```
- **Web POS:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000/api/v1`

---

### Opción B: Ejecución en Desarrollo Local

#### 1. Base de Datos MySQL
Ejecuta el asistente automático de inicialización:
```bash
cd backend
npm run migrate
```

#### 2. Iniciar el Backend (Puerto 4000)
```bash
cd backend
npm run dev
# URL: http://localhost:4000/api/v1
```

#### 3. Iniciar el Frontend Web POS (Puerto 3000)
```bash
cd frontend
npm run dev
# URL: http://localhost:3000
```

#### 4. Iniciar la App Móvil Flutter (Android / iOS)
```bash
cd mobile
flutter run
```

---

## 🧪 Pruebas con Postman
Importa en Postman el archivo:
[`opalo_pos_postman_collection.json`](file:///c:/Users/danie/Documents/Suni/Punto%20Venta/opalo_pos_postman_collection.json)  
Al ejecutar el endpoint **"1. Autenticación -> Login"**, el token JWT se almacena de forma automática en las variables de la colección y se propaga a todos los demás endpoints.

---

## 🔑 Credenciales Iniciales
- **Administrador:** `admin@opalo.hn` / `Admin123!`
- **Cajero:** `caja1@opalo.hn` / `Admin123!`
