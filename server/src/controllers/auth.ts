// Goal: Authentication controller
// Handles user signup, login, logout, and session management

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } from '../utils/response.js';
import { hashPassword, verifyPassword } from '../services/auth.js';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/signup - Create new user account
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validationResult = signupSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { email, password, name } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendBadRequest(res, 'Email already registered');
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Create session
    req.session.userId = user.id;

    logger.info(`New user registered: ${email}`);

    sendCreated(res, { user }, 'Account created successfully');

  } catch (error) {
    logger.error('Signup error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/login - Login with email/password
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    // Create session
    req.session.userId = user.id;

    logger.info(`User logged in: ${email}`);

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    }, 'Login successful');

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/logout - Logout current user
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Logout error:', err);
        next(err);
        return;
      }

      res.clearCookie('connect.sid');
      sendSuccess(res, {}, 'Logout successful');
    });

  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

/**
 * GET /api/auth/me - Get current user info
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    sendSuccess(res, { user });

  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
};

