const AppError = require('../utils/appError');

/**
 * Role-based Authorization Middleware — restrictTo
 * Must be used AFTER the protect middleware (requires req.user).
 *
 * @param {...string} roles - Allowed roles, e.g. restrictTo('admin') or restrictTo('student', 'admin')
 * @returns {Function} Express middleware
 *
 * Usage: router.delete('/users/:id', protect, restrictTo('admin'), controller.deleteUser)
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `You do not have permission to perform this action. Required role: ${roles.join(' or ')}.`,
        403
      )
    );
  }

  next();
};

module.exports = restrictTo;
