# 🐳 IntelliSwarm.ai Docker + RAG + LLM Setup

Complete dockerized setup with Angular frontend, RAG-powered backend, Ollama LLM, and ChromaDB vector database.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- 8GB+ RAM (for LLM)
- GPU (optional, for faster inference)

### 1. Start Services (CPU Version)
```bash
# Start all services with CPU-based Ollama
docker-compose --profile cpu up -d

# Check service status
docker-compose ps
```

### 2. Start Services (GPU Version)
```bash
# Start all services with GPU-accelerated Ollama
docker-compose --profile gpu up -d
```

### 3. Initialize Data
```bash
# Download and start Mistral model in Ollama
docker-compose exec ollama-cpu ollama pull mistral:7b

# Load resume data into ChromaDB
docker-compose --profile data-setup up data-loader

# Verify data loading
curl http://localhost:3000/api/collection/info
```

### 4. Access Services
- **Frontend**: http://localhost:4200
- **Chat Page**: http://localhost:4200/chat
- **Backend API**: http://localhost:3000
- **ChromaDB**: http://localhost:8000
- **Ollama**: http://localhost:11434

## 📋 Service Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│  Angular    │───▶│   Backend    │───▶│    Ollama     │
│  Frontend   │    │   (RAG API)  │    │     LLM       │
│   :4200     │    │    :3000     │    │   :11434      │
└─────────────┘    └──────────────┘    └───────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   ChromaDB   │
                   │ Vector Store │
                   │    :8000     │
                   └──────────────┘
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in project root:
```env
# Backend
NODE_ENV=development
OLLAMA_URL=http://ollama:11434
CHROMA_URL=http://chromadb:8000

# Frontend
API_URL=http://localhost:3000

# Ollama
OLLAMA_KEEP_ALIVE=24h
OLLAMA_HOST=0.0.0.0:11434

# ChromaDB
CHROMA_SERVER_HOST=0.0.0.0
CHROMA_SERVER_HTTP_PORT=8000
```

### Custom Resume Data
Replace the resume content in `scripts/load-resume.js` with your actual resume data, then reload:

```bash
# Rebuild and reload data
docker-compose --profile data-setup up --build data-loader
```

## 🤖 Available Models

### Download Models
```bash
# Recommended models (choose one)
docker-compose exec ollama-cpu ollama pull mistral:7b        # 4GB RAM
docker-compose exec ollama-cpu ollama pull llama3:8b        # 6GB RAM  
docker-compose exec ollama-cpu ollama pull codellama:13b    # 8GB RAM

# List available models
docker-compose exec ollama-cpu ollama list
```

## 🔍 API Endpoints

### Chat with RAG
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your technical skills?",
    "conversation_history": []
  }'
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Collection Info
```bash
curl http://localhost:3000/api/collection/info
```

## 🛠️ Development

### Frontend Development
```bash
# Start only backend services
docker-compose up -d backend chromadb ollama-cpu

# Run Angular in development mode
cd website
npm install
ng serve
```

### Backend Development
```bash
# Start only infrastructure
docker-compose up -d chromadb ollama-cpu

# Run backend locally
cd backend
npm install
npm run dev
```

## 📊 Monitoring

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ollama-cpu
```

### Service Health
```bash
# Backend health
curl http://localhost:3000/api/health

# ChromaDB health  
curl http://localhost:8000/api/v1/heartbeat

# Ollama health
curl http://localhost:11434/api/tags
```

## 🔧 Troubleshooting

### Common Issues

1. **Out of Memory**
   - Use smaller model: `mistral:7b` instead of `llama3:8b`
   - Increase Docker memory limit
   - Use CPU profile if GPU memory insufficient

2. **Slow Responses**
   - Check if GPU is being used: `docker-compose --profile gpu`
   - Warm up model: Send a test query after startup
   - Consider using smaller model for development

3. **Connection Errors**
   - Wait for all services to be ready (especially Ollama)
   - Check service logs: `docker-compose logs [service]`
   - Verify network connectivity between containers

### Reset Everything
```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild and restart
docker-compose --profile cpu up --build -d
```

## 🎯 Features

### RAG System
- ✅ Resume data chunking and embedding
- ✅ Semantic search with ChromaDB
- ✅ Context-aware responses
- ✅ Conversation history support

### LLM Integration
- ✅ Local Ollama deployment
- ✅ Multiple model support
- ✅ GPU acceleration (optional)
- ✅ Persistent model storage

### Production Ready
- ✅ Docker containerization
- ✅ Health checks
- ✅ Service orchestration
- ✅ Nginx reverse proxy
- ✅ Volume persistence