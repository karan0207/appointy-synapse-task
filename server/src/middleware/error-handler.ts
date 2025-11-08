// Goal: Global error handling middleware
// Catches all errors and sends standardized error responses

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendInternalError, sendBadRequest } from '../utils/response.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    sendBadRequest(res, err.message);
    return;
  }

  // Default to 500 internal server error
  sendInternalError(res, process.env.NODE_ENV === 'development' ? err.message : undefined);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};

