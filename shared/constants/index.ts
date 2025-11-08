// Goal: Define shared constants across application
// Centralizes magic numbers and reusable values

export const API_ROUTES = {
  CAPTURE: '/api/capture',
  ITEMS: '/api/items',
  SEARCH: '/api/search',
  HEALTH: '/health',
} as const;

export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',
} as const;

export const SUCCESS_MESSAGES = {
  ITEM_CREATED: 'Item captured successfully',
  ITEM_UPDATED: 'Item updated successfully',
  ITEM_DELETED: 'Item deleted successfully',
} as const;

export const VALIDATION_LIMITS = {
  MAX_TEXT_LENGTH: 50000,
  MAX_URL_LENGTH: 2048,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TITLE_LENGTH: 500,
  MAX_SUMMARY_LENGTH: 2000,
} as const;

export const QUEUE_NAMES = {
  PROCESS_ITEM: 'process-item',
} as const;

export const ITEM_TYPE_LABELS = {
  NOTE: 'Note',
  ARTICLE: 'Article',
  PRODUCT: 'Product',
  IMAGE: 'Image',
  TODO: 'To-Do',
  FILE: 'File',
} as const;

