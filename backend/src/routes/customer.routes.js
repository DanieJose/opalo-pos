const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas de clientes accesibles tanto por Cajero como por Administrador
router.get('/', verifyToken, customerController.getCustomers);
router.get('/buscar/qr/:codigo', verifyToken, customerController.findCustomerByQR);
router.get('/:id', verifyToken, customerController.getCustomerById);
router.post('/', verifyToken, customerController.createCustomer);
router.put('/:id', verifyToken, customerController.updateCustomer);
router.post('/:id/ajustar-puntos', verifyToken, customerController.adjustPoints);
router.patch('/:id/toggle-estado', verifyToken, customerController.toggleCustomerStatus);

module.exports = router;

