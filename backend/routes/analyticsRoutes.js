const express = require('express');
const router = express.Router();

const { protect } = require('../middleware');
const { getAnalyticsOverview } = require('../controllers/analyticsController');

// All analytics routes require authentication
router.use(protect);

router.get('/overview', getAnalyticsOverview);
router.get('/', getAnalyticsOverview); // Default to overview

module.exports = router;

