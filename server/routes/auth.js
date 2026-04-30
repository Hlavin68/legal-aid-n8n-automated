import express from 'express';
import rateLimit from 'express-rate-limit';

import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  getUsers
} from '../controllers/authController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ================= RATE LIMITING =================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  message: 'Too many requests. Please try again later.'
});

// ================= VALIDATION MIDDLEWARE =================
const validateRegister = (req, res, next) => {
  const { name, email, password, role, firm, licenseNumber, username } = req.body;
  const normalizedRole = String(role || '').toLowerCase();
  const allowedRoles = ['client', 'lawyer', 'paralegal', 'admin'];

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: 'Name, email, password, and role are required'
    });
  }

  if (!allowedRoles.includes(normalizedRole)) {
    return res.status(400).json({
      error: 'Role must be one of: client, lawyer, paralegal, admin'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters'
    });
  }

  if (normalizedRole === 'paralegal' && !username) {
    return res.status(400).json({ error: 'Username is required for paralegals' });
  }

  if ((normalizedRole === 'lawyer' || normalizedRole === 'paralegal') && !firm) {
    return res.status(400).json({ error: 'Firm is required for lawyers and paralegals' });
  }

  if (normalizedRole === 'lawyer' && !licenseNumber) {
    return res.status(400).json({ error: 'License number is required for lawyers' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  next();
};

// ================= ROUTES =================

// Register
router.post('/register', authLimiter, validateRegister, register);

// Login
router.post('/login', authLimiter, validateLogin, login);

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Update profile
router.put('/profile', authenticate, updateProfile);

// Get users (for assignment)
router.get('/users', authenticate, getUsers);

// Logout (client-side token removal, but useful endpoint)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;