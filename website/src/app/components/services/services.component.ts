import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  mainTitle = {
    start: 'Our ',
    gradient: 'AI Automations'
  };

  description = 'Build powerful AI assistants tailored to your specific needs with our comprehensive service offerings. Transform your workflow with intelligent automation and seamless integration.';

  aiAssistantServices = [
    {
      icon: 'smart_toy',
      title: 'Custom Assistant Development',
      features: [
        'Personalized AI Behavior Design',
        'Domain-Specific Training',
        'Multi-Language Support'
      ]
    },
    {
      icon: 'integration_instructions',
      title: 'System Integration',
      features: [
        'API & Database Connection',
        'Third-Party Tool Integration',
        'Custom Workflow Design'
      ]
    },
    {
      icon: 'description',
      title: 'Content Processing',
      features: [
        'Document Analysis & Learning',
        'Knowledge Base Creation',
        'Automated Content Generation'
      ]
    },
    {
      icon: 'security',
      title: 'Security & Compliance',
      features: [
        'Data Privacy Protection',
        'Access Control Management',
        'Compliance Monitoring'
      ]
    },
    {
      icon: 'analytics',
      title: 'Analytics & Reporting',
      features: [
        'Usage Analytics Dashboard',
        'Performance Metrics',
        'ROI Tracking'
      ]
    },
    {
      icon: 'support',
      title: 'Support & Training',
      features: [
        '24/7 Technical Support',
        'User Training Programs',
        'Documentation & Resources'
      ]
    }
  ];

  agenticSolutions = [
    {
      icon: 'auto_awesome',
      title: 'AI-Powered Automation',
      features: [
        'End-to-End Workflow Automation',
        'AI-Orchestrated Task Management',
        'Robotic Process Automation + AI'
      ]
    },
    {
      icon: 'developer_board',
      title: 'AI Agent Development',
      features: [
        'Custom AI Agent Development',
        'Multi-Agent Collaboration',
        'Autonomous Decision Systems'
      ]
    },
    {
      icon: 'trending_up',
      title: 'Business Optimization',
      features: [
        'Predictive Business Intelligence',
        'AI-Powered Process Mining',
        'Dynamic Resource Allocation'
      ]
    },
    {
      icon: 'psychology',
      title: 'Knowledge Management',
      features: [
        'Intelligent Knowledge Base',
        'Document Processing',
        'Internal Support AI Agents'
      ]
    },
    {
      icon: 'support_agent',
      title: 'Customer Service & Sales',
      features: [
        'AI Support Agents',
        'Sales Assistants',
        'Market Research Automation'
      ]
    },
    {
      icon: 'code',
      title: 'Development & Engineering',
      features: [
        'AI Software Engineering',
        'Autonomous DevOps',
        'Code Optimization'
      ]
    }
  ];

  openSourceProjects = [
    {
      name: 'inbox-sentinel',
      description: 'Local-first phishing detection with orchestrated ML (and optional LLMs)',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/inbox-sentinel',
      icon: 'security'
    },
    {
      name: 'hire-compass',
      description: 'AI-powered resume-to-vacancy matcher for in-house HR (300-role scale)',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/hire-compass',
      icon: 'people'
    },
    {
      name: 'swift-kyc',
      description: 'Multi-agent AI system for automated KYC verification, document processing, and compliance workflows',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/swift-kyc',
      icon: 'verified_user'
    },
    {
      name: 'mail-pilot',
      description: 'Guiding you through your inbox with AI and voice',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/mail-pilot',
      icon: 'mail'
    },
    {
      name: 'swarm-trade',
      description: 'Many agents. One trading objective',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/swarm-trade',
      icon: 'trending_up'
    },
    {
      name: 'swarm-ai',
      description: 'Java multi-agent orchestration with Spring AI—agents, tasks, memory, tools, and telemetry out of the box',
      technology: 'Java',
      url: 'https://github.com/intelliswarm-ai/swarm-ai',
      icon: 'memory'
    },
    {
      name: 'intelli-vision',
      description: 'Object detection realtime',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/intelli-vision',
      icon: 'visibility'
    },
    {
      name: 'phish-llm-trainer',
      description: 'Phishing email detection system using DistilBERT',
      technology: 'Python',
      url: 'https://github.com/intelliswarm-ai/phish-llm-trainer',
      icon: 'model_training'
    },
    {
      name: 'vuln-patcher',
      description: 'Automated vulnerability scout & patch bot – pulls advisories (CVE, GHSA, OSV …) then opens pull-requests that fix what it finds',
      technology: 'Java',
      url: 'https://github.com/intelliswarm-ai/vuln-patcher',
      icon: 'build'
    }
  ];
} 