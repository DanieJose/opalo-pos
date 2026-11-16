const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, roleController.getRoles);

module.exports = router;

