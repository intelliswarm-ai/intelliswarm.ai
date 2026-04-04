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
      id: 'research',
      title: 'Sequential Research Pipeline',
      category: 'Core',
      process: 'SEQUENTIAL',
      agents: ['Research Analyst', 'Content Writer'],
      description: 'Classic two-agent pipeline. The researcher gathers data using web search and SEC filing tools, then the writer transforms findings into a polished markdown report. Tasks run in dependency order with full context passing.',
      diagram: 'Research Analyst ──[web-search, sec-filings]──► Content Writer ──► Report.md',
      features: ['Task dependencies', 'Tool usage', 'Output formatting', 'File output'],
      source: 'research'
    },
    {
      id: 'duediligence',
      title: 'Parallel Due Diligence',
      category: 'Core',
      process: 'PARALLEL',
      agents: ['Financial Analyst', 'Legal Analyst', 'Market Analyst', 'Operations Analyst'],
      description: '4 specialist agents analyze a company simultaneously across financial, legal, market, and operational dimensions. All run in parallel (Layer 0), then a synthesis task in Layer 1 merges findings.',
      diagram: '┌─ Financial Analyst ─┐\n├─ Legal Analyst     ─┤──► Synthesis ──► Report\n├─ Market Analyst    ─┤\n└─ Operations Analyst─┘',
      features: ['Parallel execution', 'Layer synchronization', '4 concurrent agents', 'Result synthesis'],
      source: 'duediligence'
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
      source: 'webresearch'
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
      source: 'selfimproving'
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
      source: 'enterprise'
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
      source: 'competitive'
    },
    {
      id: 'investment',
      title: 'Iterative Investment Memo',
      category: 'Core',
      process: 'ITERATIVE',
      agents: ['Analyst', 'Reviewer', 'Writer'],
      description: 'Execute-review-refine loop. The analyst drafts, the reviewer scores quality and provides feedback, and the writer refines. Iterates until the reviewer approves or max iterations (5) is reached.',
      diagram: 'Analyst ──► Draft ──► Reviewer\n  ▲                      │\n  │   NEEDS_REFINEMENT ◄─┘  (with feedback)\n  │         │\n  │         ▼\n  └─── Writer refines\n\n  APPROVED ──► Final Memo',
      features: ['Quality-driven iteration', 'Reviewer feedback loop', 'Max iteration cap', '3-agent collaboration'],
      source: 'investment'
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
      source: 'yamldsl'
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
      source: 'humanloop'
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
      source: 'datapipeline'
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
      source: 'secureops'
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
      source: 'pentest'
    },
  ];

  categories = ['All', 'Core', 'Advanced', 'Enterprise', 'DSL'];
  selectedCategory = 'All';

  get filteredExamples(): Example[] {
    if (this.selectedCategory === 'All') return this.examples;
    return this.examples.filter(e => e.category === this.selectedCategory);
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
  }
}
