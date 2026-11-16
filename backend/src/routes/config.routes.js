const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');
const uploadLogo = require('../middlewares/uploadLogo.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');

// GET es público o accesible para que las pantallas de Login, POS y Tickets carguen el logo y nombre
router.get('/', configController.getCompanyConfig);

// Rutas de administración (requieren autenticación de usuario)
router.put('/', verifyToken, configController.updateCompanyConfig);
router.post('/logo', verifyToken, uploadLogo.single('logo'), configController.uploadCompanyLogo);
router.delete('/logo', verifyToken, configController.removeCompanyLogo);

module.exports = router;

