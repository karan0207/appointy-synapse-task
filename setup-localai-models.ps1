# PowerShell script to download LocalAI models for Project Synapse

Write-Host "🤖 Setting up LocalAI models...`n" -ForegroundColor Cyan

# Download embedding model
Write-Host "📥 Downloading embedding model (nomic-embed-text-v1.5)..." -ForegroundColor Yellow
docker exec synapse-localai bash -c "cd /models && curl -L https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf -o nomic-embed-text.gguf && echo '✅ Embedding model downloaded'"

Write-Host "`n📥 Downloading text generation model (optional, for summaries)..." -ForegroundColor Yellow
Write-Host "This is optional - embeddings will work without it.`n" -ForegroundColor Gray
$response = Read-Host "Download text model? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    docker exec synapse-localai bash -c "cd /models && curl -L https://gpt4all.io/models/gguf/mistral-7b-instruct-v0.1.Q4_0.gguf -o mistral.gguf && echo '✅ Text model downloaded'"
}

Write-Host "`n🔄 Restarting LocalAI to load models..." -ForegroundColor Yellow
docker-compose restart localai

Write-Host "`n✅ Done! Wait ~30 seconds for LocalAI to start, then test:" -ForegroundColor Green
Write-Host "   curl http://localhost:8080/v1/models`n" -ForegroundColor Gray

