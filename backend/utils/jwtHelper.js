const jwt = require('jsonwebtoken');
const AppError = require('./appError');

/**
 * Generate a signed JWT for the given userId.
 * Uses JWT_SECRET and JWT_EXPIRES_IN from environment variables.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify and decode a JWT.
 * Throws if the token is invalid or expired.
 *
 * @param {string} token - JWT string
 * @returns {object} Decoded payload { id, iat, exp }
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Your token has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid token. Please log in again.', 401);
  }
};

module.exports = { generateToken, verifyToken };

