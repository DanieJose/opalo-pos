const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio para almacenar logotipos de la empresa
const logoDir = path.join(__dirname, '../../public/uploads/logo');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `logo-${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de archivo para logos (incluye SVG para logos vectoriales)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'image/jpg'
  ];

  if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Formato no válido. Por favor sube una imagen para el logotipo (PNG, JPG, WEBP o SVG).'), false);
  }
};

const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB máximo
  }
});

module.exports = uploadLogo;

