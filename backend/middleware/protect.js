const User = require('../models/User');
const { verifyToken } = require('../utils/jwtHelper');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware — protect
 * Verifies the Bearer JWT in the Authorization header and attaches
 * the authenticated user to req.user.
 *
 * Usage: router.get('/me', protect, controller.getMe)
 */
const protect = asyncHandler(async (req, res, next) => {
  // 1. Extract token from Authorization header
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in to access this resource.', 401));
  }

  // 2. Verify token (throws AppError on failure)
  const decoded = verifyToken(token);

  // 3. Check the user still exists in DB
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4. Attach sanitized user to request (password excluded by default via schema select:false)
  req.user = currentUser;

  next();
});

module.exports = protect;
