const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Listar todas las categorías
 * GET /api/v1/categorias
 */
const getCategories = async (req, res, next) => {
  try {
    const { estado } = req.query;
    let sql = 'SELECT * FROM categorias';
    const params = [];

    if (estado) {
      sql += ' WHERE estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY nombre ASC';
    const [rows] = await db.query(sql, params);

    return successResponse(res, {
      message: 'Categorías obtenidas correctamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener categoría por ID
 * GET /api/v1/categorias/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);

    if (rows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Categoría no encontrada' });
    }

    return successResponse(res, {
      message: 'Categoría obtenida correctamente',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nueva categoría (ADMIN)
 * POST /api/v1/categorias
 */
const createCategory = async (req, res, next) => {
  const { nombre, descripcion } = req.body || {};
  try {
    if (!nombre) {
      return errorResponse(res, { statusCode: 400, message: 'El nombre de la categoría es obligatorio' });
    }

    const [result] = await db.query(
      'INSERT INTO categorias (nombre, descripcion, estado) VALUES (?, ?, "ACTIVO")',
      [nombre.trim(), descripcion || null]
    );

    return successResponse(res, {
      statusCode: 201,
      message: 'Categoría creada exitosamente',
      data: {
        id: result.insertId,
        nombre: nombre.trim(),
        descripcion
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const [existing] = await db.query('SELECT * FROM categorias WHERE LOWER(nombre) = LOWER(?) LIMIT 1', [nombre ? nombre.trim() : '']);
      if (existing.length > 0) {
        return successResponse(res, {
          statusCode: 200,
          message: 'La categoría ya existe y está disponible',
          data: existing[0]
        });
      }
      return errorResponse(res, { statusCode: 409, message: 'Ya existe una categoría con ese nombre' });
    }
    next(error);
  }
};

/**
 * Actualizar categoría (ADMIN)
 * PUT /api/v1/categorias/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    const fields = [];
    const values = [];

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre.trim());
    }
    if (descripcion !== undefined) {
      fields.push('descripcion = ?');
      values.push(descripcion);
    }
    if (estado !== undefined) {
      fields.push('estado = ?');
      values.push(estado);
    }

    if (fields.length === 0) {
      return errorResponse(res, { statusCode: 400, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    await db.query(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, values);

    return successResponse(res, { message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar o desactivar categoría (ADMIN)
 * DELETE /api/v1/categorias/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si tiene productos asociados
    const [products] = await db.query('SELECT COUNT(*) AS count FROM productos WHERE categoria_id = ?', [id]);
    if (products[0].count > 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: `No se puede eliminar la categoría porque contiene ${products[0].count} producto(s) asignado(s)`
      });
    }

    await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    return successResponse(res, { message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

