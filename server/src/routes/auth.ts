// Goal: Authentication routes
// Handles signup, login, logout, current user, and settings endpoints

import express from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/auth.js';
import { updateProfile, changePassword } from '../controllers/settings.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/signup - Create new user account
router.post('/signup', signup);

// POST /api/auth/login - Login with email/password
router.post('/login', login);

// POST /api/auth/logout - Logout current user
router.post('/logout', requireAuth, logout);

// GET /api/auth/me - Get current user info
router.get('/me', requireAuth, getCurrentUser);

// PATCH /api/auth/profile - Update user profile
router.patch('/profile', requireAuth, updateProfile);

// PATCH /api/auth/password - Change password
router.patch('/password', requireAuth, changePassword);

export default router;

