require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    app: 'StudyMate – Smart Study Planner',
    tagline: 'Plan Smart. Study Better. Achieve More.',
    version: '1.0.0',
    documentation: 'Welcome to the StudyMate REST API',
    endpoints: {
      health: '/api/health',
    },
  });
});

// API Routes
app.use('/api', healthRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & Connect to DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] StudyMate API running on http://localhost:${PORT}`);
    console.log(`📡 [Health] Endpoint accessible at http://localhost:${PORT}/api/health`);
  });
};

startServer();

module.exports = app;

