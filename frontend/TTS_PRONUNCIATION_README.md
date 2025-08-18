# Biblical Names Pronunciation System

A comprehensive TTS (Text-to-Speech) pronunciation system for Biblical names integrated with the BibleBridge React frontend.

## 🎯 Overview

This system provides an enhanced Bible reading experience with:

- **Clickable Biblical Names**: Interactive names with pronunciation tooltips
- **TTS Audio Playback**: High-quality speech synthesis using Piper TTS
- **Pronunciation Data**: Phonetic, IPA, and phoneme representations
- **Intelligent Caching**: LRU cache for audio buffers and pronunciation data
- **Web Audio API**: Advanced audio management with volume controls
- **Mobile Support**: Touch-friendly interface with audio constraints handling
- **Debug Tools**: Development panel for testing and monitoring

## 🏗️ Architecture

### Components

1. **BiblicalName Component** (`/src/components/BiblicalName.tsx`)
   - Renders clickable biblical names
   - Shows pronunciation tooltips on hover
   - Handles TTS audio playback
   - Supports keyboard navigation

2. **PronunciationTooltip Component** (`/src/components/PronunciationTooltip.tsx`)
   - Advanced tooltip with multiple pronunciation formats
   - Audio playback controls
   - Confidence indicators
   - Multiple format support (phonetic, IPA, phoneme)

3. **TTSAudioManager Hook** (`/src/hooks/useTTSAudioManager.ts`)
   - Web Audio API integration
   - LRU cache for audio buffers
   - Playback state management
   - Mobile audio support

4. **AudioControls Component** (`/src/components/AudioControls.tsx`)
   - Professional audio controls
   - Volume slider and mute functionality
   - Visual waveform indicators
   - Keyboard shortcuts

5. **PronunciationService** (`/src/services/pronunciationService.ts`)
   - API integration with backend
   - Data caching and management
   - Biblical name detection
   - Preloading functionality

6. **TTSDebugPanel Component** (`/src/components/TTSDebugPanel.tsx`)
   - Development debugging tools
   - Performance monitoring
   - Cache statistics
   - Service health checks

### Services Integration

- **Express Backend**: Proxies TTS requests to Flask server
- **Flask TTS Server**: Piper TTS integration for audio generation
- **Biblical Names Database**: JSON data with pronunciation information
- **Web Audio API**: High-performance audio playback
- **Custom Event System**: Component communication for audio events

## 🚀 Features

### Core Functionality

- **Smart Name Detection**: Automatically identifies biblical names in text
- **Multiple Pronunciation Formats**: 
  - Phonetic (human-readable): "AY-bruh-ham"
  - IPA (International Phonetic Alphabet): "/ˈeɪbrəˌhæm/"
  - Phoneme (TTS-optimized): "aee bruh ham"
- **Audio Caching**: LRU cache with configurable size limits
- **Error Handling**: Graceful fallbacks and user feedback
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### User Experience

- **Hover Tooltips**: Rich pronunciation information on mouseover
- **Click to Play**: One-click audio pronunciation
- **Visual Feedback**: Loading states, playing indicators, error messages
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Theme Integration**: Supports light/dark mode

### Performance

- **Lazy Loading**: Pronunciations loaded on-demand
- **Preloading**: Common names preloaded for instant playback
- **Cache Management**: Automatic cleanup of expired entries
- **Service Health**: Monitoring and error recovery
- **Bundle Optimization**: Tree-shaking and code splitting

## 📋 Configuration

### TTS Configuration (`/src/types/index.ts`)

```typescript
export const TTS_CONFIG = {
  CACHE_MAX_SIZE: 50,           // Maximum cached audio files
  CACHE_MAX_AGE: 3600000,       // 1 hour cache expiration
  DEFAULT_VOLUME: 0.8,          // Default audio volume
  DEFAULT_SPEED: 0.8,           // Default speech speed
  SUPPORTED_FORMATS: ['phonetic', 'ipa', 'phoneme'],
  AUDIO_FORMAT: {
    type: 'WAV',
    sampleRate: 22050,
    channels: 1,
    bitDepth: 16,
  },
};
```

### User Settings Integration

The system respects user preferences:

- `ttsEnabled`: Global TTS on/off toggle
- `pronunciationStyle`: Preferred format (phonetic/IPA)
- `showPronunciations`: Display pronunciation hints
- Theme and accessibility settings

## 🔧 API Integration

### Backend Endpoints

- `GET /api/pronunciation` - Get all pronunciation data
- `GET /api/pronunciation/:name` - Get specific name pronunciation
- `POST /api/tts/generate` - Generate TTS audio
- `GET /api/tts/audio/:name` - Get cached audio
- `POST /api/tts/batch` - Batch audio generation
- `GET /api/tts/health` - Service health check

### Data Format

```json
{
  "Abraham": {
    "phonetic": "AY-bruh-ham",
    "ipa": "/ˈeɪbrəˌhæm/",
    "phoneme": "aee bruh ham",
    "source": "biblical_names_database"
  }
}
```

