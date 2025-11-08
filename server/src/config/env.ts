// Goal: Environment variable validation and configuration
// Ensures all required environment variables are present

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  
  // Server
  PORT: number;
  NODE_ENV: string;
  
  // Session
  SESSION_SECRET: string;
  
  // CORS
  CLIENT_URL: string;
  
  // OpenAI (optional)
  OPENAI_API_KEY?: string;
  
  // S3/R2 (optional)
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
}

/**
 * Validate and parse environment variables
 */
function validateEnv(): EnvironmentConfig {
  const required = [
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'SESSION_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about optional but recommended variables
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set - AI features will be disabled');
  }

  if (process.env.NODE_ENV === 'production' && process.env.SESSION_SECRET === 'dev-secret-change-in-production') {
    throw new Error('SESSION_SECRET must be changed in production');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: parseInt(process.env.REDIS_PORT!, 10),
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    SESSION_SECRET: process.env.SESSION_SECRET!,
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
  };
}

export const env = validateEnv();

export default env;

