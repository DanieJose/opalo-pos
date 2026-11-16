/**
 * Formato unificado de respuestas HTTP para el sistema POS Ópalo Accesorios.
 * Facilita el consumo uniforme desde Nuxt.js y la app móvil Flutter.
 */

const successResponse = (res, { statusCode = 200, message = 'Operación exitosa', data = null, meta = null, ...rest }) => {
  const payload = {
    success: true,
    message,
    data,
    ...rest
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, { statusCode = 500, message = 'Error interno del servidor', errors = null }) => {
  const payload = {
    success: false,
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse
};

