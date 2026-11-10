const jwt = require('jsonwebtoken');
const AppError = require('./appError');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'studymate_default_jwt_secret_key_2026';
};

/**
 * Generate a signed JWT for the given userId.
 * Uses JWT_SECRET and JWT_EXPIRES_IN from environment variables.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  const secret = getJwtSecret();

  return jwt.sign(
    { id: userId },
    secret,
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
  const secret = getJwtSecret();

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Your token has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid token. Please log in again.', 401);
  }
};

module.exports = { generateToken, verifyToken };

