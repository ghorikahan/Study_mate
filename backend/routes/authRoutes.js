const express = require('express');
const router = express.Router();

const { authController } = require('../controllers');
const { validate, protect } = require('../middleware');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = {
  body: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 60,
      message: 'Name must be between 2 and 60 characters.',
    },
    email: {
      required: true,
      type: 'string',
      pattern: EMAIL_PATTERN,
      message: 'A valid email address is required.',
    },
    password: {
      required: true,
      type: 'string',
      minLength: 6,
      message: 'Password must be at least 6 characters.',
    },
  },
};

const loginSchema = {
  body: {
    email: {
      required: true,
      type: 'string',
      pattern: EMAIL_PATTERN,
      message: 'A valid email address is required.',
    },
    password: {
      required: true,
      type: 'string',
      message: 'Password is required.',
    },
  },
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/auth/register — Create a new account
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login — Log in and receive a JWT
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me — Get current authenticated user (protected)
router.get('/me', protect, authController.getMe);

// POST /api/auth/logout — Stateless logout (protected)
router.post('/logout', protect, authController.logout);

module.exports = router;

