# BibleBridge Backend API

A comprehensive Node.js/Express backend API for the BibleBridge Bible study platform, featuring Bible text retrieval, biblical name pronunciations, text-to-speech generation, and user data management.

## Features

- **Bible Text API**: Access to multiple translations (KJV, NLT, NIV, CSB)
- **Search Functionality**: Full-text search across all translations
- **Pronunciation Support**: Biblical names with phonetic, IPA, and phoneme formats
- **Text-to-Speech**: Neural TTS for biblical name pronunciations
- **User Data Management**: Persistent reading positions and customizable settings
- **Performance Optimized**: Built-in caching and rate limiting
- **Comprehensive API Documentation**: Swagger/OpenAPI documentation
- **Production Ready**: Logging, error handling, and security features

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Python 3.8+ (for TTS service)
- Existing BibleBridge data files (translations and pronunciations)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the TTS service** (in separate terminal):
   ```bash
   cd ../src/tts
   python piper_api_server.py
   ```

4. **Start the backend API:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

5. **Access the API:**
   - API: http://localhost:3000/api
   - Documentation: http://localhost:3000/api-docs
   - Health: http://localhost:3000/health

## API Endpoints

### Bible Data
- `GET /api/translations` - List available translations
- `GET /api/books` - List all Bible books
- `GET /api/books/:book/chapters` - Get chapters for a book
- `GET /api/translations/:translation/:book/:chapter` - Get chapter content
- `GET /api/search/:translation?query=...` - Search Bible text

### Pronunciations
- `GET /api/pronunciations` - Get all pronunciation data
- `GET /api/pronunciations/:name` - Get pronunciation for specific name
- `GET /api/pronunciations/search?query=...` - Search biblical names
- `POST /api/pronunciations/detect` - Detect biblical names in text

### Text-to-Speech
- `POST /api/tts/generate` - Generate TTS audio
- `GET /api/tts/audio/:name` - Get audio for biblical name
- `GET /api/tts/health` - Check TTS service status

### User Data
- `GET /api/user/position` - Get reading position
- `POST /api/user/position` - Save reading position
- `GET /api/user/settings` - Get user settings
- `POST /api/user/settings` - Save user settings
- `GET /api/user/profile` - Get complete profile

### System
- `GET /api/health` - System health check
- `GET /api/status` - API status
- `GET /api/info` - API capabilities

## Configuration

Key environment variables:

```bash
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Services
TTS_SERVICE_URL=http://localhost:5001
TRANSLATIONS_PATH=../translations
PRONUNCIATIONS_PATH=../data/pronunciations

# Performance
CACHE_TTL_SECONDS=3600
RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_API_DOCS=true
```

## Data Structure

### Bible Translations
```
translations/
├── KJV_json/
│   ├── Genesis.json
│   ├── Exodus.json
│   └── ...
├── NLT_json/
├── NIV_json/
└── CSB_json/
```

### Pronunciation Data
```
data/pronunciations/
└── biblical_names.json
```

### User Data
```
backend/data/users/
├── default_position.json
├── default_settings.json
└── ...
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
```

### Project Structure

```
src/
├── controllers/     # Route handlers
├── services/        # Business logic
├── middleware/      # Custom middleware
├── routes/          # API routes
├── types/           # TypeScript types
├── utils/           # Utility functions
└── app.ts           # Express app setup
```

## API Documentation

When `ENABLE_API_DOCS=true`, full Swagger documentation is available at:
- **Interactive docs**: http://localhost:3000/api-docs
- **OpenAPI spec**: http://localhost:3000/api-docs.json

## Performance Features

- **Intelligent Caching**: Bible data, search results, and TTS audio
- **Rate Limiting**: Configurable limits for different endpoint types
- **Compression**: Gzip compression for responses
- **Request Optimization**: Input validation and sanitization

## Security Features

- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js integration
- **Rate Limiting**: Multiple tiers based on resource intensity
- **Input Validation**: Joi schema validation
- **Request Size Limits**: Configurable payload limits

## Monitoring & Logging

- **Structured Logging**: Winston with development/production formats
- **Health Checks**: Comprehensive service monitoring
- **Performance Metrics**: Response times and cache statistics
- **Error Tracking**: Detailed error logging and reporting

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Integration with Frontend

This backend is designed to work seamlessly with:
- React/Next.js frontends
- The existing Streamlit application
- Mobile applications
- Third-party integrations

## TTS Service Integration

The backend integrates with the existing Piper TTS Flask service:
- Automatic health monitoring
- Intelligent caching of generated audio
- Fallback handling for service outages
- Batch processing capabilities

## Contributing

1. Follow TypeScript and ESLint configurations
2. Add comprehensive tests for new features
3. Update API documentation for new endpoints
4. Ensure proper error handling and logging

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the API documentation at `/api-docs`
- Review logs for detailed error information
- Ensure all required services are running
- Verify environment configuration