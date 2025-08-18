# Voice Models

This directory contains voice models for the Piper TTS system used for biblical name pronunciation.

## Lessac High-Quality Model

The `lessac_high` directory should contain the Lessac high-quality English voice model:

- `en_US-lessac-high.onnx` (114MB) - The main voice model file
- `en_US-lessac-high.onnx.json` - Model configuration file

## Download Instructions

Due to GitHub's file size limitations, the main model file (`en_US-lessac-high.onnx`) is not included in the repository.

To download it:

1. Visit the [Piper TTS releases page](https://github.com/rhasspy/piper/releases/tag/v1.2.0)
2. Download `voice-en-us-lessac-high.tar.gz`
3. Extract the contents to `data/pronunciations/voice_models/lessac_high/`

Or use the automated download script:

```bash
cd data/pronunciations/voice_models/lessac_high/
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-en-us-lessac-high.tar.gz
tar -xzf voice-en-us-lessac-high.tar.gz
rm voice-en-us-lessac-high.tar.gz
```

The TTS functionality will automatically detect and use the model when available.