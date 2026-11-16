const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares de seguridad y observabilidad
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: '*', // Se puede restringir en producción para el dominio del frontend Nuxt
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));

// Parseo de cuerpos JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servidor de archivos estáticos para fotografías de productos y logotipos
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    nombre: 'Ópalo Accesorios - API Punto de Venta',
    version: '1.0.0',
    descripcion: 'Backend RESTful en Node.js, Express y MySQL para tienda de moda y accesorios en Tocoa, Honduras.',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      productos: '/api/v1/productos'
    }
  });
});

// Rutas de la API v1
app.use('/api/v1', apiRoutes);

// Manejo de errores y 404
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

