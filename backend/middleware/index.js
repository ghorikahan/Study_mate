const errorHandler = require('./errorHandler');
const { validate } = require('./validator');
const protect = require('./protect');
const restrictTo = require('./restrictTo');

module.exports = {
  errorHandler,
  validate,
  protect,
  restrictTo,
};
