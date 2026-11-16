const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio para almacenar currículums y hojas de vida
const cvDir = path.join(__dirname, '../../public/uploads/cvs');
if (!fs.existsSync(cvDir)) {
  fs.mkdirSync(cvDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 35);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `cv-${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de formatos para hojas de vida (PDF, DOC, DOCX, Imágenes)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Formato no válido. Por favor sube tu hoja de vida en PDF, Word (.docx) o Imagen.'), false);
  }
};

const uploadCv = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB máximo
  }
});

module.exports = uploadCv;

