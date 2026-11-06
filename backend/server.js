require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middleware');
const { AppError, successResponse } = require('./utils');

// Preload models to register Mongoose schemas
require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// -------------------------------------------------------------
// 1. Secure CORS Configuration
// -------------------------------------------------------------
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new AppError(`Origin '${origin}' not permitted by CORS policy`, 403));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// -------------------------------------------------------------
// 2. Body Parsing & Security Middlewares
// -------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development Request Logger
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// -------------------------------------------------------------
// 3. Root Endpoint
// -------------------------------------------------------------
app.get('/', (req, res) => {
  return successResponse(res, {
    statusCode: 200,
    message: 'Welcome to StudyMate REST API - Plan Smart. Study Better. Achieve More.',
    data: {
      app: 'StudyMate – Smart Study Planner API',
      version: '1.0.0',
      tagline: 'Plan Smart. Study Better. Achieve More.',
      status: 'operational',
      environment: NODE_ENV,
      endpoints: {
        health: '/api/health',
        databaseStatus: '/api/database-status',
      },
    },
  });
});

// -------------------------------------------------------------
// 4. API Routes
// -------------------------------------------------------------
app.use('/api', routes);

// -------------------------------------------------------------
// 5. 404 Route Handler
// -------------------------------------------------------------
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`, 404));
});

// -------------------------------------------------------------
// 6. Centralized Error Handling Middleware
// -------------------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------------------
// 7. Server Initialization
// -------------------------------------------------------------
const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] StudyMate API running on http://localhost:${PORT}`);
    console.log(`📡 [Health] http://localhost:${PORT}/api/health`);
    console.log(`📊 [DB Status] http://localhost:${PORT}/api/database-status`);
  });

  // Handle graceful shutdowns
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = app;
