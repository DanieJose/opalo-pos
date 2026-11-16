const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const uploadCv = require('../middlewares/uploadCv.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas Públicas (para candidatos que escanean el QR o entran al enlace de postulación)
router.get('/vacantes-publicas', recruitmentController.getPublicVacancies);
router.post('/upload-cv', uploadCv.single('cv'), recruitmentController.uploadCvFile);
router.post('/postular', recruitmentController.submitApplication);

// Rutas Administrativas (Requieren autenticación con Token JWT)
router.get('/metricas', verifyToken, recruitmentController.getRecruitmentMetrics);
router.get('/candidatos', verifyToken, recruitmentController.getCandidates);
router.patch('/candidatos/:id/estado', verifyToken, recruitmentController.updateCandidateStatus);
router.delete('/candidatos/:id', verifyToken, recruitmentController.deleteCandidate);

router.get('/vacantes', verifyToken, recruitmentController.getVacancies);
router.post('/vacantes', verifyToken, recruitmentController.createVacancy);
router.put('/vacantes/:id', verifyToken, recruitmentController.updateVacancy);
router.delete('/vacantes/:id', verifyToken, recruitmentController.deleteVacancy);

module.exports = router;

