// Goal: Configure express-session with Redis store
// Provides secure session management for authentication

import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import env from './env.js';

// Create Redis client for session store
const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().catch(console.error);

// Create session middleware
export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

