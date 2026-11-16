const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/config');
const { logActivity } = require('../utils/logger.service');
const { successResponse, errorResponse } = require('../utils/response');

const parseModulos = (val, rolId) => {
  if (val) {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch(e) { return []; }
    }
    if (Array.isArray(val)) return val;
  }
  if (parseInt(rolId, 10) === 1) {
    return ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes', 'proveedores', 'finanzas', 'reportes', 'reclutamiento', 'usuarios', 'logs', 'configuracion'];
  }
  return ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes'];
};

/**
 * Iniciar sesión (Login con JWT)
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validación básica de campos requeridos
    if (!email || !password) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debes proporcionar correo electrónico y contraseña'
      });
    }

    // Consulta con unión a roles para obtener el nombre del rol (ADMIN / CAJERO)
    const sql = `
      SELECT u.id, u.nombre, u.email, u.password_hash, u.telefono, u.estado, 
             u.rol_id, u.modulos_permitidos, r.nombre AS rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [email.trim().toLowerCase()]);

    if (rows.length === 0) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Credenciales inválidas (usuario no encontrado)'
      });
    }

    const user = rows[0];

    // Verificar si el usuario está activo
    if (user.estado !== 'ACTIVO') {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Tu cuenta se encuentra inactiva. Contacta al Administrador de Ópalo Accesorios.'
      });
    }

    // Comparar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logActivity({
        req,
        usuario_id: user.id,
        usuario_nombre: user.nombre,
        modulo: 'AUTH',
        accion: 'LOGIN_FALLIDO',
        descripcion: `Contraseña incorrecta para el usuario ${user.email}`
      });

      return errorResponse(res, {
        statusCode: 401,
        message: 'Credenciales inválidas (contraseña incorrecta)'
      });
    }

    // Auditoría de login exitoso
    logActivity({
      req,
      usuario_id: user.id,
      usuario_nombre: user.nombre,
      modulo: 'AUTH',
      accion: 'LOGIN',
      descripcion: `Inicio de sesión exitoso en el sistema POS (${user.rol_nombre})`
    });

    const allowedModules = parseModulos(user.modulos_permitidos, user.rol_id);

    // Generar JWT
    const tokenPayload = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre,
      modulos_permitidos: allowedModules
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    // Sanitizar respuesta eliminando el hash de contraseña
    const userData = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      modulos_permitidos: allowedModules,
      rol: {
        id: user.rol_id,
        nombre: user.rol_nombre
      }
    };

    return successResponse(res, {
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        token_type: 'Bearer',
        expires_in: config.jwt.expiresIn,
        user: userData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/v1/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.created_at,
             u.modulos_permitidos,
             r.id AS rol_id, r.nombre AS rol_nombre, r.descripcion AS rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [userId]);

    if (rows.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Usuario no encontrado'
      });
    }

    const user = rows[0];
    const allowedModules = parseModulos(user.modulos_permitidos, user.rol_id);

    return successResponse(res, {
      message: 'Perfil obtenido correctamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        estado: user.estado,
        modulos_permitidos: allowedModules,
        rol: {
          id: user.rol_id,
          nombre: user.rol_nombre,
          descripcion: user.rol_descripcion
        },
        fecha_registro: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar contraseña
 * PUT /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debes proporcionar la contraseña actual y la nueva contraseña'
      });
    }

    if (newPassword.length < 6) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const [rows] = await db.query('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'La contraseña actual no es correcta'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return successResponse(res, {
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getProfile,
  changePassword
};

