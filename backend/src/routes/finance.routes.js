const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Rutas protegidas para el módulo de Finanzas
router.get('/resumen', verifyToken, financeController.getFinanceSummary);

// Gastos y Egresos Operativos
router.get('/gastos', verifyToken, financeController.getExpenses);
router.post('/gastos', verifyToken, financeController.createExpense);
router.put('/gastos/:id', verifyToken, financeController.updateExpense);
router.delete('/gastos/:id', verifyToken, authorizeRoles('ADMIN'), financeController.deleteExpense);

// Cuentas por Pagar (Proveedores)
router.get('/cuentas-por-pagar', verifyToken, financeController.getAccountsPayable);
router.post('/cuentas-por-pagar', verifyToken, financeController.createAccountPayable);
router.post('/cuentas-por-pagar/:id/abono', verifyToken, financeController.addPaymentToAccountPayable);

module.exports = router;

