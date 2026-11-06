const { getDBStatus } = require('../config/db');
const { asyncHandler, successResponse } = require('../utils');

/**
 * @route   GET /api/health
 * @desc    Get overall server and API health
 * @access  Public
 */
const getHealth = asyncHandler(async (req, res) => {
  const memoryUsage = process.memoryUsage();

  const healthData = {
    app: 'StudyMate API',
    tagline: 'Plan Smart. Study Better. Achieve More.',
    version: '1.0.0',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeFormatted: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    timestamp: new Date().toISOString(),
    memory: {
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
    },
    nodeVersion: process.version,
  };

  return successResponse(res, {
    statusCode: 200,
    message: 'StudyMate API is running smoothly',
    data: healthData,
  });
});

/**
 * @route   GET /api/database-status
 * @desc    Detailed MongoDB Atlas connection diagnostic endpoint
 * @access  Public
 */
const getDatabaseStatus = asyncHandler(async (req, res) => {
  const dbStatus = await getDBStatus();

  return successResponse(res, {
    statusCode: 200,
    message: dbStatus.isConnected
      ? 'MongoDB Atlas is connected and operational'
      : 'MongoDB Atlas is currently disconnected or pending configuration in .env',
    data: dbStatus,
  });
});

module.exports = {
  getHealth,
  getDatabaseStatus,
};

