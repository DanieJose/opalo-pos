const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Rutas de reportes analíticos y arqueo (Acceso para Administrador y Cajero)
router.get('/dashboard', verifyToken, reportController.getDashboardSummary);
router.get('/stock-bajo', verifyToken, reportController.getLowStockAlerts);
router.get('/top-vendidos', verifyToken, reportController.getTopSelling);
router.get('/ventas', verifyToken, reportController.getSalesReport);
router.get('/inventario', verifyToken, reportController.getInventoryReport);
router.get('/clientes', verifyToken, reportController.getTopCustomersReport);
router.get('/categorias', verifyToken, reportController.getCategoriesReport);

module.exports = router;

