const mongoose = require('mongoose');

let connectionAttempts = 0;
const MAX_RETRIES = 3;

/**
 * Configure Mongoose event listeners
 */
const setupMongooseListeners = () => {
  mongoose.connection.on('connected', () => {
    console.log(`✅ [Database] Mongoose connection open to: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ [Database] Mongoose runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [Database] Mongoose connection lost / disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 [Database] Mongoose reconnected successfully.');
  });
};

/**
 * Connect to MongoDB Atlas using MONGODB_URI environment variable
 */
const connectDB = async () => {
  setupMongooseListeners();

  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn(
      '⚠️ [Database] MONGODB_URI is not configured in .env. Running without active MongoDB Atlas connection.\n' +
      '   Configure MONGODB_URI in backend/.env when ready to connect.'
    );
    return false;
  }

  const options = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    connectionAttempts++;
    const conn = await mongoose.connect(uri, options);
    console.log(`✅ [Database] Connected to MongoDB Atlas host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [Database] Connection failed (Attempt ${connectionAttempts}): ${error.message}`);
    return false;
  }
};

/**
 * Get detailed real-time database connection diagnostics
 */
const getDBStatus = async () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const stateCode = mongoose.connection.readyState;
  const isConnected = stateCode === 1;

  let pingTimeMs = null;
  if (isConnected && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      pingTimeMs = Date.now() - start;
    } catch {
      pingTimeMs = null;
    }
  }

  return {
    stateCode,
    status: states[stateCode] || 'unknown',
    isConnected,
    host: mongoose.connection.host || null,
    port: mongoose.connection.port || null,
    databaseName: mongoose.connection.name || null,
    pingTimeMs,
    registeredModels: Object.keys(mongoose.models),
  };
};

/**
 * Graceful close for server shutdowns and tests
 */
const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    console.log('🔌 [Database] Connection closed gracefully.');
  }
};

module.exports = {
  connectDB,
  getDBStatus,
  closeDB,
};
