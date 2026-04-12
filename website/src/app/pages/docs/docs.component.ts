import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Documentation',
      description: 'Everything you need to build, deploy, and scale AI agent workflows with SwarmAI. Getting started, YAML DSL, self-improving workflows, enterprise features, and module reference.',
      keywords: 'SwarmAI documentation, AI agent tutorial, YAML DSL guide, Spring Boot AI docs',
    });
  }
  sections = [
    {
      title: 'Getting Started',
      icon: 'rocket_launch',
      description: 'Build your first AI swarm in 5 minutes. Agents, tasks, processes, and tools.',
      link: 'https://github.com/intelliswarm-ai/swarm-ai/blob/main/GETTING_STARTED.md',
      tag: 'Tutorial'
    },
    {
      title: 'YAML DSL Guide',
      icon: 'code',
      description: 'Define workflows declaratively in YAML. Zero Java code required.',
      link: 'https://github.com/intelliswarm-ai/swarm-ai/blob/main/GETTING_STARTED.md#yaml-dsl',
      tag: 'Guide'
    },
    {
      title: 'Self-Improving Workflows',
      icon: 'auto_fix_high',
      description: 'Dynamic skill generation, RL-powered decisions, and convergence detection.',
      link: 'https://github.com/intelliswarm-ai/swarm-ai/blob/main/docs/SELF_IMPROVING_WORKFLOWS.md',
      tag: 'Deep Dive'
    },
    {
      title: 'Enterprise Features',
      icon: 'business',
      description: 'Multi-tenancy, governance gates, budget tracking, RBAC, and audit trail.',
      link: 'https://github.com/intelliswarm-ai/swarm-ai/blob/main/GETTING_STARTED.md#enterprise-features',
      tag: 'Enterprise'
    },
    {
      title: 'API Keys Setup',
      icon: 'key',
      description: 'Configure OpenAI, Anthropic, Ollama, and other LLM provider API keys.',
      link: 'https://github.com/intelliswarm-ai/swarm-ai/blob/main/docs/API_KEYS_SETUP_GUIDE.md',
      tag: 'Setup'
    },
    {
      title: 'Docker Deployment',
      icon: 'deployed_code',
      description: 'Run SwarmAI in Docker with Redis, PostgreSQL, and ChromaDB.',
      link: 'https://github.com/intelliswarm-ai/swarm-ai/blob/main/docs/DOCKER_EXAMPLE_GUIDE.md',
      tag: 'DevOps'
    },
  ];

  modules = [
    { name: 'swarmai-core', description: 'Agents, tasks, processes, state, skills, memory, knowledge, budget, governance, observability' },
    { name: 'swarmai-tools', description: '24 built-in tools: web search, PDF, CSV, shell, HTTP, email, SEC filings' },
    { name: 'swarmai-dsl', description: 'YAML DSL parser & compiler for declarative workflow definitions' },
    { name: 'swarmai-rl', description: 'Lightweight RL: contextual bandits, Thompson sampling, heuristic policies' },
    { name: 'swarmai-enterprise', description: 'Multi-tenancy, deep RL (DQN), advanced governance, RBAC, audit, billing' },
    { name: 'swarmai-eval', description: 'Self-evaluation swarm, competitive benchmarks, value scoring, regression detection' },
    { name: 'swarmai-studio', description: 'Web dashboard for workflow monitoring, event replay, and debugging' },
    { name: 'swarmai-bom', description: 'Bill of Materials for dependency version alignment' },
  ];
}
