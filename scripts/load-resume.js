const { ChromaClient } = require('chromadb');
const { Ollama } = require('ollama');
const fs = require('fs').promises;
const path = require('path');

// Resume content - replace with your actual resume
const resumeContent = `
# Professional Summary
Senior AI/ML Engineer and Full-Stack Developer with extensive experience in building intelligent systems, multi-agent frameworks, and enterprise applications. Creator of IntelliSwarm.ai - a comprehensive ecosystem of 9 open-source AI projects.

# Core Expertise
- Multi-agent AI systems and orchestration
- Computer vision and real-time object detection
- Natural language processing and phishing detection
- Enterprise security and compliance automation
- Local LLM deployment and privacy-focused AI solutions

# Technical Skills

## AI/ML Frameworks
- LangChain: Advanced LLM orchestration for multi-agent systems
- PyTorch: Deep learning for computer vision applications
- Scikit-learn: Machine learning algorithms for classification and detection
- Transformers: DistilBERT for NLP and phishing detection
- YOLOv8: Real-time object detection and computer vision
- Ollama: Local LLM inference for privacy-focused applications

## Backend Technologies
- FastAPI: High-performance async web frameworks
- Spring AI: Java-based AI orchestration and multi-agent frameworks
- Quarkus: Cloud-native Java applications with fast startup
- Flask: Lightweight Python web applications and APIs

## Databases & Storage
- PostgreSQL: Enterprise-grade relational database systems
- Redis: In-memory caching and session management
- ChromaDB: Vector database for semantic search and RAG
- Vector databases: Similarity search and knowledge retrieval

## DevOps & Infrastructure
- Docker: Containerization and deployment
- Kubernetes: Container orchestration (when applicable)
- Prometheus: Monitoring and metrics collection
- OpenTelemetry: Distributed tracing and observability

# IntelliSwarm.ai Projects

## inbox-sentinel
**Technology**: Python, scikit-learn, FastAPI, LangChain
**Description**: Local-first phishing detection system using orchestrated ML models
**Key Features**:
- Multiple ML algorithms: SVM, Random Forest, Neural Networks, Naive Bayes
- Optional LLM integration through LangChain for enhanced detection
- FastAPI backend with automatic documentation
- Privacy-focused local processing
- Docker deployment support

## hire-compass
**Technology**: Python, LangChain, ChromaDB, PostgreSQL, FastAPI
**Description**: AI-powered resume-to-vacancy matcher for enterprise HR (300-role scale)
**Key Features**:
- Multi-agent system with specialized agents for resume parsing and job matching
- Vector similarity search using ChromaDB and HNSW indexing
- Clean Architecture with Domain-Driven Design
- Event Sourcing and CQRS patterns
- Comprehensive monitoring with Prometheus and Grafana

## swift-kyc
**Technology**: Python, LangChain, Ollama, Streamlit
**Description**: Multi-agent KYC verification system for automated compliance
**Key Features**:
- 6 specialized AI agents for comprehensive KYC screening
- 100% local LLM processing with Ollama for confidentiality
- Swiss banking standards compliance
- PEP screening and sanctions checking
- Adverse media analysis and risk scoring

## swarm-ai
**Technology**: Java 21+, Spring AI, Maven
**Description**: Java multi-agent orchestration framework with enterprise features
**Key Features**:
- Adapts CrewAI concepts to Java ecosystem
- Support for multiple LLM providers (OpenAI, Anthropic, Ollama)
- Enterprise-grade observability and metrics
- Memory management and tool integration
- CompletableFuture for asynchronous execution

## intelli-vision
**Technology**: Python, PyTorch, YOLOv8, OpenCV, Detectron2
**Description**: Real-time object detection system with multiple backend support
**Key Features**:
- Multi-backend support: YOLOv8, Detectron2 models
- Professional architecture with modular design
- Cross-platform compatibility (Windows, Linux, WSL, Docker)
- Configurable detection confidence and performance metrics
- Support for CPU and GPU processing

## mail-pilot
**Technology**: Python, Ollama, Gmail API, scikit-learn, NLTK
**Description**: AI-powered email management with voice summarization
**Key Features**:
- Local LLM processing with Ollama (Mistral recommended)
- Advanced NLP-based email clustering using TF-IDF and K-means
- Gmail API integration with OAuth2 authentication
- Text-to-speech capabilities for voice summaries
- Privacy-focused local processing

## swarm-trade
**Technology**: Python, AI/LLM Integration, Multi-platform support
**Description**: Multi-agent AI trading analysis system
**Key Features**:
- Natural language processing for trading questions
- Technical chart analysis and pattern recognition
- Market sentiment tracking and analysis
- Support for multiple trading platforms (MT4/5, TradingView, etc.)
- Risk assessment and trading insights

## phish-llm-trainer
**Technology**: Python, DistilBERT, Transformers, PyTorch, scikit-learn
**Description**: Advanced phishing email detection using transformer models
**Key Features**:
- DistilBERT-based binary classification
- 82,486 email sample dataset (balanced)
- Transfer learning with hyperparameter optimization
- Comprehensive evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Flask web interface with REST API

## vuln-patcher
**Technology**: Java, Quarkus, LangChain4j, Ollama, Maven
**Description**: Automated vulnerability detection and patching system
**Key Features**:
- Multi-agent AI-powered vulnerability scanning
- Integration with CVE, GHSA, and OSV databases
- Automated pull request generation for fixes
- Support for multiple programming languages
- Enterprise monitoring with Prometheus and OpenTelemetry

# Professional Philosophy
I believe in building AI systems that prioritize privacy, local processing, and practical business value. My work focuses on creating intelligent multi-agent architectures that can operate autonomously while maintaining transparency and user control.

# Architecture Approach
- Clean Architecture principles with Domain-Driven Design
- Event Sourcing and CQRS patterns for complex systems
- Microservices architecture with proper observability
- Privacy-first design with local LLM processing where possible
- Enterprise-grade security and compliance considerations

# Current Focus
Developing the IntelliSwarm.ai ecosystem to provide comprehensive AI solutions for enterprise automation, security, and workflow optimization. Emphasis on creating reusable, well-documented, and production-ready AI components.
`;

