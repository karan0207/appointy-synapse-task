// Goal: User settings controller for profile and password updates
// Handles profile updates and password changes

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendBadRequest, sendUnauthorized } from '../utils/response.js';
import { hashPassword, verifyPassword } from '../services/auth.js';

const updateProfileSchema = z.object({
  name: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * PATCH /api/auth/profile - Update user profile
 */
export const updateProfile = async (
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

    // Validate input
    const validationResult = updateProfileSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { name } = validationResult.data;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    logger.info(`Profile updated for user: ${user.email}`);

    sendSuccess(res, { user }, 'Profile updated successfully');

  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

/**
 * PATCH /api/auth/password - Change password
 */
export const changePassword = async (
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

    // Validate input
    const validationResult = changePasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      sendBadRequest(res, 'Current password is incorrect');
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    logger.info(`Password changed for user: ${user.email}`);

    sendSuccess(res, {}, 'Password changed successfully');

  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

