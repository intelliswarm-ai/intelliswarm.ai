#!/usr/bin/env node
/*
 * One-shot helper: add a `codeSnippet` (YAML workflow example) to each tool in
 * src/assets/tools/index.json. Each snippet shows the tool wired into a
 * minimal SwarmAI crew using the YAML DSL.
 * Safe to re-run — overwrites any existing codeSnippet.
 */
const fs = require('fs');
const path = require('path');

const CATALOG = path.join(__dirname, '..', 'src', 'assets', 'tools', 'index.json');

// Per-tool scenario data, rendered through a shared YAML template below.
const scenarios = {
  web_search: {
    crew: 'market-research',
    agent: 'researcher',
    role: 'Market Research Analyst',
    goal: 'Surface fresh news on target tickers',
    task: "Find recent news on Tesla's Q4 earnings and summarize the top 3 stories with citations.",
  },
  web_scrape: {
    crew: 'content-harvest',
    agent: 'extractor',
    role: 'Content Extractor',
    goal: 'Pull clean article text from public web pages',
    task: 'Visit the supplied URL and return just the body text, title, and any tables.',
  },
  browse: {
    crew: 'price-watch',
    agent: 'scout',
    role: 'Market Data Scout',
    goal: 'Read live prices from JavaScript-heavy finance pages',
    task: "Fetch AAPL's live quote from Yahoo Finance and report the spot price and day change.",
  },
  http_request: {
    crew: 'api-bridge',
    agent: 'integrator',
    role: 'API Integrator',
    goal: 'Call internal REST services on behalf of the crew',
    task: 'GET https://api.internal/pricing/12345 with the supplied bearer token and return the response.',
  },
  arxiv_search: {
    crew: 'literature-review',
    agent: 'librarian',
    role: 'Research Librarian',
    goal: 'Find recent preprints relevant to the research question',
    task: "Search arXiv for 'retrieval-augmented generation' and return the top 10 papers with titles, authors, and PDF links.",
  },
  wikipedia: {
    crew: 'background-research',
    agent: 'analyst',
    role: 'Research Analyst',
    goal: 'Ground answers with trustworthy encyclopedic facts',
    task: "Fetch a Wikipedia summary for 'Federal Reserve' and extract its stated mandate.",
  },
  wolfram_alpha: {
    crew: 'quant',
    agent: 'quant',
    role: 'Quant Analyst',
    goal: 'Answer mathematical sub-questions with certainty',
    task: 'Compute the derivative of x^3 + 2x^2 - 5x step by step.',
  },
  openweathermap: {
    crew: 'ops-planning',
    agent: 'planner',
    role: 'Operations Planner',
    goal: 'Factor weather into scheduling decisions',
    task: 'Get the 5-day forecast for Zurich and flag any day with more than 70% chance of precipitation.',
  },
  financial_data: {
    crew: 'equity-research',
    agent: 'analyst',
    role: 'Equity Analyst',
    goal: 'Build fundamentals profiles for public companies',
    task: 'Pull the most recent income statement, balance sheet, and key ratios for AAPL.',
  },
  sec_filings: {
    crew: 'regulatory-research',
    agent: 'compliance',
    role: 'Compliance Researcher',
    goal: 'Source regulatory filings directly from SEC EDGAR',
    task: "Fetch Microsoft's most recent 10-K and extract the Risk Factors section.",
  },
  cve_lookup: {
    crew: 'security-triage',
    agent: 'auditor',
    role: 'Security Auditor',
    goal: 'Assess the severity of known vulnerabilities',
    task: 'Look up CVE-2021-44228 and summarize the impact, CVSS score, and affected versions.',
  },
  osv_lookup: {
    crew: 'dependency-audit',
    agent: 'auditor',
    role: 'Dependency Auditor',
    goal: 'Scan open-source libraries for known vulnerabilities',
    task: 'Check whether lodash 4.17.15 on npm has any known vulnerabilities.',
  },
  github_create_pr: {
    crew: 'remediation',
    agent: 'engineer',
    role: 'Remediation Engineer',
    goal: 'Land security patches as reviewable pull requests',
    task: "Open a PR in acme/webapp titled 'Bump log4j to 2.17' from fix/log4j into main.",
  },
  calculator: {
    crew: 'modeling',
    agent: 'modeler',
    role: 'Financial Modeler',
    goal: 'Do precise arithmetic without LLM drift',
    task: "Compute Apple's P/E ratio given price=190 and EPS=6.13.",
  },
  data_analysis: {
    crew: 'insights',
    agent: 'analyst',
    role: 'Insight Analyst',
    goal: 'Identify trends and outliers in numeric data',
    task: 'Given the quarterly revenue series [22, 24, 28, 31], describe the growth trajectory.',
  },
  csv_analysis: {
    crew: 'dataset-qa',
    agent: 'inspector',
    role: 'Data Inspector',
    goal: 'Peek inside CSV datasets without a full data-science stack',
    task: 'Describe the columns of sales.csv and preview the first 5 rows.',
  },
  json_transform: {
    crew: 'data-glue',
    agent: 'shaper',
    role: 'Data Glue',
    goal: 'Reshape JSON between pipeline steps',
    task: "Extract the 'user.email' field from the supplied JSON payload.",
  },
  xml_parse: {
    crew: 'feed-reader',
    agent: 'reader',
    role: 'Feed Reader',
    goal: 'Parse XML feeds and enterprise responses',
    task: 'Return every <title> element from the supplied RSS feed.',
  },
  report_generator: {
    crew: 'executive-writing',
    agent: 'editor',
    role: 'Executive Editor',
    goal: 'Turn raw findings into polished reports',
    task: 'Assemble a one-page executive summary from the supplied analysis output.',
  },
  database_query: {
    crew: 'analytics',
    agent: 'analyst',
    role: 'Analytics Agent',
    goal: 'Read operational data safely from the warehouse',
    task: 'Count active customers per country using the customers table.',
  },
  file_read: {
    crew: 'log-inspection',
    agent: 'reader',
    role: 'Log Reader',
    goal: 'Pick up prior state from local files',
    task: 'Read the first 50 lines of /var/log/app.log.',
  },
  file_write: {
    crew: 'archive',
    agent: 'archiver',
    role: 'Report Archiver',
    goal: 'Persist generated outputs to disk',
    task: 'Save the generated report to /reports/q4-2026.md (overwrite if present).',
  },
  directory_read: {
    crew: 'project-scan',
    agent: 'scout',
    role: 'Project Scout',
    goal: "Discover files the crew should ingest",
    task: "List every Markdown file under the docs/ directory recursively.",
  },
  pdf_read: {
    crew: 'document-review',
    agent: 'analyst',
    role: 'Document Analyst',
    goal: 'Extract text from PDF documents',
    task: 'Read pages 1-5 of annual-report.pdf and summarize the opening letter.',
  },
  code_execution: {
    crew: 'compute-helper',
    agent: 'runner',
    role: 'Compute Helper',
    goal: 'Run small scripted transforms inline',
    task: 'Compute the compound return for the returns array [0.03, 0.04, -0.01, 0.06].',
  },
  shell_command: {
    crew: 'ops-inspection',
    agent: 'inspector',
    role: 'Ops Inspector',
    goal: 'Inspect the runtime environment safely',
    task: 'Show the last 5 commits on the current branch via git log.',
  },
  email: {
    crew: 'notification',
    agent: 'notifier',
    role: 'Notification Agent',
    goal: 'Deliver crew output to stakeholders via email',
    task: "Email the quarterly report to investors@example.com with subject 'Q4 2026 Report'.",
  },
  slack_webhook: {
    crew: 'team-alert',
    agent: 'notifier',
    role: 'Team Notifier',
    goal: 'Broadcast updates to team Slack channels',
    task: "Post today's deployment summary to the #ops channel.",
  },
  jira: {
    crew: 'project-tracking',
    agent: 'tracker',
    role: 'Project Tracker',
    goal: 'Automate the boring parts of ticket management',
    task: 'Create a Bug ticket in the ACME project for the new login regression.',
  },
  notion: {
    crew: 'knowledge-lookup',
    agent: 'reader',
    role: 'Knowledge Reader',
    goal: 'Ground answers in the team Notion knowledge base',
    task: "Pull the content of the 'Onboarding Checklist' page.",
  },
  s3_object: {
    crew: 'storage',
    agent: 'storage',
    role: 'Storage Manager',
    goal: 'Manage generated artifacts in S3',
    task: 'Upload the generated report to s3://reports/2026/q4.md.',
  },
  semantic_search: {
    crew: 'rag-retrieval',
    agent: 'retriever',
    role: 'RAG Retriever',
    goal: 'Find the most relevant passages from the knowledge base',
    task: "Find the top 5 internal document chunks for the query 'onboarding a new employee'.",
  },
  pinecone: {
    crew: 'vector-search',
    agent: 'searcher',
    role: 'Vector Searcher',
    goal: 'Retrieve nearest-neighbor matches for an embedded query',
    task: 'Query the index with the supplied query vector and return the top 10 matches.',
  },
  openapi_call: {
    crew: 'api-gateway',
    agent: 'bot',
    role: 'Integration Bot',
    goal: 'Call any REST API described by an OpenAPI spec',
    task: "Using the GitHub OpenAPI spec, create a new issue in acme/webapp titled 'Broken link on homepage'.",
  },
  image_generate: {
    crew: 'creative-gen',
    agent: 'designer',
    role: 'Creative Generator',
    goal: 'Produce marketing images from campaign briefs',
    task: 'Generate a minimalist hero image for the Q4 climate-tech launch, 1792x1024.',
  },
  ocr: {
    crew: 'document-ocr',
    agent: 'reader',
    role: 'Document Reader',
    goal: 'Extract text from scanned documents',
    task: 'Extract the text from invoices/2026-q4.png using English language data.',
  },
  kafka_produce: {
    crew: 'event-publisher',
    agent: 'publisher',
    role: 'Event Publisher',
    goal: 'Publish workflow events to the enterprise event bus',
    task: "Publish a 'deployment-complete' event to the 'releases' topic with the build metadata as payload.",
  },
  repo_query: {
    crew: 'customer-lookup',
    agent: 'lookup',
    role: 'Customer Lookup Agent',
    goal: 'Query customer data through existing Spring Data repositories',
    task: "Use CustomerRepository.findByStatus('ACTIVE') to list all currently active customers.",
  },
};

