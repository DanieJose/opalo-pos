const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// El módulo de auditoría y logs es exclusivo para administradores
router.use(verifyToken, authorizeRoles('ADMIN'));

router.get('/', logController.getLogs);
router.get('/stats', logController.getLogStats);
router.delete('/purge', logController.purgeOldLogs);

module.exports = router;

