const { errorResponse } = require('../utils/response');

/**
 * Middleware para autorizar roles específicos (RBAC)
 * Ejemplo: authorizeRoles('ADMIN'), authorizeRoles('ADMIN', 'CAJERO')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.rol_nombre;

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Acceso denegado: Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}]. Tu rol actual es: ${userRole}`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };

