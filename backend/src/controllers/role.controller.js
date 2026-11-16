const db = require('../config/db');
const { successResponse } = require('../utils/response');

/**
 * Listar roles disponibles
 * GET /api/v1/roles
 */
const getRoles = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id ASC');
    return successResponse(res, {
      message: 'Roles obtenidos correctamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles
};

