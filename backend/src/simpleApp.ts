/**
 * Simplified BibleBridge Backend Application
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { config } from './utils/config';
import { logger } from './utils/logger';
import { errorHandler } from './utils/errors';
import simpleRoutes from './routes/simpleRoutes';

// Create Express application
const app = express();

// Basic middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      }
    }
  }));
}

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'BibleBridge Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      translations: '/api/translations',
      books: '/api/books',
      chapter: '/api/translations/:translation/:book/:chapter',
      search: '/api/search/:translation?q=term',
      userPosition: '/api/user/position',
      userSettings: '/api/user/settings',
      tts: '/api/tts/generate',
      pronunciations: '/api/pronunciations'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', simpleRoutes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, config.host, () => {
  logger.info(`BibleBridge Backend API started on ${config.host}:${config.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;