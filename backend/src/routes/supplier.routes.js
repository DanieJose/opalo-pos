const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Listar proveedores
router.get('/', supplierController.getSuppliers);

// Resumen general de control de pagos a proveedores (Debe ir antes de /:id)
router.get('/control-pagos/resumen', supplierController.getSuppliersPaymentsOverview);

// Detalle de proveedor
router.get('/:id', supplierController.getSupplierById);

// Estado de cuenta, facturas e historial de pagos de un proveedor
router.get('/:id/estado-cuenta', supplierController.getSupplierAccountStatement);

// Registrar factura de compra a crédito para un proveedor
router.post('/:id/facturas', supplierController.createSupplierInvoice);

// Crear proveedor
router.post('/', supplierController.createSupplier);

// Actualizar proveedor
router.put('/:id', supplierController.updateSupplier);

// Cambiar estado activo/inactivo
router.patch('/:id/estado', supplierController.toggleSupplierStatus);

// Eliminar proveedor
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;

