#!/bin/bash

echo "🚀 Starting IntelliSwarm.ai with Docker + RAG + LLM"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

echo "📋 Starting services..."

# Start all services (CPU version by default)
docker-compose --profile cpu up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check ChromaDB
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
    echo "✅ ChromaDB is running"
else
    echo "⚠️ ChromaDB not ready yet"
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "⚠️ Ollama not ready yet"
fi

# Check Backend
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend API is running"
else
    echo "⚠️ Backend API not ready yet"
fi

echo ""
echo "🤖 Setting up LLM model..."
echo "Downloading Mistral 7B model (this may take a few minutes)..."
docker-compose exec -T ollama-cpu ollama pull mistral:7b

echo ""
echo "📊 Loading resume data..."
docker-compose --profile data-setup up data-loader

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🌐 Access your application at:"
echo "   Frontend:  http://localhost:4200"
echo "   Chat:      http://localhost:4200/chat"
echo "   API:       http://localhost:3000"
echo ""
echo "💬 Try asking questions like:"
echo "   - 'What are your technical skills?'"
echo "   - 'Tell me about the inbox-sentinel project'"
echo "   - 'How do you approach multi-agent systems?'"
echo ""
echo "🛑 To stop services: docker-compose down"