const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Cajeros y Administradores pueden listar y ver categorías
router.get('/', verifyToken, categoryController.getCategories);
router.get('/:id', verifyToken, categoryController.getCategoryById);

// Solo Administrador puede crear, actualizar o eliminar categorías
router.post('/', verifyToken, authorizeRoles('ADMIN'), categoryController.createCategory);
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), categoryController.updateCategory);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), categoryController.deleteCategory);

module.exports = router;

