const express = require('express');
const router = express.Router();
const { getDBStatus } = require('../config/db');

// @route   GET /api/health
// @desc    Health check endpoint returning system status and DB connection
// @access  Public
router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'ok',
    app: 'StudyMate API',
    tagline: 'Plan Smart. Study Better. Achieve More.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      name: dbStatus.name,
    },
  });
});

module.exports = router;

