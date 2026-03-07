const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

// Admin routes require auth and Admin role
router.use(verifyToken);
router.use(authorizeRoles('Admin'));

// Get all users in the system
router.get('/users', adminController.getAllUsers);

// Transfer captainship of a barangay
router.post('/transfer-captainship', adminController.transferCaptainship);

// Update user status (active/suspended)
router.post('/update-status', adminController.updateUserStatus);

module.exports = router;
