const AppError = require('../utils/appError');
const { errorResponse } = require('../utils/responseHandler');

/**
 * Handle Mongoose CastError (e.g. invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB Duplicate Field Error (code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value for '${field}': '${value}'. Please use another value.`;
  return new AppError(message, 409, { [field]: `${field} already exists` });
};

/**
 * Handle Mongoose Schema Validation Error
 */
const handleValidationErrorDB = (err) => {
  const errors = {};
  Object.values(err.errors).forEach((el) => {
    errors[el.path] = el.message;
  });
  const message = `Validation failed: ${Object.values(errors).join('. ')}`;
  return new AppError(message, 400, errors);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () =>
  new AppError('Invalid authentication token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your authentication token has expired. Please log in again.', 401);

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;

  // Handle Body-Parser JSON Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload received.', 400);
  }

  // Handle Mongoose specific errors
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || null;

  // Log unexpected errors for backend diagnostics
  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('💥 [Server Error]:', err);
  }

  return errorResponse(res, {
    statusCode,
    message,
    errors,
  });
};

module.exports = errorHandler;

