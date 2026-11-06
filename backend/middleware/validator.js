const AppError = require('../utils/appError');

/**
 * Request Validation Middleware Generator
 * Validates request data against specified field rules
 *
 * Example rule format:
 * {
 *   body: {
 *     email: { required: true, type: 'string', pattern: /^[^@]+@[^@]+\.[^@]+$/, message: 'Valid email required' },
 *     password: { required: true, minLength: 6 },
 *   }
 * }
 */
const validate = (schema) => (req, res, next) => {
  const errors = {};

  ['body', 'params', 'query'].forEach((source) => {
    if (!schema[source]) return;

    const sourceData = req[source] || {};
    const rules = schema[source];

    Object.keys(rules).forEach((field) => {
      const rule = rules[field];
      const val = sourceData[field];
      const isMissing = val === undefined || val === null || val === '';

      if (rule.required && isMissing) {
        errors[field] = rule.message || `${field} is required`;
        return;
      }

      if (!isMissing) {
        if (rule.type && typeof val !== rule.type) {
          errors[field] = rule.message || `${field} must be of type ${rule.type}`;
          return;
        }

        if (rule.minLength && typeof val === 'string' && val.length < rule.minLength) {
          errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
          return;
        }

        if (rule.maxLength && typeof val === 'string' && val.length > rule.maxLength) {
          errors[field] = rule.message || `${field} cannot exceed ${rule.maxLength} characters`;
          return;
        }

        if (rule.min && typeof val === 'number' && val < rule.min) {
          errors[field] = rule.message || `${field} must be at least ${rule.min}`;
          return;
        }

        if (rule.max && typeof val === 'number' && val > rule.max) {
          errors[field] = rule.message || `${field} cannot exceed ${rule.max}`;
          return;
        }

        if (rule.enum && !rule.enum.includes(val)) {
          errors[field] = rule.message || `${field} must be one of: ${rule.enum.join(', ')}`;
          return;
        }

        if (rule.pattern && !rule.pattern.test(String(val))) {
          errors[field] = rule.message || `${field} format is invalid`;
          return;
        }

        if (rule.custom && typeof rule.custom === 'function') {
          const customError = rule.custom(val, sourceData);
          if (customError) {
            errors[field] = customError;
            return;
          }
        }
      }
    });
  });

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Request validation failed', 400, errors));
  }

  next();
};

module.exports = { validate };

