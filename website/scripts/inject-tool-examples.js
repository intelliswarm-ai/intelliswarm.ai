#!/usr/bin/env node
/*
 * One-shot helper: add an `example` field to each tool in
 * src/assets/tools/index.json. Safe to re-run — overwrites any existing
 * example with the text defined here.
 *
 * Each example has three optional parts:
 *   prompt  — a natural-language user request that would trigger the tool
 *   call    — a one-line pseudo-code tool invocation showing typical args
 *   result  — a short description of what comes back
 */
const fs = require('fs');
const path = require('path');

const CATALOG = path.join(__dirname, '..', 'src', 'assets', 'tools', 'index.json');

const examples = {
  web_search: {
    prompt: "Find recent news about Tesla's earnings.",
    call: 'web_search(query="Tesla earnings")',
    result: 'a ranked list of the latest articles — title, snippet, and source URL for each.',
  },
  web_scrape: {
    prompt: 'Pull the article text from this blog post.',
    call: 'web_scrape(url="https://example.com/blog/post")',
    result: "the article's title, body text, and any tables — menus, ads, and footer stripped out.",
  },
  browse: {
    prompt: "What is Apple's current stock price on Yahoo Finance?",
    call: 'browse(url="https://finance.yahoo.com/quote/AAPL")',
    result: 'the fully rendered page content, including numbers that Yahoo loads via JavaScript.',
  },
  http_request: {
    prompt: 'Call our internal pricing API for customer 12345.',
    call: 'http_request(method="GET", url="https://api.internal/pricing/12345", authToken="•••")',
    result: "whatever response your API returns — typically a JSON payload the agent can read.",
  },
  arxiv_search: {
    prompt: 'Find recent papers on retrieval-augmented generation.',
    call: 'arxiv_search(query="retrieval-augmented generation", maxResults=10)',
    result: 'a list of preprints with titles, authors, abstracts, and direct PDF links.',
  },
  wikipedia: {
    prompt: 'Give me a short background on the Federal Reserve.',
    call: 'wikipedia(title="Federal Reserve", operation="summary")',
    result: 'a concise encyclopedic summary of the topic.',
  },
  wolfram_alpha: {
    prompt: "What's the derivative of x³ + 2x² − 5x?",
    call: 'wolfram_alpha(query="derivative of x^3 + 2x^2 - 5x")',
    result: '3x² + 4x − 5, with optional step-by-step working.',
  },
  openweathermap: {
    prompt: "What's the 5-day forecast for Zurich?",
    call: 'openweathermap(city="Zurich", forecast=true, units="metric")',
    result: 'current conditions plus a 5-day / 3-hour forecast in metric units.',
  },
  financial_data: {
    prompt: "Show me Apple's latest income statement and key ratios.",
    call: 'financial_data(ticker="AAPL")',
    result: 'a citation-tagged markdown report with revenue, margins, P/E, ROE, and insider activity.',
  },
  sec_filings: {
    prompt: "Pull Microsoft's most recent 10-K filing.",
    call: 'sec_filings(ticker="MSFT", filingType="10-K")',
    result: 'the filing text with risk factors, MD&A, and financial statements extracted.',
  },
  cve_lookup: {
    prompt: 'What do you know about CVE-2021-44228?',
    call: 'cve_lookup(id="CVE-2021-44228")',
    result: 'description of the Log4Shell vulnerability, CVSS 10.0, affected Log4j versions, and references.',
  },
  osv_lookup: {
    prompt: 'Does lodash 4.17.15 have any known vulnerabilities?',
    call: 'osv_lookup(package="lodash", ecosystem="npm", version="4.17.15")',
    result: 'a list of vulnerabilities with IDs, severity, and the version ranges affected.',
  },
  github_create_pr: {
    prompt: 'Open a PR with the Log4j fix we just wrote.',
    call: 'github_create_pr(owner="acme", repo="webapp", title="Bump log4j to 2.17", head="fix/log4j", base="main")',
    result: 'the URL of the newly created Pull Request.',
  },
  calculator: {
    prompt: "What's the P/E ratio if price is 190 and EPS is 6.13?",
    call: 'calculator(expression="190 / 6.13")',
    result: '30.9951…',
  },
  data_analysis: {
    prompt: 'Find the trend in these quarterly revenue numbers.',
    call: 'data_analysis(data="[22, 24, 28, 31]", analysisType="trend")',
    result: 'a summary of the growth trajectory, pace of change, and any outliers.',
  },
  csv_analysis: {
    prompt: 'Describe the columns in sales.csv.',
    call: 'csv_analysis(path="sales.csv", operation="describe")',
    result: 'column names, types, counts, min/max, mean, and standard deviation.',
  },
  json_transform: {
    prompt: "Pull the user's email out of this API response.",
    call: 'json_transform(json="{…}", operation="extract", path="user.email")',
    result: 'the single value at that path — e.g. "jane@example.com".',
  },
  xml_parse: {
    prompt: 'Grab all the article titles from this RSS feed.',
    call: 'xml_parse(xmlContent="…", operation="xpath", xpath="//item/title/text()")',
    result: 'a list of every `<title>` under `<item>` in the feed.',
  },
  report_generator: {
    prompt: 'Turn this analysis into a polished executive summary.',
    call: 'report_generator(content="…", reportType="executive_summary", format="markdown")',
    result: 'a formatted markdown report with sections, headings, and citations.',
  },
  database_query: {
    prompt: 'How many active customers do we have by country?',
    call: 'database_query(query="SELECT country, COUNT(*) FROM customers WHERE status=\'active\' GROUP BY country")',
    result: 'a markdown table with one row per country and its customer count.',
  },
  file_read: {
    prompt: 'Read the first 50 lines of /var/log/app.log.',
    call: 'file_read(path="/var/log/app.log", limit=50)',
    result: 'the first 50 lines of the log file.',
  },
  file_write: {
    prompt: 'Save the generated report to /reports/q4-2026.md.',
    call: 'file_write(path="/reports/q4-2026.md", content="…", mode="overwrite")',
    result: 'confirmation the file was written, with byte count.',
  },
  directory_read: {
    prompt: 'List every Markdown file under the docs folder.',
    call: 'directory_read(path="docs", pattern="*.md", recursive=true)',
    result: 'the list of matching file paths.',
  },
  pdf_read: {
    prompt: 'Extract the first 5 pages of annual-report.pdf.',
    call: 'pdf_read(path="annual-report.pdf", startPage=1, endPage=5)',
    result: 'the plain-text content of those pages plus basic metadata.',
  },
  code_execution: {
    prompt: 'Compute the compound return from these quarterly returns.',
    call: 'code_execution(language="javascript", code="returns.reduce((a,b)=>a*(1+b),1) - 1")',
    result: 'the computed number, returned as text.',
  },
  shell_command: {
    prompt: 'Show me the last 5 commits on this branch.',
    call: 'shell_command(command="git log --oneline -5")',
    result: 'the commit hashes and subject lines from git log.',
  },
  email: {
    prompt: 'Email the quarterly report to our investors list.',
    call: 'email(to="investors@example.com", subject="Q4 2026 Report", body="…")',
    result: 'confirmation of successful delivery with a message ID.',
  },
  slack_webhook: {
    prompt: "Post today's deployment summary to the #ops channel.",
    call: 'slack_webhook(text="Deploy complete: v2.3.1 live in prod")',
    result: 'confirmation that Slack accepted the message.',
  },
  jira: {
    prompt: 'File a bug ticket for the login issue we just found.',
    call: 'jira(operation="create_issue", project="ACME", summary="Login fails for users with apostrophes in email", issueType="Bug")',
    result: "the new ticket's key (e.g. ACME-4217) and URL.",
  },
  notion: {
    prompt: 'Pull our onboarding checklist page.',
    call: 'notion(operation="get_page", pageId="abc123…")',
    result: "the page's title, properties, and block-level text content.",
  },
  s3_object: {
    prompt: 'Upload this generated report to s3://reports/2026/.',
    call: 's3_object(operation="write", bucket="reports", key="2026/q4.md", content="…")',
    result: 'the full s3:// URL of the uploaded object.',
  },
  semantic_search: {
    prompt: 'Find internal docs about how we onboard new hires.',
    call: 'semantic_search(query="onboarding a new employee", topK=5)',
    result: 'the 5 most relevant document chunks with similarity scores.',
  },
  pinecone: {
    prompt: 'Find the 10 product descriptions most similar to this query embedding.',
    call: 'pinecone(operation="query", vector=[0.12, -0.34, …], topK=10)',
    result: 'the 10 nearest-neighbor matches with IDs, scores, and metadata.',
  },
  openapi_call: {
    prompt: 'Create a new issue in our GitHub repo.',
    call: 'openapi_call(spec_url="https://api.github.com/openapi.json", operationId="issues/create", params={…})',
    result: "the response from GitHub's API — the newly created issue.",
  },
  image_generate: {
    prompt: 'Create a minimalist hero image for our climate-tech launch.',
    call: 'image_generate(prompt="Minimalist hero image, climate-tech product, soft gradient", model="dall-e-3", size="1792x1024")',
    result: 'a URL to the generated image (or base64 bytes), plus metadata.',
  },
  ocr: {
    prompt: 'Extract the text from this scanned invoice.',
    call: 'ocr(path="invoices/2026-q4.png", languages="eng")',
    result: 'the plain-text contents of the image, with line breaks preserved.',
  },
  kafka_produce: {
    prompt: "Publish a 'deployment-complete' event to our releases topic.",
    call: 'kafka_produce(topic="releases", key="webapp", value="{\\"version\\":\\"2.3.1\\",\\"env\\":\\"prod\\"}")',
    result: 'a confirmation with the offset and partition the record landed in.',
  },
  repo_query: {
    prompt: 'Find all active customers whose email ends in @acme.com.',
    call: 'repo_query(operation="invoke", repository="CustomerRepository", method="findByEmailEndingAndStatus", args=["@acme.com","ACTIVE"])',
    result: 'the list of matching Customer entities returned by the repository method.',
  },
};

const raw = fs.readFileSync(CATALOG, 'utf-8');
const data = JSON.parse(raw);

let updated = 0;
const missing = [];

data.groups.forEach((g) => {
  g.tools.forEach((t) => {
    const ex = examples[t.id];
    if (ex) {
      t.example = ex;
      updated += 1;
    } else {
      missing.push(t.id);
    }
  });
});

// Preserve a sensible key order per tool
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
console.log(`Injected example for ${updated} tools.`);
if (missing.length) {
  console.warn(`No example defined for: ${missing.join(', ')}`);
  process.exit(1);
}