function renderYaml(toolId, s) {
  return `# ${s.crew}.yaml
name: ${s.crew}-crew
process: SEQUENTIAL

agents:
  - id: ${s.agent}
    role: ${s.role}
    goal: ${s.goal}
    tools:
      - ${toolId}

tasks:
  - id: ${s.crew}-task
    agent: ${s.agent}
    description: ${s.task}`;
}

// Turn "swarmai-tools/src/main/java/ai/intelliswarm/.../ArxivTool.java"
// into { pkg: "ai.intelliswarm...", className: "ArxivTool" }.
function classInfo(sourcePath) {
  const marker = 'src/main/java/';
  const i = sourcePath.indexOf(marker);
  if (i < 0) return null;
  const rel = sourcePath.slice(i + marker.length).replace(/\.java$/, '');
  const parts = rel.split('/');
  const className = parts.pop();
  return { pkg: parts.join('.'), className };
}

function lowerFirst(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function renderJava(toolId, s, sourcePath) {
  const info = classInfo(sourcePath);
  if (!info) return null;
  const toolVar = lowerFirst(info.className);
  return `import ai.intelliswarm.swarmai.agent.Agent;
import ai.intelliswarm.swarmai.task.Task;
import ai.intelliswarm.swarmai.swarm.Swarm;
import ai.intelliswarm.swarmai.swarm.SwarmOutput;
import ai.intelliswarm.swarmai.process.ProcessType;
import ${info.pkg}.${info.className};
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;

@Autowired ChatClient chatClient;
@Autowired ${info.className} ${toolVar};

Agent ${s.agent} = Agent.builder()
    .role("${s.role}")
    .goal("${s.goal}")
    .chatClient(chatClient)
    .tool(${toolVar})
    .build();

Task ${s.agent}Task = Task.builder()
    .description("${s.task.replace(/"/g, '\\"')}")
    .agent(${s.agent})
    .build();

SwarmOutput result = Swarm.builder()
    .agent(${s.agent})
    .task(${s.agent}Task)
    .process(ProcessType.SEQUENTIAL)
    .build()
    .kickoff();`;
}

const raw = fs.readFileSync(CATALOG, 'utf-8');
const data = JSON.parse(raw);

let updated = 0;
const missing = [];

data.groups.forEach((g) => {
  g.tools.forEach((t) => {
    const s = scenarios[t.id];
    if (!s) {
      missing.push(t.id);
      return;
    }
    t.codeSnippet = renderYaml(t.id, s);
    const java = t.sourcePath ? renderJava(t.id, s, t.sourcePath) : null;
    if (java) {
      t.javaSnippet = java;
    } else {
      delete t.javaSnippet;
    }
    updated += 1;
  });
});

data.groups = data.groups.map((g) => ({
  ...g,
  tools: g.tools.map((t) => {
    const ordered = {};
    const preferred = [
      'id',
      'title',
      'tagline',
      'content',
      'overview',
      'description',
      'example',
      'codeSnippet',
      'javaSnippet',
      'configuration',
      'workflows',
      'sourcePath',
    ];
    preferred.forEach((k) => {
      if (k in t) ordered[k] = t[k];
    });
    Object.keys(t).forEach((k) => {
      if (!(k in ordered)) ordered[k] = t[k];
    });
    return ordered;
  }),
}));

fs.writeFileSync(CATALOG, JSON.stringify(data, null, 2) + '\n');
console.log(`Injected codeSnippet for ${updated} tools.`);
if (missing.length) {
  console.warn(`No codeSnippet defined for: ${missing.join(', ')}`);
  process.exit(1);
}
