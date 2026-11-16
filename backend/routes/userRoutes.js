const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware');

// All user routes require authentication
router.use(protect);

// GET /api/users/profile - Get profile with study stats
router.get('/profile', userController.getProfile);

// PUT /api/users/profile - Update user name, bio, institution, avatar
router.put('/profile', userController.updateProfile);

// PUT /api/users/password - Secure password change
router.put('/password', userController.changePassword);

// PUT /api/users/preferences - Update study goals and notifications
router.put('/preferences', userController.updatePreferences);

// DELETE /api/users/account - Permanently delete account with cascade cleanup
router.delete('/account', userController.deleteAccount);

module.exports = router;

