/**
 * BibleBridge Backend Application
 * 
 * Main Express application setup with middleware, routes, and configuration
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config, validateConfig, features } from './utils/config';
import { logger, logRequest } from './utils/logger';
import { 
  errorHandler, 
  handleUnhandledRejections, 
  handleUncaughtExceptions 
} from './utils/errors';
import { 
  securityHeaders, 
  corsOptions, 
  rateLimiters,
  securityLogger,
  slowDown,
} from './middleware/security';
import { sanitizeInput } from './middleware/validation';
import apiRoutes from './routes';

// Handle unhandled rejections and exceptions
handleUnhandledRejections();
handleUncaughtExceptions();

// Validate configuration
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error: any) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

// Create Express application
const app = express();

// Trust proxy (important for rate limiting and security)
app.set('trust proxy', 1);

// Swagger/OpenAPI configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BibleBridge Backend API',
      version: process.env['npm_package_version'] || '1.0.0',
      description: 'Comprehensive Bible study platform backend with TTS and pronunciation support',
      contact: {
        name: 'BibleBridge Team',
        email: 'support@biblebridge.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://${config.host}:${config.port}/api`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Translation: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'KJV' },
            name: { type: 'string', example: 'King James Version' },
            description: { type: 'string', example: 'Classic English translation from 1611' },
            available: { type: 'boolean', example: true },
          },
        },
        BookMetadata: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Genesis' },
            testament: { type: 'string', enum: ['Old Testament', 'New Testament'] },
            chapterCount: { type: 'integer', example: 50 },
            order: { type: 'integer', example: 1 },
          },
        },
        BibleVerse: {
          type: 'object',
          properties: {
            verse: { type: 'string', example: '1' },
            text: { type: 'string', example: 'In the beginning was the Word...' },
          },
        },
        PronunciationData: {
          type: 'object',
          properties: {
            phonetic: { type: 'string', example: 'AY-bruh-ham' },
            ipa: { type: 'string', example: '/ˈeɪbrəˌhæm/' },
            phoneme: { type: 'string', example: 'aee bruh ham' },
            source: { type: 'string', example: 'bible_blender' },
          },
        },
        TTSRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Abraham' },
            phonetic: { type: 'string', example: 'AY-bruh-ham' },
            ipa: { type: 'string', example: '/ˈeɪbrəˌhæm/' },
            phoneme: { type: 'string', example: 'aee bruh ham' },
            voice_settings: {
              type: 'object',
              properties: {
                speed: { type: 'number', minimum: 0.1, maximum: 3.0, example: 0.8 },
                speaker_id: { type: 'integer', minimum: 0, maximum: 10, example: 0 },
              },
            },
          },
        },
        UserPosition: {
          type: 'object',
          properties: {
            book: { type: 'string', example: 'John' },
            chapter: { type: 'integer', example: 3 },
            verse: { type: 'integer', example: 16 },
            translation: { type: 'string', example: 'KJV' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        UserSettings: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['dark', 'light'], example: 'dark' },
            fontSize: { type: 'integer', minimum: 8, maximum: 72, example: 22 },
            fontFamily: { type: 'string', example: 'Georgia' },
            showRedLetters: { type: 'boolean', example: true },
            redLetterBrightness: { type: 'integer', minimum: 0, maximum: 100, example: 100 },
            textBrightness: { type: 'integer', minimum: 0, maximum: 100, example: 100 },
            rgbWaveEnabled: { type: 'boolean', example: false },
            rgbWaveSpeed: { type: 'number', minimum: 0.1, maximum: 10, example: 2.0 },
            showPronunciations: { type: 'boolean', example: true },
            pronunciationStyle: { type: 'string', enum: ['phonetic', 'ipa'], example: 'phonetic' },
            ttsEnabled: { type: 'boolean', example: true },
            leftTranslation: { type: 'string', example: 'KJV' },
            rightTranslation: { type: 'string', example: 'NLT' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Basic middleware
app.use(securityHeaders);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(cors(corsOptions));

// Security middleware
app.use(securityLogger);
app.use(slowDown);
app.use(sanitizeInput);

// Logging middleware
if (features.enableRequestLogging) {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  }));
  app.use(logRequest);
}

// Rate limiting
app.use('/api', rateLimiters.general);

// API Documentation (only in development)
if (features.enableApiDocs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BibleBridge API Documentation',
  }));
  
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  logger.info(`API documentation available at http://${config.host}:${config.port}/api-docs`);
}

// Health check endpoint (before API routes)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'BibleBridge Backend API',
    version: process.env['npm_package_version'] || '1.0.0',
    status: 'running',
    documentation: features.enableApiDocs ? `/api-docs` : 'disabled',
    endpoints: {
      health: '/health',
      api: '/api',
      bible: '/api/translations, /api/books, /api/search',
      pronunciations: '/api/pronunciations',
      tts: '/api/tts',
      user: '/api/user',
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/health',
      'GET /api/status',
      'GET /api/info',
      features.enableApiDocs ? 'GET /api-docs' : null,
    ].filter(Boolean),
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, config.host, () => {
  logger.info(`BibleBridge Backend API started`, {
    host: config.host,
    port: config.port,
    env: config.env,
    documentation: features.enableApiDocs ? `http://${config.host}:${config.port}/api-docs` : 'disabled',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;