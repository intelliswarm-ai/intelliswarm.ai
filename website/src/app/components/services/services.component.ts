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
} 