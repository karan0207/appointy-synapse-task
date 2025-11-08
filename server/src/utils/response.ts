// Goal: Standardize API response format
// Provides consistent response structure across endpoints

import type { Response } from 'express';
import type { ApiResponse } from '@synapse/shared';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500
): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
): void => {
  sendSuccess(res, data, message, 201);
};

export const sendBadRequest = (res: Response, error: string): void => {
  sendError(res, error, 400);
};

export const sendNotFound = (res: Response, error: string): void => {
  sendError(res, error, 404);
};

export const sendUnauthorized = (res: Response, error: string): void => {
  sendError(res, error, 401);
};

export const sendInternalError = (res: Response, error?: string): void => {
  sendError(res, error || 'Internal server error', 500);
};

