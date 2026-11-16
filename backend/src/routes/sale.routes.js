const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Cajeros y Administradores pueden registrar ventas y consultar recibos
router.get('/devoluciones', verifyToken, saleController.getReturns);
router.post('/', verifyToken, saleController.createSale);
router.get('/', verifyToken, saleController.getSales);
router.get('/:id', verifyToken, saleController.getSaleById);

// Devoluciones y reembolsos de productos (retorno a inventario)
router.post('/:id/devolucion', verifyToken, saleController.createReturn);

// Anulación de venta (Privilegio reservado para rol ADMIN)
router.put('/:id/anular', verifyToken, authorizeRoles('ADMIN'), saleController.cancelSale);

module.exports = router;

