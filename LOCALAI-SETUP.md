# 🤖 LocalAI Setup Guide

## What is LocalAI?

LocalAI is a free, open-source, local alternative to OpenAI that runs in Docker. It provides:
- ✅ Text generation (summaries, classification)
- ✅ Embeddings (for semantic search)
- ✅ OpenAI-compatible API
- ✅ Completely free and private
- ✅ No API keys or credits needed

## Quick Start

### 1. LocalAI is Already Configured!

The `docker-compose.yml` includes LocalAI. Just start it:

```bash
docker-compose up -d
```

LocalAI will be available at: `http://localhost:8080`

### 2. Environment Variables

Your `.env` files should already have LocalAI configured:

**server/.env:**
```bash
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:8080/v1
```

**worker/.env:**
```bash
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:8080/v1
```

### 3. Download Models (First Time Only)

LocalAI will auto-download models on first use. Or manually:

```bash
# Enter LocalAI container
docker exec -it synapse-localai bash

# Download recommended models
curl -O https://gpt4all.io/models/gguf/mistral-7b-instruct-v0.1.Q4_0.gguf -o /models/mistral.gguf
curl -O https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf -o /models/nomic-embed.gguf
```

### 4. Test It Works

```bash
# Test text generation
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Test embeddings
curl http://localhost:8080/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nomic-embed",
    "input": "Hello world"
  }'
```

## Recommended Models

### For Text (Summaries & Classification)

| Model | Size | Speed | Quality | Recommended |
|-------|------|-------|---------|-------------|
| **Mistral 7B** | 4GB | Medium | Good | ✅ Best balance |
| Phi-3 Mini | 2GB | Fast | OK | Small hardware |
| Llama 3.1 8B | 5GB | Slow | Great | Best quality |

### For Embeddings (Search)

| Model | Size | Speed | Recommended |
|-------|------|-------|-------------|
| **nomic-embed-text** | 500MB | Fast | ✅ Best |
| all-MiniLM-L6 | 100MB | Very Fast | Good enough |

## Configuration

### Model Configuration Files

Create `localai_models/mistral.yaml`:

```yaml
name: mistral
backend: llama
parameters:
  model: mistral.gguf
  temperature: 0.7
  top_k: 40
  top_p: 0.95
context_size: 2048
```

Create `localai_models/nomic-embed.yaml`:

```yaml
name: nomic-embed
backend: bert-embeddings
parameters:
  model: nomic-embed.gguf
embeddings: true
```

### Performance Tuning

**In `docker-compose.yml`:**

```yaml
localai:
  environment:
    - THREADS=8          # Use more CPU cores
    - CONTEXT_SIZE=4096  # Larger context for better summaries
    - DEBUG=true         # See what's happening
```

**With GPU (NVIDIA):**

```yaml
localai:
  image: quay.io/go-skynet/local-ai:latest-gpu
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## Troubleshooting

### LocalAI Not Starting

```bash
# Check logs
docker logs synapse-localai

# Common issue: Not enough memory
# Solution: Use smaller models or add more RAM
```

### Slow Performance

**Options:**
1. Use smaller models (Phi-3 Mini instead of Mistral)
2. Reduce CONTEXT_SIZE in docker-compose.yml
3. Use GPU if available
4. Increase THREADS

### Models Not Found

```bash
# List available models
docker exec synapse-localai ls /models

# Download missing models
docker exec synapse-localai bash -c "cd /models && curl -O <model-url>"
```

### API Errors

```bash
# Check LocalAI is responding
curl http://localhost:8080/readiness

# Check models are loaded
curl http://localhost:8080/v1/models
```

## Switching to OpenAI

If LocalAI is too slow, switch to OpenAI:

**1. Update `.env` files:**
```bash
# Comment out LocalAI
# OPENAI_API_KEY=not-needed
# OPENAI_API_BASE=http://localhost:8080/v1

# Add OpenAI
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_API_BASE=https://api.openai.com/v1
```

**2. Restart services:**
```bash
# No code changes needed! Just restart:
# Ctrl+C in terminal running dev:server
# Ctrl+C in terminal running dev:worker
# Then start them again
```

## Performance Comparison

### LocalAI (Mistral 7B on 8-core CPU, 16GB RAM)
- First item: 8-12 seconds
- Subsequent items: 5-8 seconds each
- Search: 2-3 seconds

### OpenAI (GPT-3.5-turbo)
- First item: 2-3 seconds
- Subsequent items: 1-2 seconds each
- Search: 0.5-1 second

## Cost Comparison

### LocalAI
- **Setup:** Free
- **Usage:** Free (electricity ~$0.01/hour)
- **Limits:** None (your hardware)
- **Privacy:** 100% local

### OpenAI
- **Setup:** Free
- **Usage:** ~$0.01 per 10 items
- **Limits:** API rate limits
- **Privacy:** Data sent to OpenAI

**For personal use:** $5 OpenAI credit lasts months.

## Recommendations

### Use LocalAI if:
- ✅ Privacy is important
- ✅ You have decent hardware (8GB+ RAM)
- ✅ Single user (personal second brain)
- ✅ Don't mind 5-10 second processing

### Use OpenAI if:
- ✅ Need fast responses
- ✅ Multiple users
- ✅ Limited local hardware
- ✅ Want best quality results

## Advanced: Custom Models

You can use any GGUF model with LocalAI:

```bash
# Download from Hugging Face
docker exec synapse-localai bash -c \
  "cd /models && curl -L -O https://huggingface.co/.../model.gguf"

# Create config
echo 'name: my-model
backend: llama
parameters:
  model: model.gguf' > localai_models/my-model.yaml

# Restart LocalAI
docker-compose restart localai
```

## Support

- LocalAI Docs: https://localai.io/
- Model Gallery: https://localai.io/models/
- GitHub Issues: https://github.com/mudler/LocalAI

---

**LocalAI is configured and ready to use! No API keys, no credits, just AI. 🚀**

