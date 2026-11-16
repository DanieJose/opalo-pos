const express = require('express');
const router = express.Router();
const cashShiftController = require('../controllers/cashShift.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Obtener estado actual de la caja
router.get('/estado', cashShiftController.getEstadoCaja);

// Registrar salida / retiro de dinero en efectivo de la caja
router.post('/salida', cashShiftController.registrarSalidaCaja);

// Obtener lista de salidas de dinero del turno
router.get('/salidas', cashShiftController.getSalidasCaja);

// Abrir turno de caja con fondo inicial
router.post('/abrir', cashShiftController.abrirCaja);

// Cerrar turno de caja
router.post('/cerrar', cashShiftController.cerrarCaja);

// Historial de turnos
router.get('/historial', cashShiftController.getHistorialCajas);

module.exports = router;
