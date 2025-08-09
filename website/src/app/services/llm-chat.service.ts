import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LlmChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private resumeContext = `
    ## Professional Summary
    Senior AI/ML Engineer and Full-Stack Developer with extensive experience in building intelligent systems, multi-agent frameworks, and enterprise applications. Creator of IntelliSwarm.ai - a collection of open-source AI projects including phishing detection, resume matching, KYC verification, and automated vulnerability patching systems.

    ## Key Projects & Technologies

    ### IntelliSwarm.ai Projects:

    **inbox-sentinel** - ML-based Phishing Detection System
    - **GitHub**: https://github.com/intelliswarm-ai/inbox-sentinel
    - **Tech Stack**: Python, scikit-learn, FastAPI, LangChain, Docker
    - **Features**: Multi-algorithm detection (SVM, Random Forest, Neural Networks), local LLM integration, REST API, real-time scanning, configurable thresholds
    - **Use Cases**: Enterprise email security, phishing awareness training, compliance monitoring
    - **Architecture**: Microservices with ML pipeline, Redis caching, PostgreSQL logging

    **hire-compass** - AI-Powered Resume-to-Vacancy Matcher
    - **GitHub**: https://github.com/intelliswarm-ai/hire-compass
    - **Tech Stack**: Python, LangChain, ChromaDB, PostgreSQL, FastAPI
    - **Features**: Process up to 300 roles at scale, semantic similarity matching, salary research, resume parsing, multi-language support
    - **Use Cases**: HR automation, recruitment agencies, enterprise hiring, talent acquisition
    - **Architecture**: Multi-agent system with specialized agents for parsing, matching, and research

    **swift-kyc** - Multi-Agent KYC Verification System
    - **GitHub**: https://github.com/intelliswarm-ai/swift-kyc
    - **Tech Stack**: Python, LangChain, Ollama, FastAPI, PostgreSQL
    - **Features**: 6 specialized AI agents, 100% local LLM processing, PEP screening, sanctions checking, adverse media analysis
    - **Use Cases**: Banking compliance, financial services, regulatory reporting, Swiss banking standards
    - **Architecture**: Agent-based workflow with memory persistence and audit trails

    **swarm-ai** - Java Multi-Agent Orchestration Framework
    - **GitHub**: https://github.com/intelliswarm-ai/swarm-ai
    - **Tech Stack**: Java 21+, Spring AI, Spring Boot, Maven, Docker
           - **Features**: CrewAI concepts in Java, multiple LLM providers (Anthropic, Ollama), enterprise observability, memory management
    - **Use Cases**: Enterprise AI applications, Java-based multi-agent systems, microservices orchestration
    - **Architecture**: Spring-based framework with telemetry, monitoring, and extensible agent system

    **intelli-vision** - Real-Time Object Detection System
    - **GitHub**: https://github.com/intelliswarm-ai/intelli-vision
    - **Tech Stack**: Python, PyTorch, YOLOv8, OpenCV, FastAPI
    - **Features**: Multiple model backends (YOLOv8, Detectron2), real-time processing, configurable confidence levels, cross-platform support
    - **Use Cases**: Security monitoring, retail analytics, manufacturing quality control, autonomous systems
    - **Architecture**: Modular design with pluggable backends and REST API interface

    **vuln-patcher** - Automated Vulnerability Detection & Patching
    - **GitHub**: https://github.com/intelliswarm-ai/vuln-patcher
    - **Tech Stack**: Java, Quarkus, LangChain4j, PostgreSQL, Docker
    - **Features**: Automated vulnerability scanning, intelligent patch generation, compliance reporting, integration with security tools
    - **Use Cases**: DevOps security, compliance automation, enterprise security management, CI/CD security
    - **Architecture**: Quarkus-based microservice with AI-powered analysis and automated remediation

    **mail-pilot** - AI-Powered Email Management
    - **GitHub**: https://github.com/intelliswarm-ai/mail-pilot
    - **Tech Stack**: Python, Gmail API, NLTK, FastAPI, PostgreSQL
    - **Features**: Email summarization, intelligent categorization, priority scoring, automated responses
    - **Use Cases**: Email productivity, customer support automation, executive assistance, team collaboration
    - **Architecture**: API-first design with Gmail integration and AI processing pipeline

    **swarm-trade** - Multi-Agent Trading Analysis System
    - **GitHub**: https://github.com/intelliswarm-ai/swarm-trade
    - **Tech Stack**: Python, LangChain, pandas, NumPy, FastAPI
    - **Features**: Multi-agent market analysis, sentiment analysis, technical indicators, risk assessment
    - **Use Cases**: Algorithmic trading, market research, investment analysis, portfolio management
    - **Architecture**: Agent-based system with specialized trading and analysis agents

    **phish-llm-trainer** - DistilBERT Phishing Detection
    - **GitHub**: https://github.com/intelliswarm-ai/phish-llm-trainer
    - **Tech Stack**: Python, Transformers, PyTorch, scikit-learn, FastAPI
    - **Features**: Fine-tuned DistilBERT model, high accuracy detection, real-time classification, model serving
    - **Use Cases**: Email security, phishing prevention, security training, compliance monitoring
    - **Architecture**: ML pipeline with model training, validation, and serving capabilities

    ## Core Technical Skills
    - **AI/ML**: LangChain, PyTorch, Scikit-learn, Transformers, Ollama, YOLOv8, DistilBERT
    - **Backend**: FastAPI, Spring AI, Quarkus, Flask, Node.js
    - **Databases**: PostgreSQL, Redis, ChromaDB, Vector databases
    - **DevOps**: Docker, Kubernetes, Prometheus, OpenTelemetry
    - **Languages**: Python, Java, TypeScript, JavaScript

    ## Specializations
    - Multi-agent AI systems and orchestration
    - Computer vision and object detection
    - Natural language processing and phishing detection
    - Enterprise security and compliance automation
    - Local LLM deployment and privacy-focused AI solutions

    Please provide detailed information about these projects when asked, including GitHub links, features, tech stacks, and use cases.
  `;

  constructor() {
    // Add initial welcome message
    this.addMessage({
      id: this.generateId(),
      content: "Hello! I'm an AI assistant that can answer questions about my professional background and the IntelliSwarm.ai projects. Feel free to ask about my experience, technical skills, or any of the open-source projects I've built!",
      role: 'assistant',
      timestamp: new Date()
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  async sendMessage(userMessage: string): Promise<ChatResponse> {
    if (!userMessage.trim()) {
      return { success: false, message: '', error: 'Message cannot be empty' };
    }

    // Add user message
    this.addMessage({
      id: this.generateId(),
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    });

    try {
      // Use RAG backend for enhanced responses
      const response = await this.callRAGBackend(userMessage);
      
      // Add assistant response
      this.addMessage({
        id: this.generateId(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      });

      return { success: true, message: response };
    } catch (error) {
      const errorMessage = 'Sorry, I encountered an error processing your message. Please try again.';
      
      this.addMessage({
        id: this.generateId(),
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date()
      });

      return { 
        success: false, 
        message: errorMessage, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async processMessage(userMessage: string): Promise<string> {
    // This is a simplified rule-based response system
    // In production, replace this with actual LLM API calls
    
    const lowerMessage = userMessage.toLowerCase();

    // Technical skills questions
    if (lowerMessage.includes('skill') || lowerMessage.includes('technology') || lowerMessage.includes('tech stack')) {
      return "I have extensive experience with AI/ML technologies including LangChain, PyTorch, and Scikit-learn. My backend expertise spans FastAPI, Spring AI, and Quarkus. I work with databases like PostgreSQL, Redis, and ChromaDB for vector operations. I'm also proficient in DevOps tools like Docker, Kubernetes, and Prometheus for enterprise deployments.";
    }

    // Project-specific questions
    if (lowerMessage.includes('inbox-sentinel') || lowerMessage.includes('phishing')) {
      return `**inbox-sentinel** is my comprehensive ML-based phishing detection system! 🚀

**GitHub**: https://github.com/intelliswarm-ai/inbox-sentinel

**What it does**: Detects phishing emails using multiple machine learning algorithms with high accuracy and real-time processing.

**Tech Stack**: Python, scikit-learn, FastAPI, LangChain, Docker, Redis, PostgreSQL

**Key Features**:
• Multi-algorithm detection (SVM, Random Forest, Neural Networks)
• Local LLM integration through LangChain for enhanced analysis
• REST API for easy integration with existing systems
• Real-time email scanning with configurable confidence thresholds
• Redis caching for performance optimization
• PostgreSQL logging for audit trails and compliance

**Use Cases**: Enterprise email security, phishing awareness training, compliance monitoring, security operations centers

**Architecture**: Microservices design with ML pipeline, separate scanning and analysis services, Redis caching layer, and PostgreSQL for persistent logging.

**Why it's special**: Combines traditional ML with modern LLM capabilities while maintaining privacy through local processing options.`;
    }

    if (lowerMessage.includes('hire-compass') || lowerMessage.includes('resume')) {
      return `**hire-compass** is my AI-powered resume-to-vacancy matching system that revolutionizes recruitment! 💼

**GitHub**: https://github.com/intelliswarm-ai/hire-compass

**What it does**: Automatically matches resumes to job vacancies using semantic similarity and AI-powered analysis, processing up to 300 roles at scale.

**Tech Stack**: Python, LangChain, ChromaDB, PostgreSQL, FastAPI, Docker

**Key Features**:
• Process up to 300 roles simultaneously with high accuracy
• Semantic similarity matching using vector embeddings
• Intelligent salary research and market analysis
• Advanced resume parsing with multi-language support
• Multi-agent architecture for specialized tasks
• REST API for easy integration

**Use Cases**: HR automation, recruitment agencies, enterprise hiring, talent acquisition, job board platforms

**Architecture**: Multi-agent system with specialized agents for resume parsing, job matching, salary research, and market analysis. Uses ChromaDB for vector similarity search and PostgreSQL for data persistence.

**Why it's special**: Combines the power of LangChain with vector databases to provide intelligent, scalable recruitment solutions that save hours of manual work.`;
    }

    if (lowerMessage.includes('swift-kyc') || lowerMessage.includes('kyc')) {
      return `**swift-kyc** is my enterprise-grade multi-agent KYC verification system! 🏦

**GitHub**: https://github.com/intelliswarm-ai/swift-kyc

**What it does**: Comprehensive KYC verification using 6 specialized AI agents with 100% local LLM processing for complete privacy and compliance.

**Tech Stack**: Python, LangChain, Ollama, FastAPI, PostgreSQL, Docker

**Key Features**:
• 6 specialized AI agents for different verification tasks
• 100% local LLM processing through Ollama
• PEP (Politically Exposed Person) screening
• Sanctions checking against global databases
• Adverse media analysis and risk assessment
• Compliance reporting to Swiss banking standards
• Complete audit trails and memory persistence

**Use Cases**: Banking compliance, financial services, regulatory reporting, Swiss banking standards, fintech applications

**Architecture**: Agent-based workflow system with memory persistence, audit trails, and configurable compliance rules. Each agent specializes in a specific verification task.

**Why it's special**: Provides enterprise-grade KYC capabilities while maintaining complete privacy through local LLM processing - perfect for financial institutions with strict compliance requirements.`;
    }

    if (lowerMessage.includes('swarm-ai') || lowerMessage.includes('java') || lowerMessage.includes('spring')) {
      return `**swarm-ai** is my Java-based multi-agent orchestration framework! ☕

**GitHub**: https://github.com/intelliswarm-ai/swarm-ai

**What it does**: Brings CrewAI concepts to the Java ecosystem with enterprise-grade multi-agent orchestration, observability, and extensibility.

**Tech Stack**: Java 21+, Spring AI, Spring Boot, Maven, Docker, Prometheus, OpenTelemetry

**Key Features**:
• CrewAI concepts adapted for Java ecosystem
       • Multiple LLM providers (Anthropic, Ollama)
• Enterprise-grade observability and monitoring
• Advanced memory management and persistence
• Extensible agent system with plugin architecture
• Spring Boot integration for enterprise deployment
• Comprehensive telemetry and metrics

**Use Cases**: Enterprise AI applications, Java-based multi-agent systems, microservices orchestration, business process automation

**Architecture**: Spring-based framework with built-in telemetry, monitoring, and extensible agent system. Supports multiple deployment models and integration patterns.

**Why it's special**: Brings the power of multi-agent AI to the Java ecosystem with enterprise-grade features that Java developers expect - perfect for organizations with existing Java infrastructure.`;
    }

    if (lowerMessage.includes('intelli-vision') || lowerMessage.includes('computer vision') || lowerMessage.includes('object detection')) {
      return `**intelli-vision** is my real-time object detection system for production environments! 👁️

**GitHub**: https://github.com/intelliswarm-ai/intelli-vision

**What it does**: High-performance object detection using state-of-the-art models with real-time processing and multiple backend support.

**Tech Stack**: Python, PyTorch, YOLOv8, OpenCV, FastAPI, Docker

**Key Features**:
• Multiple model backends (YOLOv8, Detectron2)
• Real-time processing with configurable FPS
• Configurable confidence levels and thresholds
• Cross-platform support (Windows, Linux, Docker)
• REST API for easy integration
• Professional architecture for production use
• Support for advanced models like Faster R-CNN and Mask R-CNN

**Use Cases**: Security monitoring, retail analytics, manufacturing quality control, autonomous systems, surveillance applications

**Architecture**: Modular design with pluggable backends, REST API interface, and configurable processing pipelines. Supports both CPU and GPU acceleration.

**Why it's special**: Combines the latest computer vision models with production-ready architecture, making it easy to deploy advanced object detection in real-world applications.`;
    }

    if (lowerMessage.includes('vuln-patcher') || lowerMessage.includes('vulnerability')) {
      return `**vuln-patcher** is my automated vulnerability detection and patching system! 🛡️

**GitHub**: https://github.com/intelliswarm-ai/vuln-patcher

**What it does**: Automatically detects security vulnerabilities and generates intelligent patches using AI-powered analysis and automated remediation.

**Tech Stack**: Java, Quarkus, LangChain4j, PostgreSQL, Docker, Prometheus

**Key Features**:
• Automated vulnerability scanning and assessment
• AI-powered patch generation and validation
• Compliance reporting and audit trails
• Integration with security tools and CI/CD pipelines
• Real-time monitoring and alerting
• Enterprise-grade security and compliance

**Use Cases**: DevOps security, compliance automation, enterprise security management, CI/CD security, vulnerability management

**Architecture**: Quarkus-based microservice with AI-powered analysis, automated remediation workflows, and comprehensive monitoring. Integrates with existing security infrastructure.

**Why it's special**: Combines the performance of Quarkus with AI-powered security analysis, providing automated vulnerability management that fits seamlessly into modern DevOps workflows.`;
    }

    if (lowerMessage.includes('mail-pilot') || lowerMessage.includes('email')) {
      return `**mail-pilot** is my AI-powered email management system! 📧

**GitHub**: https://github.com/intelliswarm-ai/mail-pilot

**What it does**: Intelligent email management with AI summarization, categorization, priority scoring, and automated responses.

**Tech Stack**: Python, Gmail API, NLTK, FastAPI, PostgreSQL, Docker

**Key Features**:
• AI-powered email summarization and analysis
• Intelligent categorization and tagging
• Priority scoring and urgency detection
• Automated response generation
• Gmail API integration
• Multi-account support
• Customizable workflows

**Use Cases**: Email productivity, customer support automation, executive assistance, team collaboration, email marketing

**Architecture**: API-first design with Gmail integration, AI processing pipeline, and PostgreSQL for data persistence. Supports webhook-based real-time processing.

**Why it's special**: Transforms email from a time sink into a productivity tool using AI to automatically handle routine tasks and highlight important messages.`;
    }

    if (lowerMessage.includes('swarm-trade') || lowerMessage.includes('trading')) {
      return `**swarm-trade** is my multi-agent trading analysis system! 📈

**GitHub**: https://github.com/intelliswarm-ai/swarm-trade

**What it does**: Comprehensive market analysis using multiple AI agents for technical analysis, sentiment analysis, and risk assessment.

**Tech Stack**: Python, LangChain, pandas, NumPy, FastAPI, Docker

**Key Features**:
• Multi-agent market analysis and research
• Sentiment analysis of news and social media
• Technical indicators and pattern recognition
• Risk assessment and portfolio analysis
• Real-time market data integration
• Customizable trading strategies

**Use Cases**: Algorithmic trading, market research, investment analysis, portfolio management, trading education

**Architecture**: Agent-based system with specialized trading and analysis agents, real-time data processing, and configurable analysis pipelines.

**Why it's special**: Combines multiple AI agents to provide comprehensive market analysis that goes beyond simple technical indicators, offering insights from multiple perspectives.`;
    }

    if (lowerMessage.includes('phish-llm-trainer') || lowerMessage.includes('distilbert')) {
      return `**phish-llm-trainer** is my fine-tuned DistilBERT phishing detection model! 🎯

**GitHub**: https://github.com/intelliswarm-ai/phish-llm-trainer

**What it does**: High-accuracy phishing email detection using a fine-tuned DistilBERT model with real-time classification and model serving.

**Tech Stack**: Python, Transformers, PyTorch, scikit-learn, FastAPI, Docker

**Key Features**:
• Fine-tuned DistilBERT model for phishing detection
• High accuracy classification (>95% in testing)
• Real-time email classification
• Model serving with REST API
• Training pipeline and validation tools
• Easy integration with existing systems

**Use Cases**: Email security, phishing prevention, security training, compliance monitoring, email filtering

**Architecture**: ML pipeline with model training, validation, and serving capabilities. Includes data preprocessing, model fine-tuning, and production deployment tools.

**Why it's special**: Provides enterprise-grade phishing detection using state-of-the-art transformer models, with easy deployment and integration capabilities.`;
    }

    // General experience questions
    if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      return "I'm a Senior AI/ML Engineer with expertise in building intelligent multi-agent systems and enterprise applications. I've created the IntelliSwarm.ai ecosystem - 9 open-source projects covering phishing detection, resume matching, KYC verification, vulnerability patching, and more. My focus is on privacy-first AI solutions using local LLMs like Ollama.";
    }

    if (lowerMessage.includes('project') || lowerMessage.includes('work')) {
      return "My main focus is the IntelliSwarm.ai project ecosystem, which includes 9 different AI-powered applications. These range from security tools like inbox-sentinel for phishing detection, to enterprise solutions like hire-compass for HR automation, to development tools like vuln-patcher for automated vulnerability management. Each project emphasizes practical AI applications with enterprise-grade architecture.";
    }

    // GitHub projects overview
    if (lowerMessage.includes('github') || lowerMessage.includes('open source') || lowerMessage.includes('repository')) {
      return `I'm excited to share my **IntelliSwarm.ai** open-source ecosystem! 🚀

I've built **9 comprehensive AI projects** that showcase different aspects of modern AI/ML development. Here's the complete overview:

**🔒 Security & Compliance Projects:**
• **inbox-sentinel** - ML-based phishing detection with local LLM integration
• **swift-kyc** - Multi-agent KYC verification system (100% local processing)
• **vuln-patcher** - Automated vulnerability detection and patching
• **phish-llm-trainer** - Fine-tuned DistilBERT for phishing detection

**💼 Enterprise & Productivity:**
• **hire-compass** - AI-powered resume-to-vacancy matching (300+ roles)
• **mail-pilot** - Intelligent email management with AI summarization
• **swarm-ai** - Java multi-agent orchestration framework

**🤖 AI & Computer Vision:**
• **intelli-vision** - Real-time object detection with YOLOv8/Detectron2
• **swarm-trade** - Multi-agent trading analysis system

**Key Features Across All Projects:**
• **Enterprise-grade architecture** with Docker deployment
• **REST APIs** for easy integration
• **Comprehensive documentation** and examples
• **Production-ready** with monitoring and observability
• **Privacy-focused** with local LLM options
• **Modern tech stacks** (Python, Java, FastAPI, Spring AI)

**GitHub Organization**: https://github.com/intelliswarm-ai

Each project is designed to solve real-world problems while demonstrating best practices in AI/ML development. You can ask me about any specific project for detailed information about features, tech stack, use cases, and architecture!

What project interests you most?`;
    }

    // Default response
    return "I'd be happy to discuss my technical background and the IntelliSwarm.ai projects! You can ask me about my experience with AI/ML frameworks like LangChain and PyTorch, specific projects like inbox-sentinel or hire-compass, or my expertise in areas like computer vision, NLP, or multi-agent systems. What would you like to know more about?";
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  // Method to integrate with RAG backend
  private async callRAGBackend(message: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: this.messagesSubject.value.slice(-10) // Last 10 messages for context
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.message || 'Sorry, I couldn\'t generate a response.';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }
    } catch (error) {
      console.error('RAG Backend API call failed:', error);
      // Fallback to rule-based responses
      return this.processMessage(message);
    }
  }
}