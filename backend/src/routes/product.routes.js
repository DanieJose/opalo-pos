const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Rutas de consulta (Accesibles por Cajeros y Administradores para operaciones de venta y catálogo)
router.get('/', verifyToken, productController.getProducts);
router.get('/buscar/codigo', verifyToken, productController.findVariantByBarcodeOrSku);
router.get('/etiquetas/items', verifyToken, productController.getItemsForLabels);
router.get('/:id', verifyToken, productController.getProductById);

// Subida de imagen de producto (Multipart Form Data)
router.post('/upload-imagen', verifyToken, upload.single('imagen'), productController.uploadProductImage);

// Gestión de variantes específicas (ADMIN)
router.patch('/variantes/:id/stock', verifyToken, authorizeRoles('ADMIN'), productController.updateVariantStock);
router.delete('/variantes/:id', verifyToken, authorizeRoles('ADMIN'), productController.deleteVariant);

// Rutas de gestión de catálogo (Exclusivas para rol ADMIN)
router.post('/', verifyToken, authorizeRoles('ADMIN'), productController.createProduct);
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), productController.updateProduct);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), productController.deleteProduct);

module.exports = router;

