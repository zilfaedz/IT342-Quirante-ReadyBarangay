const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const reportController = require('../controllers/reportController');

// All reports routes require authentication
router.use(verifyToken);

// Create a report (with image upload)
// Allowed: Resident, Official, Captain
router.post(
    '/',
    authorizeRoles('Resident', 'Barangay Official', 'Barangay Captain'),
    upload.single('photo'),
    reportController.createReport
);

// Get logged-in user's own reports
// Allowed: Resident
router.get('/my-reports', authorizeRoles('Resident'), reportController.getMyReports);

// Get reports for the user's barangay
// Allowed: Official, Captain
router.get(
    '/barangay',
    authorizeRoles('Barangay Official', 'Barangay Captain'),
    reportController.getBarangayReports
);

// Update report status
// Allowed: Responder, Official, Captain
router.patch(
    '/:id/status',
    authorizeRoles('Responder', 'Barangay Official', 'Barangay Captain'),
    reportController.updateStatus
);

// Get city-wide analytics
// Allowed: City Admin, System Admin
router.get(
    '/analytics/city',
    authorizeRoles('City Admin', 'System Admin'),
    reportController.getCityAnalytics
);

module.exports = router;
