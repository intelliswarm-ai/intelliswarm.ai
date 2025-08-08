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
    - **inbox-sentinel**: ML-based phishing detection with scikit-learn, FastAPI, and local LLM integration
    - **hire-compass**: AI-powered resume-to-vacancy matcher using LangChain, ChromaDB, and PostgreSQL
    - **swift-kyc**: Multi-agent KYC verification system with Ollama for privacy-focused processing
    - **mail-pilot**: Email management with AI summarization using Gmail API and NLTK
    - **swarm-trade**: Multi-agent trading analysis system with natural language processing
    - **swarm-ai**: Java Spring AI multi-agent orchestration framework
    - **intelli-vision**: Real-time object detection using PyTorch, YOLOv8, and OpenCV
    - **phish-llm-trainer**: DistilBERT-based phishing email detection with Transformers
    - **vuln-patcher**: Automated vulnerability detection and patching with Quarkus and LangChain4j

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

    Please answer questions about my professional background, projects, and technical expertise based on this information.
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
      return "inbox-sentinel is my ML-based phishing detection system that uses multiple algorithms including SVM, Random Forest, and Neural Networks. It's built with scikit-learn and FastAPI, with optional LLM integration through LangChain. The system emphasizes local processing for privacy and can be deployed with Docker.";
    }

    if (lowerMessage.includes('hire-compass') || lowerMessage.includes('resume')) {
      return "hire-compass is an AI-powered resume-to-vacancy matcher that can process up to 300 roles at scale. It uses LangChain for LLM orchestration, ChromaDB for vector similarity search, and PostgreSQL for data persistence. The system includes specialized agents for resume parsing, job matching, and salary research with a clean architecture approach.";
    }

    if (lowerMessage.includes('swift-kyc') || lowerMessage.includes('kyc')) {
      return "swift-kyc is a multi-agent KYC verification system that uses 6 specialized AI agents for comprehensive screening. It's built with LangChain and Ollama for 100% local LLM processing, ensuring complete confidentiality. The system handles PEP screening, sanctions checking, adverse media analysis, and compliance reporting to Swiss banking standards.";
    }

    if (lowerMessage.includes('swarm-ai') || lowerMessage.includes('java') || lowerMessage.includes('spring')) {
      return "swarm-ai is a Java multi-agent orchestration framework built with Spring AI and Java 21+. It adapts CrewAI concepts to the Java ecosystem, providing agents, tasks, memory management, and telemetry out of the box. It supports multiple LLM providers including OpenAI, Anthropic, and Ollama, with enterprise-grade observability.";
    }

    if (lowerMessage.includes('intelli-vision') || lowerMessage.includes('computer vision') || lowerMessage.includes('object detection')) {
      return "intelli-vision is a real-time object detection system using PyTorch and YOLOv8. It supports multiple backends including Detectron2 for advanced models like Faster R-CNN and Mask R-CNN. The system offers professional architecture with configurable confidence levels and cross-platform compatibility including Windows, Linux, and Docker.";
    }

    // General experience questions
    if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      return "I'm a Senior AI/ML Engineer with expertise in building intelligent multi-agent systems and enterprise applications. I've created the IntelliSwarm.ai ecosystem - 9 open-source projects covering phishing detection, resume matching, KYC verification, vulnerability patching, and more. My focus is on privacy-first AI solutions using local LLMs like Ollama.";
    }

    if (lowerMessage.includes('project') || lowerMessage.includes('work')) {
      return "My main focus is the IntelliSwarm.ai project ecosystem, which includes 9 different AI-powered applications. These range from security tools like inbox-sentinel for phishing detection, to enterprise solutions like hire-compass for HR automation, to development tools like vuln-patcher for automated vulnerability management. Each project emphasizes practical AI applications with enterprise-grade architecture.";
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