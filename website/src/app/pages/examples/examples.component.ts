import { Component } from '@angular/core';

interface Example {
  id: string;
  title: string;
  category: string;
  process: string;
  agents: string[];
  description: string;
  diagram: string; // Mermaid-style ASCII flow
  features: string[];
  source: string;
}

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrl: './examples.component.css'
})
export class ExamplesComponent {

  examples: Example[] = [
    {
      id: 'competitive',
      title: 'Competitive Market Analysis',
      category: 'Core',
      process: 'HIERARCHICAL',
      agents: ['Research Program Manager', 'Market Intelligence Analyst', 'Research Analyst', 'Strategy Consultant', 'Executive Writer'],
      description: 'Hierarchical multi-agent research. A program manager coordinates 4 specialists — market intelligence, research, strategy, and writing — to produce a comprehensive competitive landscape report.',
      diagram: 'Program Manager\n  ├──► Market Intelligence Analyst\n  ├──► Research Analyst\n  ├──► Strategy Consultant\n  └──► Executive Writer ──► Report',
      features: ['Hierarchical delegation', '5 specialist agents', 'Manager coordination', 'Competitive intelligence'],
      source: 'competitive-market-analysis'
    },
    {
      id: 'duediligence',
      title: 'Investment Due Diligence',
      category: 'Core',
      process: 'PARALLEL',
      agents: ['Program Director', 'Financial Analyst', 'Market Analyst', 'Legal & Regulatory Analyst'],
      description: 'Parallel due diligence across financial, market, and legal dimensions. Specialist agents analyze a company simultaneously, then a director synthesizes findings into a comprehensive assessment.',
      diagram: '┌─ Financial Analyst  ─┐\n├─ Market Analyst     ─┤──► Program Director ──► Report\n└─ Legal & Regulatory ─┘',
      features: ['Parallel execution', 'Layer synchronization', '4 concurrent agents', 'Result synthesis'],
      source: 'investment-due-diligence'
    },
    {
      id: 'webresearch',
      title: 'Hierarchical Web Research',
      category: 'Core',
      process: 'HIERARCHICAL',
      agents: ['Research Manager', 'Web Searcher', 'Data Analyst', 'Fact Checker', 'Report Writer'],
      description: 'Manager agent creates an execution plan, delegates search tasks to specialists, collects results, and orchestrates the final report. Workers are selected based on task requirements and tool availability.',
      diagram: 'Manager ──► Plan\n  ├──► Web Searcher ──► raw data\n  ├──► Data Analyst ──► insights\n  ├──► Fact Checker ──► verified\n  └──► Report Writer ──► final report',
      features: ['Manager delegation', 'Dynamic task assignment', 'Agent selection by capability', '5 agents'],
      source: 'web-search-research-pipeline'
    },
    {
      id: 'selfimproving',
      title: 'Self-Improving Analysis',
      category: 'Advanced',
      process: 'SELF_IMPROVING',
      agents: ['Analyst', 'Reviewer'],
      description: 'The analyst executes tasks while the reviewer evaluates output quality. When capability gaps are detected, new Groovy-based skills are generated, validated in a sandbox, and hot-loaded into the agent mid-run. RL policy decides when to converge.',
      diagram: 'Analyst ──► Output ──► Reviewer\n  ▲                        │\n  │   ┌─ CAPABILITY_GAP ◄─┘\n  │   ▼\n  │  Generate Skill ──► Validate ──► Register\n  └──────────── Retry with new skill',
      features: ['Dynamic skill generation', 'Groovy sandbox validation', 'RL convergence policy', 'Skill persistence'],
      source: 'self-improving-agent-learning'
    },
    {
      id: 'enterprise',
      title: 'Governed Enterprise Workflow',
      category: 'Enterprise',
      process: 'SEQUENTIAL',
      agents: ['Research Analyst', 'Report Writer'],
      description: 'Production-grade workflow with multi-tenancy (tenant-scoped memory/quotas), budget tracking ($5 cap, 500K token limit), and human-in-the-loop approval gates between research and writing phases.',
      diagram: 'Tenant: acme-research | Budget: $5.00 / 500K tokens\n\nResearch Analyst ──► [APPROVAL GATE] ──► Report Writer\n                     │ auto-approve    │\n                     │ after 5s        │\n                     └─────────────────┘\n──► Budget Snapshot logged',
      features: ['Multi-tenancy', 'Budget HARD_STOP/WARN', 'Approval gates', 'Tenant quotas'],
      source: 'enterprise-self-improving-with-governance'
    },
    {
      id: 'competitive',
      title: 'Competitive Research Swarm',
      category: 'Advanced',
      process: 'SWARM',
      agents: ['Discovery Agent', 'Research Agent', 'Synthesis Agent'],
      description: 'Distributed fan-out pattern. Discovery phase identifies competitor targets, then parallel self-improving agents research each target independently. A coordinator synthesizes all findings into a master report.',
      diagram: 'Discovery ──► [Target A, Target B, Target C]\n  ├──► Self-Improving Agent (A) ──┐\n  ├──► Self-Improving Agent (B) ──┤──► Coordinator ──► Master Report\n  └──► Self-Improving Agent (C) ──┘',
      features: ['Distributed fan-out', 'Parallel sub-swarms', 'Shared skill registry', 'Master synthesis'],
      source: 'competitive-research-parallel-swarm'
    },
    {
      id: 'investment',
      title: 'Iterative Investment Memo',
      category: 'Core',
      process: 'ITERATIVE',
      agents: ['Equity Research Analyst', 'Memo Author', 'Managing Director'],
      description: 'Execute-review-refine loop. The analyst researches, the memo author drafts, and the managing director reviews against a 7-point rubric. Iterates until approved or max iterations reached.',
      diagram: 'Research Analyst ──► Memo Author ──► Managing Director\n  ▲                                        │\n  │         NEEDS_REFINEMENT ◄─────────────┘  (with feedback)\n  │                │\n  └────────────────┘\n\n  APPROVED ──► Final Memo',
      features: ['Quality-driven iteration', '7-point review rubric', 'Max iteration cap', '3-agent collaboration'],
      source: 'iterative-investment-memo-refinement'
    },
    {
      id: 'yamldsl',
      title: 'YAML DSL Workflows',
      category: 'DSL',
      process: 'ALL',
      agents: ['Defined in YAML'],
      description: '30+ YAML workflow definitions covering every process type, budget tracking, governance gates, tool hooks, conditional tasks, graph workflows with state channels, and composite pipelines. Zero Java code required.',
      diagram: 'YAML File ──► YamlSwarmParser ──► SwarmDefinition\n                                      │\n                                      ▼\n                               SwarmCompiler ──► Live Swarm\n                                      │\n                                      ▼\n                                swarm.kickoff()',
      features: ['Template variables {{topic}}', 'All 7 process types', 'Tool hooks in YAML', 'Graph conditional routing'],
      source: 'yaml-workflow-definition'
    },
    {
      id: 'humanloop',
      title: 'Human-in-the-Loop Graph',
      category: 'Advanced',
      process: 'GRAPH',
      agents: ['Writer', 'Human Reviewer', 'Editor'],
      description: 'Graph workflow with conditional routing. Writer produces draft, human reviewer scores it. If score >= 80, proceed to publish. If iteration >= 3, force publish. Otherwise, loop back to editor for refinement.',
      diagram: 'START ──► Writer ──► Reviewer\n                       │\n            score >= 80 ├──► END (publish)\n         iteration >= 3 ├──► END (force)\n              default   └──► Editor ──► Writer (loop)',
      features: ['Conditional edges', 'State channels (score, iteration)', 'Human review checkpoint', 'Loop with exit conditions'],
      source: 'human-approval-gate'
    },
    {
      id: 'datapipeline',
      title: 'Data Pipeline',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Data Collector', 'Data Analyst', 'Report Generator'],
      description: 'ETL-style pipeline. Collector ingests data from CSV and database tools, analyst performs statistical analysis, and generator produces a formatted report with charts description.',
      diagram: 'Data Collector ──[csv, database]──► Data Analyst ──[calculator]──► Report Generator ──► output/',
      features: ['CSV analysis tool', 'Database query tool', 'Calculator tool', 'File output'],
      source: 'data-processing-pipeline'
    },
    {
      id: 'customersupport',
      title: 'Customer Support REST API',
      category: 'Core',
      process: 'GRAPH',
      agents: ['Classifier', 'Billing Agent', 'Technical Agent', 'Account Agent'],
      description: 'Full REST API application with AI-powered chat, intelligent routing via SwarmGraph, conversation history, product catalog, order management, and ticket system. Runs on port 8080 with a web UI.',
      diagram: 'REST API :8080 ──► Classifier\n  ├── BILLING ──► Billing Agent ──┐\n  ├── TECHNICAL ──► Tech Agent   ──┤──► QA ──► Response\n  ├── ACCOUNT ──► Account Agent ──┤\n  └── GENERAL ──► General Agent ──┘',
      features: ['REST API', 'SwarmGraph routing', 'Conversation history', 'Web UI'],
      source: 'customer-support-rest-api'
    },
    {
      id: 'rag',
      title: 'RAG Knowledge Base',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Retriever Agent', 'Writer Agent'],
      description: 'Complete RAG application with document ingestion, vector store integration (Chroma), semantic search, and multi-agent Q&A pipeline. Runs as a REST API on port 8080.',
      diagram: 'POST /ingest ──► Embed & Store\nPOST /ask ──► Retriever ──► (Vector Store) ──► Writer ──► Response',
      features: ['Document ingestion', 'Vector store (Chroma)', 'Semantic search', 'REST API'],
      source: 'rag-knowledge-base-rest-api'
    },
    {
      id: 'secureops',
      title: 'SecureOps Assessment',
      category: 'Enterprise',
      process: 'SEQUENTIAL',
      agents: ['Recon Agent', 'Vulnerability Analyst', 'Report Writer'],
      description: 'Security assessment pipeline with budget controls and tool permission enforcement. Recon agent uses web scraping (READ_ONLY), vulnerability analyst processes findings, writer generates the assessment report.',
      diagram: 'Recon Agent ──[web-scrape: READ_ONLY]──► Vuln Analyst ──► Report Writer\n\nBudget: $5 / 200K tokens | Permission: READ_ONLY enforced',
      features: ['Tool permission levels', 'Budget tracking', 'READ_ONLY enforcement', 'Security-focused'],
      source: 'secure-operations-compliance'
    },
    {
      id: 'pentest',
      title: 'Distributed Penetration Test',
      category: 'Enterprise',
      process: 'SWARM',
      agents: ['Scanner', 'Exploit Analyst', 'Report Writer'],
      description: 'Swarm-based security testing. Scanner discovers targets, parallel agents assess each target independently with self-improving capabilities, coordinator produces a comprehensive security report.',
      diagram: 'Scanner ──► [Target 1, Target 2, ...]\n  ├──► Self-Improving Agent ──┐\n  ├──► Self-Improving Agent ──┤──► Security Report\n  └──► Self-Improving Agent ──┘',
      features: ['SWARM process', 'Parallel security agents', 'Self-improving analysis', 'Comprehensive report'],
      source: 'security-penetration-testing-swarm'
    },

    // ── Getting Started ──────────────────────────────────────────

    {
      id: 'helloworld',
      title: 'Hello World — Single Agent',
      category: 'Getting Started',
      process: 'SEQUENTIAL',
      agents: ['Summarizer'],
      description: 'The simplest possible SwarmAI setup: one agent, one task, sequential process, no tools. Start here to learn the basics of Agent, Task, and Swarm.',
      diagram: '[Summarizer] ──► output',
      features: ['1 agent', '1 task', 'No tools', 'Minimal setup'],
      source: 'hello-world-single-agent'
    },
    {
      id: 'toolcalling',
      title: 'Agent with Tool Calling',
      category: 'Getting Started',
      process: 'SEQUENTIAL',
      agents: ['Math Tutor'],
      description: 'A single agent equipped with the CalculatorTool to perform precise arithmetic. The agent decides when to call the tool based on the task description.',
      diagram: '[Math Tutor] ──uses──► (CalculatorTool) ──► output',
      features: ['Tool registration', 'Spring-managed tools', 'Tool hooks', 'Auto tool invocation'],
      source: 'agent-with-tool-calling'
    },
    {
      id: 'handoff',
      title: 'Agent-to-Agent Task Handoff',
      category: 'Getting Started',
      process: 'SEQUENTIAL',
      agents: ['Researcher', 'Editor'],
      description: 'Two agents in sequence. The researcher gathers information, then the editor refines it. Demonstrates task dependencies where one agent output feeds into the next.',
      diagram: '[Researcher] ──► [Editor] ──► output',
      features: ['Task dependencies', 'maxTurns control', 'Permission levels', 'Output chaining'],
      source: 'agent-to-agent-task-handoff'
    },
    {
      id: 'context',
      title: 'Shared Context Between Agents',
      category: 'Getting Started',
      process: 'SEQUENTIAL',
      agents: ['Outliner', 'Drafter', 'Polisher'],
      description: 'Three agents in a pipeline sharing context (topic, audience, tone, word count) through the inputs map. Each agent builds on the previous output.',
      diagram: '[Outliner] ──► [Drafter] ──► [Polisher] ──► output\n       └──── shared context ────┘',
      features: ['Inputs map', 'Context variables', '3-stage pipeline', 'dependsOn chaining'],
      source: 'shared-context-between-agents'
    },
    {
      id: 'multiturn',
      title: 'Multi-Turn Deep Reasoning',
      category: 'Getting Started',
      process: 'SEQUENTIAL',
      agents: ['Deep Researcher'],
      description: 'A single agent that reasons across multiple LLM turns with automatic context compaction. The agent autonomously decides when to continue and when analysis is complete.',
      diagram: '[Deep Researcher]\n  turn 1 → turn 2 → ... → turn 5\n  (auto-compact after 4K tokens)\n  ──► output',
      features: ['maxTurns(5)', 'CompactionConfig', 'CONTINUE/DONE markers', 'Iterative reasoning'],
      source: 'multi-turn-deep-reasoning'
    },

    // ── Core (additional) ────────────────────────────────────────

    {
      id: 'streaming',
      title: 'Streaming Real-Time Responses',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Streaming Agent'],
      description: 'Reactive multi-turn execution with progress hooks showing incremental output as the agent reasons through the problem.',
      diagram: '[Agent] ──► stream chunk 1 ──► chunk 2 ──► ... ──► final output',
      features: ['Reactive streaming', 'Progress hooks', 'Multi-turn', 'Incremental output'],
      source: 'streaming-real-time-responses'
    },
    {
      id: 'errorhandling',
      title: 'Error Handling & Recovery',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Various'],
      description: '3 resilience scenarios: tool failure recovery, budget enforcement (HARD_STOP), and timeout handling. Demonstrates how SwarmAI handles failures gracefully.',
      diagram: 'Scenario 1: Tool failure ──► recovery\nScenario 2: Budget exceeded ──► HARD_STOP\nScenario 3: Timeout ──► graceful shutdown',
      features: ['Tool failure recovery', 'Budget HARD_STOP', 'Timeout handling', 'Graceful degradation'],
      source: 'error-handling-and-recovery'
    },
    {
      id: 'memory',
      title: 'Conversation Memory Persistence',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Research Agent', 'Analysis Agent'],
      description: 'Shared InMemoryMemory across agents — save, search, recall, and cross-agent knowledge sharing. Demonstrates persistent context across the workflow.',
      diagram: '[Research Agent] ──save──► (Memory) ──recall──► [Analysis Agent]',
      features: ['InMemoryMemory', 'Save & recall', 'Cross-agent sharing', 'Knowledge persistence'],
      source: 'conversation-memory-persistence'
    },
    {
      id: 'multiprovider',
      title: 'Multi-LLM Provider Switching',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Agent (multiple configs)'],
      description: 'Same task executed at different temperatures and model variants, with side-by-side comparison of outputs. Useful for prompt engineering and model evaluation.',
      diagram: '[Task] ──► Agent (temp=0.1) ──► output A\n       ──► Agent (temp=0.7) ──► output B\n       ──► Compare results',
      features: ['Temperature comparison', 'Model variants', 'Side-by-side output', 'Prompt engineering'],
      source: 'multi-llm-provider-switching'
    },
    {
      id: 'multilang',
      title: 'Multi-Language Translation',
      category: 'Core',
      process: 'PARALLEL',
      agents: ['English Agent', 'Spanish Agent', 'French Agent', 'Synthesizer'],
      description: '3 agents analyze the same topic in English, Spanish, and French simultaneously. A synthesizer produces a cross-cultural report combining all perspectives.',
      diagram: '┌─ English Agent  ─┐\n├─ Spanish Agent  ─┤──► Synthesizer ──► Cross-Cultural Report\n└─ French Agent   ─┘',
      features: ['Parallel execution', '3 languages', 'Cross-cultural synthesis', 'Multi-agent collaboration'],
      source: 'multi-language-translation'
    },
    {
      id: 'stockanalysis',
      title: 'Stock Market Analysis',
      category: 'Core',
      process: 'PARALLEL',
      agents: ['Financial Analyst', 'Research Analyst', 'Filings Analyst', 'Investment Advisor'],
      description: '3 analyst agents research a stock in parallel using web search and SEC filings tools, then an investment advisor synthesizes findings into a recommendation.',
      diagram: '┌─ Financial Analyst ──[calculator, web]──┐\n├─ Research Analyst ──[web, sec-filings]──┤──► Investment Advisor ──► Report\n└─ Filings Analyst ──[web, sec-filings]──┘',
      features: ['Parallel analysis', 'SEC filings tool', 'Web search', 'Investment recommendation'],
      source: 'stock-market-analysis'
    },
    {
      id: 'codebase',
      title: 'Codebase Analysis',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Code Analyst'],
      description: 'Analyze codebase architecture, metrics, and dependencies. Works on any local code directory without external API keys.',
      diagram: '[Code Analyst] ──[file-read, directory-read]──► Architecture Report',
      features: ['Local analysis', 'No API keys needed', 'File tools', 'Architecture insights'],
      source: 'codebase-analysis-workflow'
    },
    {
      id: 'mcpresearch',
      title: 'MCP Model Context Protocol',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Research Agent'],
      description: 'Research workflow using MCP (Model Context Protocol) tools for web fetch and search. Demonstrates the MCP integration pattern.',
      diagram: '[Research Agent] ──[mcp-web-fetch, mcp-web-search]──► Report',
      features: ['MCP integration', 'Web fetch tool', 'Web search tool', 'Protocol-based tools'],
      source: 'mcp-model-context-protocol'
    },
    {
      id: 'scheduled',
      title: 'Scheduled Cron Monitoring',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Monitor Agent'],
      description: '3-iteration monitoring with file-based state. Detects trends across runs using persistent state files.',
      diagram: '[Monitor] ──► Run 1 ──► Run 2 ──► Run 3\n                └── file state ──┘ (trend detection)',
      features: ['Scheduled execution', 'File-based state', 'Trend detection', 'Multi-iteration'],
      source: 'scheduled-cron-monitoring'
    },
    {
      id: 'visualization',
      title: 'Workflow Visualization',
      category: 'Core',
      process: 'GRAPH',
      agents: ['None (diagram generation)'],
      description: 'Build 4 graph topologies and generate Mermaid diagrams. No LLM needed — demonstrates the graph API and visualization capabilities.',
      diagram: 'SwarmGraph.create() ──► topology ──► Mermaid diagram',
      features: ['Mermaid diagrams', '4 graph topologies', 'No LLM needed', 'Visual workflow design'],
      source: 'workflow-visualization-mermaid'
    },

    // ── Advanced (additional) ────────────────────────────────────

    {
      id: 'evaluator',
      title: 'Evaluator-Optimizer Feedback Loop',
      category: 'Advanced',
      process: 'GRAPH',
      agents: ['Generator', 'Evaluator', 'Optimizer'],
      description: 'Generate → evaluate → optimize loop with a quality gate. The evaluator scores output on multiple criteria; if score >= 80, it passes. Otherwise, the optimizer refines and loops back.',
      diagram: 'Generator ──► Evaluator (score >= 80?)\n  ▲                │\n  │   NO ◄──────────┘\n  │   ▼\n  └── Optimizer\n\n  YES ──► Final Output',
      features: ['Quality gate', 'Score threshold', 'Optimize loop', 'Multi-criteria evaluation'],
      source: 'evaluator-optimizer-feedback-loop'
    },
    {
      id: 'debate',
      title: 'Multi-Agent Debate',
      category: 'Advanced',
      process: 'GRAPH',
      agents: ['Proponent', 'Opponent', 'Judge'],
      description: 'Two agents debate a proposition over 3 rounds, then a judge declares the winner. Demonstrates the peer interaction pattern with structured argumentation.',
      diagram: 'Proponent ──► Opponent ──► Proponent ──► ... (3 rounds)\n                                                    ▼\n                                               [Judge] ──► Winner',
      features: ['Debate rounds', 'Peer interaction', 'Judge evaluation', 'Structured argumentation'],
      source: 'multi-agent-debate'
    },
    {
      id: 'agenttesting',
      title: 'Unit Testing Agents with Mocks',
      category: 'Advanced',
      process: 'SEQUENTIAL',
      agents: ['Test Agent'],
      description: 'Agent output quality evaluation with 5-criterion scoring. Includes JUnit 5 unit tests using mock ChatClient — no LLM needed for testing.',
      diagram: '[Agent] ──► output ──► 5-criterion scorer\n\nJUnit 5: mock ChatClient ──► verify agent config, hooks, dependencies',
      features: ['Mock ChatClient', 'JUnit 5 tests', '5-criterion scoring', 'No LLM needed for tests'],
      source: 'unit-testing-agents-with-mocks'
    },
    {
      id: 'competitiveswarm',
      title: 'Competitive Research Swarm',
      category: 'Advanced',
      process: 'SWARM',
      agents: ['Discovery Agent', 'Research Agent', 'Synthesis Agent'],
      description: 'Distributed fan-out pattern. Discovery phase identifies competitor targets, then parallel self-improving agents research each independently. Coordinator synthesizes into a master report.',
      diagram: 'Discovery ──► [Target A, Target B, Target C]\n  ├──► Self-Improving Agent (A) ──┐\n  ├──► Self-Improving Agent (B) ──┤──► Coordinator ──► Master Report\n  └──► Self-Improving Agent (C) ──┘',
      features: ['Distributed fan-out', 'Parallel sub-swarms', 'Shared skill registry', 'Master synthesis'],
      source: 'competitive-research-parallel-swarm'
    },
    {
      id: 'investmentswarm',
      title: 'Investment Analysis Swarm',
      category: 'Advanced',
      process: 'SWARM',
      agents: ['Discovery Agent', 'Analysis Agent', 'Coordinator'],
      description: 'Multi-company investment analysis with parallel agents and cross-agent skill sharing. Each company is analyzed independently, then findings are synthesized.',
      diagram: '┌─ Company A Agent ──┐\n├─ Company B Agent ──┤──► Coordinator ──► Investment Report\n└─ Company C Agent ──┘',
      features: ['Multi-company analysis', 'Parallel agents', 'Cross-agent skills', 'Investment synthesis'],
      source: 'investment-analysis-parallel-swarm'
    },

    // ── Enterprise (additional) ──────────────────────────────────

    {
      id: 'enterprisegov',
      title: 'Enterprise Governance & SPI Hooks',
      category: 'Enterprise',
      process: 'SEQUENTIAL',
      agents: ['Research Analyst', 'Report Writer'],
      description: 'Enterprise-grade workflow with SPI extension points (AuditSink, LicenseProvider, MeteringSink), multi-tenancy isolation, and human-in-the-loop approval gates.',
      diagram: '[Researcher] ──► [Approval Gate] ──► [Writer]\n     │                                    │\n     +── AuditSink ─── MeteringSink ──────+\n     +── TenantContext ── BudgetTracker ──+',
      features: ['SPI extension points', 'AuditSink', 'LicenseProvider', 'MeteringSink', 'Multi-tenancy'],
      source: 'enterprise-governance-spi-hooks'
    },
    {
      id: 'auditedresearch',
      title: 'Audit Trail Research Pipeline',
      category: 'Enterprise',
      process: 'SEQUENTIAL',
      agents: ['Research Agent'],
      description: 'Research pipeline with full observability. Every tool call is audited and sanitized, the entire workflow is recorded for replay. Multi-turn reasoning with auto-compaction.',
      diagram: '[Researcher] ──[audit + sanitize + rate-limit]──► output\n     └── Decision Tracing ── Event Replay ── Structured Logging',
      features: ['Audit hooks', 'Sanitization', 'Rate limiting', 'Decision tracing', 'Event replay'],
      source: 'audit-trail-research-pipeline'
    },
    {
      id: 'governedpipeline',
      title: 'Governed Pipeline with Checkpoints',
      category: 'Enterprise',
      process: 'COMPOSITE',
      agents: ['Multiple (3-stage)'],
      description: 'Multi-stage composite pipeline: Parallel research → Hierarchical synthesis → Iterative review. Checkpoints between stages, budget enforcement, and Mermaid diagram generation.',
      diagram: '[Parallel Research] ──► checkpoint ──► [Hierarchical Synthesis]\n     ──► checkpoint ──► [Iterative Review] ──► Final Report',
      features: ['Composite process', 'Checkpoints', 'Budget enforcement', 'Mermaid diagrams', '3-stage pipeline'],
      source: 'governed-pipeline-with-checkpoints'
    },

    // ── Applications ─────────────────────────────────────────────

    {
      id: 'ragresearch',
      title: 'RAG Retrieval-Augmented Research',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Retriever Agent', 'Writer Agent'],
      description: 'RAG workflow with vector store search and multi-agent evidence-grounded report writing using InMemoryKnowledge and SemanticSearchTool.',
      diagram: '[Retriever] ──(Vector Store)──► [Writer] ──► Grounded Report',
      features: ['InMemoryKnowledge', 'SemanticSearchTool', 'Evidence-grounded', 'Vector store search'],
      source: 'rag-retrieval-augmented-research'
    },
    {
      id: 'deeprl',
      title: 'Deep Reinforcement Learning (DQN)',
      category: 'Advanced',
      process: 'SELF_IMPROVING',
      agents: ['Analyst', 'Reviewer'],
      description: 'Self-improving workflow powered by a Deep Q-Network (DQN) policy engine. The RL agent learns optimal strategies for task execution through experience replay and neural network optimization.',
      diagram: 'Analyst ──► Reviewer ──► DQN Policy\n  ▲                         │\n  └── optimize strategy ────┘',
      features: ['DQN policy engine', 'Experience replay', 'Neural network', 'Reinforcement learning'],
      source: 'deep-reinforcement-learning-dqn'
    },
  ];

  categories = ['All', 'Getting Started', 'Core', 'Advanced', 'Enterprise', 'Applications', 'DSL'];
  selectedCategory = 'All';

  get filteredExamples(): Example[] {
    if (this.selectedCategory === 'All') return this.examples;
    return this.examples.filter(e => e.category === this.selectedCategory);
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
  }
}