async function loadResumeData() {
  console.log('🔄 Starting resume data loading process...');
  
  try {
    // Initialize ChromaDB client
    const chroma = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000'
    });
    
    // Create or get collection
    console.log('📊 Initializing ChromaDB collection...');
    const collection = await chroma.getOrCreateCollection({
      name: 'resume_knowledge',
      metadata: { 'hnsw:space': 'cosine' }
    });

    // Clear existing data
    try {
      await collection.delete();
      console.log('🗑️ Cleared existing collection data');
    } catch (error) {
      console.log('ℹ️ No existing data to clear');
    }

    // Split resume into chunks
    console.log('✂️ Splitting resume into chunks...');
    const chunks = splitIntoChunks(resumeContent, 1000, 100);
    
    // Prepare documents for ChromaDB
    const documents = chunks.map((chunk, index) => ({
      id: `resume_chunk_${index}`,
      document: chunk,
      metadata: { 
        source: 'resume',
        chunk_index: index,
        timestamp: new Date().toISOString()
      }
    }));

    // Add documents to collection
    console.log(`📝 Adding ${documents.length} chunks to ChromaDB...`);
    await collection.add({
      ids: documents.map(d => d.id),
      documents: documents.map(d => d.document),
      metadatas: documents.map(d => d.metadata)
    });

    // Verify data was loaded
    const count = await collection.count();
    console.log(`✅ Successfully loaded ${count} chunks into ChromaDB`);

    // Test query
    console.log('🔍 Testing query functionality...');
    const testQuery = await collection.query({
      queryTexts: ['What are your technical skills?'],
      nResults: 3
    });
    
    console.log(`🎯 Query test successful - found ${testQuery.documents[0].length} relevant chunks`);
    console.log('🚀 Resume data loading completed successfully!');

  } catch (error) {
    console.error('❌ Failed to load resume data:', error);
    process.exit(1);
  }
}

function splitIntoChunks(text, chunkSize = 1000, overlap = 100) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentSize = 0;
  
  for (const sentence of sentences) {
    const sentenceSize = sentence.length;
    
    if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Handle overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 10));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      currentSize = currentChunk.length;
    } else {
      currentChunk += sentence + '. ';
      currentSize += sentenceSize;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Run the loader
if (require.main === module) {
  loadResumeData().catch(console.error);
}

module.exports = { loadResumeData };