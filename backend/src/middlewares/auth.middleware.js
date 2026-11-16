const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { errorResponse } = require('../utils/response');

/**
 * Middleware para validar el JSON Web Token en la cabecera Authorization
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Acceso no autorizado: Token no proporcionado o formato incorrecto (Bearer <token>)'
      });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        const message = err.name === 'TokenExpiredError' 
          ? 'El token de sesión ha expirado, por favor ingresa nuevamente' 
          : 'Token de autenticación inválido';
        return errorResponse(res, { statusCode: 401, message });
      }

      req.user = decoded; // { id, email, rol_id, rol_nombre }
      next();
    });
  } catch (error) {
    return errorResponse(res, {
      statusCode: 500,
      message: 'Error al procesar la autenticación',
      errors: error.message
    });
  }
};

module.exports = { verifyToken };

