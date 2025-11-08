// Goal: Authentication middleware
// Checks if user is logged in before allowing access to protected routes

import type { Request, Response, NextFunction } from 'express';
import { sendUnauthorized } from '../utils/response.js';

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }
  next();
}

/**
 * Middleware to attach user ID to request
 * (for routes that need user context but don't require auth)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // Just attach userId if it exists, don't block
  // Can be used later to personalize content
  next();
}

