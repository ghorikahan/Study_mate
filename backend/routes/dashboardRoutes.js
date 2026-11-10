const express = require('express');
const router = express.Router();

const { dashboardController } = require('../controllers');
const { protect } = require('../middleware');

// GET /api/dashboard/summary — Real-time user stats summary
router.get('/summary', protect, dashboardController.getDashboardSummary);

module.exports = router;

