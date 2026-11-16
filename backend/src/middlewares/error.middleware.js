const { errorResponse } = require('../utils/response');

/**
 * Middleware para rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Middleware global de manejo de excepciones
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Global Handler]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno inesperado en el servidor';

  return errorResponse(res, {
    statusCode,
    message,
    errors: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

