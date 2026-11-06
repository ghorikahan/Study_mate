const express = require('express');
const router = express.Router();
const { healthController } = require('../controllers');

// @route   GET /api/health
router.get('/health', healthController.getHealth);

// @route   GET /api/database-status
router.get('/database-status', healthController.getDatabaseStatus);

module.exports = router;
