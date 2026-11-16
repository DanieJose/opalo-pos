const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { emitEvent } = require('../config/socket');
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
 * Listar todos los usuarios del sistema (ADMIN)
 * GET /api/v1/usuarios?search=cajera&rol_id=2&estado=ACTIVO
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, rol_id, estado } = req.query;
    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('(u.nombre LIKE ? OR u.email LIKE ? OR u.telefono LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (rol_id) {
      whereClauses.push('u.rol_id = ?');
      params.push(rol_id);
    }

    if (estado) {
      whereClauses.push('u.estado = ?');
      params.push(estado);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.created_at, u.updated_at,
             u.modulos_permitidos,
             r.id AS rol_id, r.nombre AS rol_nombre, r.descripcion AS rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      ${whereSQL}
      ORDER BY u.id ASC
    `;

    const [rows] = await db.query(sql, params);
    const formatted = rows.map(u => ({
      ...u,
      modulos_permitidos: parseModulos(u.modulos_permitidos, u.rol_id)
    }));

    return successResponse(res, {
      message: 'Usuarios obtenidos exitosamente',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalle de usuario por ID (ADMIN)
 * GET /api/v1/usuarios/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.created_at,
             u.modulos_permitidos,
             r.id AS rol_id, r.nombre AS rol_nombre, r.descripcion AS rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Usuario no encontrado' });
    }

    const user = {
      ...rows[0],
      modulos_permitidos: parseModulos(rows[0].modulos_permitidos, rows[0].rol_id)
    };

    return successResponse(res, {
      message: 'Usuario obtenido correctamente',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar nuevo usuario con rol asignado (ADMIN)
 * POST /api/v1/usuarios
 */
const createUser = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, rol_id, modulos_permitidos } = req.body;

    if (!nombre || !email || !password || !rol_id) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Nombre, email, contraseña y rol_id son campos obligatorios'
      });
    }

    if (password.length < 6) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el correo ya existe
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return errorResponse(res, {
        statusCode: 409,
        message: 'Ya existe un usuario registrado con este correo electrónico'
      });
    }

    // Cifrar contraseña con bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const finalModulos = JSON.stringify(parseModulos(modulos_permitidos, rol_id));

    const [result] = await db.query(
      `INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono, estado, modulos_permitidos)
       VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?)`,
      [rol_id, nombre.trim(), email.trim().toLowerCase(), passwordHash, telefono || null, finalModulos]
    );

    const [createdUserRows] = await db.query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.created_at, u.modulos_permitidos,
              r.id AS rol_id, r.nombre AS rol_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    const createdUser = {
      ...createdUserRows[0],
      modulos_permitidos: parseModulos(createdUserRows[0].modulos_permitidos, createdUserRows[0].rol_id)
    };

    // Emitir evento en tiempo real
    emitEvent('pos:user_created', createdUser);

    // Auditoría
    logActivity({
      req,
      modulo: 'USUARIOS',
      accion: 'CREAR_USUARIO',
      descripcion: `Nuevo usuario creado: ${createdUser.nombre} (${createdUser.email}) con rol ${createdUser.rol_nombre}`,
      detalles: { usuario_id: createdUser.id, rol: createdUser.rol_nombre }
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Usuario creado exitosamente',
      data: createdUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar datos de un usuario o cambiar su rol / contraseña (ADMIN)
 * PUT /api/v1/usuarios/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, rol_id, estado, password, modulos_permitidos } = req.body;

    const fields = [];
    const values = [];

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre.trim());
    }
    if (email !== undefined) {
      // Verificar si el correo ya pertenece a otro usuario
      const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email.trim().toLowerCase(), id]);
      if (existing.length > 0) {
        return errorResponse(res, { statusCode: 409, message: 'Ese correo ya está en uso por otro usuario' });
      }
      fields.push('email = ?');
      values.push(email.trim().toLowerCase());
    }
    if (telefono !== undefined) {
      fields.push('telefono = ?');
      values.push(telefono);
    }
    if (rol_id !== undefined) {
      fields.push('rol_id = ?');
      values.push(rol_id);
    }
    if (estado !== undefined) {
      fields.push('estado = ?');
      values.push(estado);
    }
    if (modulos_permitidos !== undefined) {
      const parsedModulos = Array.isArray(modulos_permitidos) ? modulos_permitidos : [];
      fields.push('modulos_permitidos = ?');
      values.push(JSON.stringify(parsedModulos));
    }
    if (password && password.trim().length >= 6) {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      fields.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return errorResponse(res, { statusCode: 400, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    await db.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updatedRows] = await db.query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.modulos_permitidos,
              r.id AS rol_id, r.nombre AS rol_nombre
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    const updatedUser = {
      ...updatedRows[0],
      modulos_permitidos: parseModulos(updatedRows[0].modulos_permitidos, updatedRows[0].rol_id)
    };
    emitEvent('pos:user_updated', updatedUser);

    return successResponse(res, {
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inactivar o activar un usuario (ADMIN)
 * PATCH /api/v1/usuarios/:id/toggle-estado
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // No permitir que el usuario actual se inactive a sí mismo
    if (parseInt(id, 10) === req.user.id) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No puedes desactivar tu propia cuenta activa de administrador'
      });
    }

    const [rows] = await db.query('SELECT estado FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Usuario no encontrado' });
    }

    const nuevoEstado = rows[0].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    await db.query('UPDATE usuarios SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    emitEvent('pos:user_updated', { id, estado: nuevoEstado });

    // Auditoría
    logActivity({
      req,
      modulo: 'USUARIOS',
      accion: 'CAMBIO_ESTADO_USUARIO',
      descripcion: `Estado de usuario ID ${id} modificado a ${nuevoEstado}`,
      detalles: { usuario_id: id, nuevo_estado: nuevoEstado }
    });

    return successResponse(res, {
      message: `Usuario ${nuevoEstado === 'ACTIVO' ? 'activado' : 'inactivado'} exitosamente`,
      data: { id, estado: nuevoEstado }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus
};

