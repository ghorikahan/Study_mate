const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Throttle maxWorkers to 2 to prevent EMFILE (too many open files) on Windows
config.maxWorkers = 2;

module.exports = config;