## 🎮 Usage Examples

### Basic Implementation

```typescript
import { BiblicalName } from './components/BiblicalName';

<BiblicalName 
  name="Abraham"
  pronunciationStyle="phonetic"
  showTooltip={true}
>
  Abraham
</BiblicalName>
```

### Advanced Audio Management

```typescript
import { useTTSAudioManager } from './hooks/useTTSAudioManager';

const MyComponent = () => {
  const { playAudio, playbackState, volume, setVolume } = useTTSAudioManager();
  
  const handlePlay = async () => {
    const audioData = await fetch('/api/tts/audio/Abraham').then(r => r.arrayBuffer());
    await playAudio('Abraham', audioData);
  };
};
```

### Service Integration

```typescript
import { pronunciationService } from './services/pronunciationService';

// Get pronunciation data
const pronunciation = await pronunciationService.getPronunciation('Moses');

// Play pronunciation
await pronunciationService.playPronunciation('Moses');

// Preload common names
await pronunciationService.preloadNames(['Jesus', 'Mary', 'Peter']);
```

## 🔍 Development Tools

### Debug Panel

The development-only debug panel provides:

- **Service Health**: Backend and TTS server status
- **Performance Metrics**: Cache efficiency, response times, error counts
- **Audio Controls**: Volume, playback controls, visual indicators
- **Test Interface**: Input field for testing any biblical name
- **Pronunciation Browser**: List of available pronunciations
- **Live Logs**: Real-time system events and errors

### Keyboard Shortcuts

- **Space/Enter**: Play/pause pronunciation
- **Escape**: Stop playback
- **Arrow Up/Down**: Volume control
- **M**: Mute toggle

## 📱 Mobile Support

- **Touch Events**: Optimized for touch interactions
- **Audio Context**: Handles mobile audio restrictions
- **Responsive Design**: Adapts to screen sizes
- **Gesture Support**: Touch-friendly controls

## 🔒 Error Handling

### Graceful Degradation

- Service unavailable: Shows static pronunciation text
- Network errors: Cached fallbacks and retry logic
- Audio failures: Visual feedback and alternative options
- Data missing: Intelligent fallbacks to alternative formats

### User Feedback

- Loading indicators during audio generation
- Error messages with actionable suggestions
- Progress feedback for batch operations
- Service status indicators

## ⚡ Performance Optimizations

### Caching Strategy

- **LRU Cache**: Most recently used audio files kept in memory
- **Lazy Loading**: Pronunciations loaded on first request
- **Preloading**: Common biblical names preloaded at startup
- **Cache Cleanup**: Automatic removal of expired entries

### Bundle Optimization

- **Tree Shaking**: Unused code eliminated from production build
- **Code Splitting**: Debug panel excluded from production
- **Asset Optimization**: Compressed audio and optimized images

## 🚀 Getting Started

### Prerequisites

1. **Express Backend** running on port 3001
2. **Piper TTS Flask Server** running on port 5001
3. **Biblical Names Database** loaded (`/data/pronunciations/biblical_names.json`)
4. **Node.js 16+** and npm installed

### Quick Start

```bash
# Start all services
./start_pronunciation_demo.sh

# Or manually:
cd /home/jim/development/bible/frontend
npm install
npm start
```

### Testing

1. Open http://localhost:3000
2. Navigate to any Bible chapter
3. Look for dotted underlines on biblical names
4. Hover to see pronunciation tooltip
5. Click the play button to hear pronunciation
6. Check debug panel (bottom-right) for system status

## 📊 Monitoring

### Health Checks

The system continuously monitors:

- TTS service availability
- Cache performance
- Error rates
- Response times
- Memory usage

### Debug Information

Development panel shows:

- Active cache size and efficiency
- Total requests and error count
- Average response times
- Service health status
- Real-time logs

## 🔮 Future Enhancements

### Planned Features

- **Voice Selection**: Multiple speaker options
- **Speed Controls**: User-adjustable speech rate
- **Batch Preloading**: Smart preloading based on current chapter
- **Offline Support**: Service worker for cached pronunciations
- **User Preferences**: Personal pronunciation favorites
- **Analytics**: Usage statistics and popular names

### Technical Improvements

- **WebRTC**: Real-time audio streaming
- **Compression**: Optimized audio formats
- **CDN Integration**: Global audio content delivery
- **Progressive Enhancement**: Enhanced features for modern browsers

## 📚 Additional Resources

- **Piper TTS Documentation**: https://github.com/rhasspy/piper
- **Web Audio API Guide**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **React Hooks Best Practices**: https://reactjs.org/docs/hooks-rules.html
- **Accessibility Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

## 🤝 Contributing

When contributing to the pronunciation system:

1. Test with multiple biblical names
2. Verify mobile compatibility
3. Check accessibility with screen readers
4. Monitor performance impact
5. Update pronunciation database as needed

## 📄 License

This pronunciation system is part of the BibleBridge application and follows the same license terms.