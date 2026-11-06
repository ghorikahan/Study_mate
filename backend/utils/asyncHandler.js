/**
 * Async handler wrapper to eliminate try/catch blocks in express route controllers
 * @param {Function} fn - async express route handler
 * @returns {Function} wrapped express handler forwarding errors to next()
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

