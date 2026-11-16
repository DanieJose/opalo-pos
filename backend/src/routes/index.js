const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const customerRoutes = require('./customer.routes');
const saleRoutes = require('./sale.routes');
const reportRoutes = require('./report.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const logRoutes = require('./log.routes');
const cashShiftRoutes = require('./cashShift.routes');
const supplierRoutes = require('./supplier.routes');
const recruitmentRoutes = require('./recruitment.routes');
const configRoutes = require('./config.routes');
const financeRoutes = require('./finance.routes');

// Endpoint de verificación de salud del API (Healthcheck)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    app: 'Ópalo Accesorios POS API',
    location: 'Tocoa, Colón, Honduras',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Montaje de módulos principales
router.use('/auth', authRoutes);
router.use('/productos', productRoutes);
router.use('/categorias', categoryRoutes);
router.use('/clientes', customerRoutes);
router.use('/ventas', saleRoutes);
router.use('/reportes', reportRoutes);
router.use('/usuarios', userRoutes);
router.use('/roles', roleRoutes);
router.use('/logs', logRoutes);
router.use('/caja', cashShiftRoutes);
router.use('/proveedores', supplierRoutes);
router.use('/reclutamiento', recruitmentRoutes);
router.use('/configuracion', configRoutes);
router.use('/empresa', configRoutes);
router.use('/finanzas', financeRoutes);

module.exports = router;
