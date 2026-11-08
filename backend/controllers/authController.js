const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/responseHandler');
const { generateToken } = require('../utils/jwtHelper');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: strip sensitive fields before returning user to client
// (toJSON() on the model already removes password & __v, but this is explicit)
// ─────────────────────────────────────────────────────────────────────────────
const sanitizeUser = (user) => {
  const obj = user.toObject({ virtuals: false });
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Normalize email before saving (schema also lowercases, belt-and-suspenders)
  const normalizedEmail = email.toLowerCase().trim();

  // Check for duplicate email explicitly to return a friendly 409
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Create user — password hashed by pre-save hook in User model
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    // Only allow 'student' or 'admin'; default is 'student'
    role: role === 'admin' ? 'admin' : 'student',
  });

  // Generate JWT
  const token = generateToken(user._id.toString());

  return successResponse(res, {
    statusCode: 201,
    message: 'Account created successfully. Welcome to StudyMate!',
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select password (it's excluded by default via select:false)
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Use identical error message for email-not-found and wrong-password
  // to avoid leaking which of the two failed (security best practice)
  const INVALID_CREDS_MSG = 'Invalid email or password.';

  if (!user) {
    return next(new AppError(INVALID_CREDS_MSG, 401));
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    return next(new AppError(INVALID_CREDS_MSG, 401));
  }

  const token = generateToken(user._id.toString());

  return successResponse(res, {
    statusCode: 200,
    message: 'Logged in successfully.',
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res, next) => {
  // req.user is set by protect middleware; fetch a fresh copy to ensure latest data
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  return successResponse(res, {
    statusCode: 200,
    message: 'User profile retrieved successfully.',
    data: { user: sanitizeUser(user) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (protected — stateless logout)
// ─────────────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  // JWT is stateless — server cannot invalidate tokens without a blocklist.
  // Instruct the client to delete the token from storage.
  return successResponse(res, {
    statusCode: 200,
    message: 'Logged out successfully. Please delete your token on the client.',
    data: null,
  });
});

module.exports = { register, login, getMe, logout };

