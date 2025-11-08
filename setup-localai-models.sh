#!/bin/bash
# Script to download LocalAI models for Project Synapse

echo "🤖 Setting up LocalAI models..."
echo ""

# Enter LocalAI container
echo "📥 Downloading embedding model (nomic-embed-text-v1.5)..."
docker exec -it synapse-localai bash -c "
  cd /models && \
  curl -L https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf -o nomic-embed-text.gguf && \
  echo '✅ Embedding model downloaded'
"

echo ""
echo "📥 Downloading text generation model (optional, for summaries)..."
echo "This is optional - embeddings will work without it."
echo ""
read -p "Download text model? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  docker exec -it synapse-localai bash -c "
    cd /models && \
    curl -L https://gpt4all.io/models/gguf/mistral-7b-instruct-v0.1.Q4_0.gguf -o mistral.gguf && \
    echo '✅ Text model downloaded'
  "
fi

echo ""
echo "🔄 Restarting LocalAI to load models..."
docker-compose restart localai

echo ""
echo "✅ Done! Wait ~30 seconds for LocalAI to start, then test:"
echo "   curl http://localhost:8080/v1/models"
echo ""

