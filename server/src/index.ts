// Goal: Express server entry point with middleware setup
// Steps: Validate env → Initialize Express → Setup middleware → Mount routes → Start server

import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import env from './config/env.js';

const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true, // Allow cookies for sessions
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
import { sessionMiddleware } from './config/session.js';
app.use(sessionMiddleware);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
import authRoutes from './routes/auth.js';
import captureRoutes from './routes/capture.js';
import itemsRoutes from './routes/items.js';
import embeddingsRoutes from './routes/embeddings.js';
import searchRoutes from './routes/search.js';

app.use('/api/auth', authRoutes);
app.use('/api/capture', captureRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/embeddings', embeddingsRoutes);
app.use('/api/search', searchRoutes);

// Serve uploaded files (for local storage)
app.use('/uploads', express.static('uploads'));

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`CORS: ${env.CLIENT_URL}`);
  if (env.OPENAI_API_KEY) {
    logger.info(`✓ OpenAI configured`);
  }
});

export default app;

