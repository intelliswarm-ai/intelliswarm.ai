#!/usr/bin/env node
/*
 * Canonical source for the `overview` and `description` fields across all
 * built-in tools. Supersedes the earlier inject-tool-overviews.js.
 *
 * - overview: plain language, benefit-focused, 2-3 sentences, no jargon.
 *   Answers "what problem does this solve for me?"
 * - description: clearer-technical, 2-4 sentences. Explains operations,
 *   behaviors, and concrete limits that matter in practice.
 *   Answers "how does this behave at runtime?"
 *
 * Safe to re-run — overwrites both fields from this file's definitions.
 */
const fs = require('fs');
const path = require('path');

const CATALOG = path.join(__dirname, '..', 'src', 'assets', 'tools', 'index.json');

const prose = {
  web_search: {
    overview:
      "Looks things up on the web, the way you'd Google a topic. Give it a question, company name, or ticker, and it brings back a short list of the most relevant news and articles — so the agent can work from what's happening right now instead of only what it already knew.",
    description:
      "Routes each query across any configured search providers — AlphaVantage, NewsAPI, Polygon, Finnhub, Google Programmable Search, Bing — and falls back to the next one if the first returns nothing. Results come back ranked with a title, snippet, and source URL per entry, so agents can quote and cite them directly.",
  },
  web_scrape: {
    overview:
      'Visits a web page and pulls out just the readable stuff — the headline, the article, and any tables — while ignoring the menus, ads, and footers. Think of it as handing the agent the clean version of the page.',
    description:
      "Does a plain HTTP fetch on the URL, parses the HTML, and extracts the title, body text, headings, tables, and optionally the link list. Supports a CSS selector so you can target a specific region of the page. It does not run JavaScript — for pages that need it, use the 'browse' tool instead.",
  },
  browse: {
    overview:
      'Some modern websites (like Yahoo Finance or Google Finance) only show their content after the browser runs JavaScript. This tool opens the page in a real browser behind the scenes, waits for it to fully load, and hands the finished content to the agent.',
    description:
      "Launches a headless browser session, navigates to the URL, waits for the page to finish rendering (wait time is configurable), then extracts the visible text and tables as markdown. Slower and heavier than 'web_scrape' but necessary for modern sites whose content only appears after JavaScript runs.",
  },
  http_request: {
    overview:
      "Lets the agent talk to any online service. If there's an API somewhere — your own internal one, or a vendor's — this is the generic phone the agent uses to ask it for data or to send it something.",
    description:
      "Performs a single HTTP request with the specified method (GET/POST/PUT/DELETE/PATCH), custom headers, query parameters, and body. Optionally injects a bearer token for the Authorization header. Returns the raw response body so the agent can parse it with json_transform or xml_parse as needed.",
  },
  arxiv_search: {
    overview:
      "Searches arXiv, the world's largest open library of scientific preprints. Great when you want the agent to pull recent papers on a topic — machine learning, physics, biology — and get back titles, authors, and links to the PDFs.",
    description:
      "Issues a query to the public arXiv API — either free-text across the full corpus or a direct ID lookup (e.g. '2308.12345'). Returns paper titles, authors, abstracts, submission dates, and direct PDF links. No API key is needed; rate limits apply as set by arXiv.",
  },
  wikipedia: {
    overview:
      'Pulls facts straight from Wikipedia. Agents use it to get quick, trustworthy background on people, places, companies, or concepts before going deeper — and it works across dozens of languages.',
    description:
      "Calls the public Wikipedia REST API with one of three operations: 'summary' fetches a page's lead paragraph, 'search' matches keywords to page titles, and 'article' returns the full article text. Supports every Wikipedia language edition (en, de, zh, …).",
  },
  wolfram_alpha: {
    overview:
      'The fact-and-math engine behind services like Siri. Ask it to compute an expression, convert units, or look up a scientific constant and it returns a precise answer instead of the language model guessing.',
    description:
      "Sends the query to the Wolfram Alpha API and returns either a short one-line answer (the 'short answer' endpoint) or the full structured response with multiple solution pods (the 'full results' endpoint). Good for deterministic math, unit conversion, currency rates, and scientific lookups. Requires a free Wolfram AppID.",
  },
  openweathermap: {
    overview:
      "Looks up today's weather and the five-day forecast for any city or coordinate. Useful whenever weather might influence a decision — travel planning, event scheduling, field operations.",
    description:
      "Calls the OpenWeatherMap API to return either current conditions or a 5-day forecast at 3-hour intervals. Accepts a city name or (lat, lon) coordinates and returns temperature, humidity, wind, and a short description. Units can be metric, imperial, or Kelvin-based 'standard'.",
  },
  financial_data: {
    overview:
      'Pulls the numbers behind a public company — revenue, profits, balance-sheet items, key ratios, insider trading — from the Finnhub data service. Give it a ticker like AAPL and it hands the agent a ready-to-read financial summary.',
    description:
      'Queries Finnhub by ticker and aggregates the income statement, balance sheet, cash flow, derived ratios (P/E, P/B, ROE, net and gross margin), and the most recent insider transactions into a single markdown report. Each fact is tagged with its source so downstream report generation can cite them.',
  },
  sec_filings: {
    overview:
      'Reads the official filings that every U.S.-listed company is legally required to publish: annual reports, quarterly reports, major-event disclosures, and more. Gives the agent the same primary-source material that regulators and professional analysts work from.',
    description:
      "Looks up the company's CIK from its ticker, downloads filings from SEC EDGAR, parses the key sections, and returns a structured summary. Covers domestic forms (10-K, 10-Q, 8-K, DEF 14A), foreign-issuer forms (20-F, 6-K), ownership filings (13G, 13D), and registrations (S-1, F-1, 424B).",
  },
  cve_lookup: {
    overview:
      'Checks the worldwide database of known software vulnerabilities. Drop in a CVE ID or a keyword and it returns what the vulnerability is, how severe it is, and which products it affects — essential for security reviews.',
    description:
      'Calls the NIST NVD 2.0 API with either a specific CVE ID or a free-text keyword. Returns the CVE ID, description, severity classification, CVSS v3 score, and the list of affected products (CPE matches). Results come straight from the authoritative database — no third-party enrichment.',
  },
  osv_lookup: {
    overview:
      'Checks whether a specific open-source library has any known security problems — for npm (JavaScript), PyPI (Python), Maven (Java), or Go packages. Useful right before upgrading a dependency or auditing a project.',
    description:
      'Queries the OSV.dev API with a package name, its ecosystem (npm, PyPI, Maven, Go), and optionally a specific version. Returns the list of matching vulnerabilities with their OSV IDs, affected version ranges, severity, and references. Passing a version narrows the result to issues that hit that exact build.',
  },
  github_create_pr: {
    overview:
      'Lets the agent open a Pull Request on GitHub. This is how self-fixing agents (say, one that patches a vulnerability) put their proposed change in front of a human reviewer, rather than silently editing code.',
    description:
      "Posts a 'Create pull request' request to the GitHub REST API. You supply owner, repo, title, body, head branch, and base branch; the tool returns the URL of the new PR. Requires a GitHub token with 'repo' write scope; flagged DANGEROUS in the framework's permission system because it modifies an external system.",
  },
  calculator: {
    overview:
      "A reliable math evaluator. Language models are famously shaky at arithmetic, so this tool does the actual sums — ratios, growth rates, percentages — and returns the exact number.",
    description:
      'Parses and evaluates arithmetic expressions (addition, subtraction, multiplication, division, powers, parentheses) and returns the exact numeric result. Intended for day-to-day financial math — ratios, growth rates, percentages. For calculus or symbolic algebra, use Wolfram Alpha instead.',
  },
  data_analysis: {
    overview:
      "Takes raw numbers or tables and spots the patterns inside — trends, outliers, comparisons. Typically the middle step of a workflow: gather data first, analyse it here, then write the findings up with the report generator.",
    description:
      "Feeds the supplied dataset to an analysis routine selected by the 'analysisType' parameter ('trend', 'outliers', 'comparison', 'summary') and returns a structured finding including the direction of the trend, notable data points, and a short narrative. Designed to sit between raw data ingestion and final report generation.",
  },
  csv_analysis: {
    overview:
      'Reads a spreadsheet file and lets the agent peek inside without needing a full data-science toolkit. It can describe the columns, compute basic statistics, preview rows, or filter them.',
    description:
      "Loads a CSV or TSV file (from a path or inline content) and applies one of five operations: 'describe' returns column schema and summary stats; 'stats' computes min/max/mean/stddev on numeric columns; 'head' previews the first N rows; 'filter' selects rows matching a column/value; 'count' returns the total row count.",
  },
  json_transform: {
    overview:
      "Most online services return data in a format called JSON. This tool lets the agent grab a specific field out of that reply, reshape it, or convert it to a spreadsheet — the plumbing that chains steps of a workflow together.",
    description:
      "Accepts a JSON payload and applies one of four operations: 'extract' pulls a single value at a dot-notation path (e.g. 'user.email'); 'query' returns all values matching a path; 'flatten' converts a nested object into a flat key-value map; 'to_csv' converts a JSON array of objects into a CSV string.",
  },
  xml_parse: {
    overview:
      'Reads XML, an older data format still used by things like news feeds, enterprise APIs, and regulatory filings. Pulls out specific pieces so the agent can work with them just like any other data.',
    description:
      "Accepts an XML document and applies one of three operations: 'xpath' evaluates an XPath 1.0 expression and returns matching values; 'elements' lists every element name and its path; 'text' extracts all visible text, stripping tags. Works on RSS/Atom feeds, SOAP responses, sitemaps, and regulatory XML.",
  },
  report_generator: {
    overview:
      "Takes everything the agents have gathered and analysed and turns it into a polished report with clear sections and citations. Usually the final step of a workflow — the deliverable a human actually reads.",
    description:
      "Takes raw findings plus a 'reportType' template ('executive_summary', 'due_diligence', 'research_report', …) and produces a structured document with sections, headings, and preserved citations from upstream tools. Output format can be markdown, HTML, or PDF.",
  },
  database_query: {
    overview:
      'Lets the agent look things up in your company database — but only to read, never to change anything. A safe way to give agents access to customer records, sales data, or any structured information you already store.',
    description:
      "Executes the supplied SQL against the Spring JDBC DataSource configured in your application. Allows SELECT only — any statement containing INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, GRANT, REVOKE, EXEC, CALL, or MERGE is rejected before it runs. Auto-appends 'LIMIT 50' when missing, with a hard ceiling of 200 rows.",
  },
  file_read: {
    overview:
      "Opens a file on the computer and reads what's inside. Supports plain text, JSON, CSV, YAML, and XML files — so agents can pick up configuration, logs, or work saved from an earlier step.",
    description:
      "Opens the file at the supplied path and returns its contents as text, detecting the format from the extension (txt, json, csv, yaml, xml) for appropriate handling. Accepts optional 'offset' and 'limit' parameters to read just a line range — useful for large log files that would otherwise blow through the context window.",
  },
  file_write: {
    overview:
      "Saves text to a file on the computer. Agents use it to keep a record of what they produced: a report, a generated piece of code, or notes for the next stage.",
    description:
      "Writes the supplied content to the file at the given path. Three modes are supported: 'overwrite' replaces any existing file; 'append' adds to the end of an existing file; 'create' fails if the file already exists. Parent directories are created automatically.",
  },
  directory_read: {
    overview:
      "Lists the files inside a folder. Useful when the agent needs to discover what's available before reading anything, or scan a whole project for specific filenames.",
    description:
      "Lists the contents of a directory, optionally filtered by a glob pattern ('*.md', '**/*.java'). Setting 'recursive' to true walks the subtree as well. A 'maxResults' cap prevents oversized responses; the default is 500 entries.",
  },
  pdf_read: {
    overview:
      "Reads PDF documents — annual reports, research papers, legal contracts — and extracts the text inside so the agent can summarise, search, or quote it. Works even for long multi-page documents.",
    description:
      "Opens the PDF at the supplied path using Apache PDFBox and extracts the text and basic metadata. Accepts optional 'startPage' and 'endPage' parameters to read just a range — useful for large documents that would otherwise blow through the context window.",
  },
  code_execution: {
    overview:
      "Runs a small snippet of JavaScript or shell code inside a safe sandbox. Handy when the agent needs to do a quick calculation or transform some data that's too complex for the calculator but too small for a full script.",
    description:
      'Executes the supplied snippet in either GraalVM JavaScript or /bin/sh, with a configurable timeout (default 30s, hard cap 60s). Dangerous commands and writes to system directories are blocked. Returns stdout combined with any return value from JavaScript execution.',
  },
  shell_command: {
    overview:
      "Lets the agent run a limited, pre-approved set of safe commands to inspect the computer it's running on — things like listing files or checking git status. Nothing that could change your system, just looking around.",
    description:
      "Runs the supplied command against a whitelist of read-only utilities — ls, cat, grep, git (read), ps, df, du, head, tail, wc, find, echo, pwd, env, date — with a configurable timeout (default 120s, hard cap 300s). Pipes and output redirection ('>', '>>') are blocked to prevent arbitrary file writes.",
  },
  email: {
    overview:
      "Sends an email from the agent. Use it to notify someone when a long-running task finishes, to deliver a generated report, or to flag an issue that needs a human's attention.",
    description:
      "Sends an email through the SMTP server configured via Spring Mail. Accepts 'to', 'subject', and 'body' (plus optional 'cc', 'bcc', 'attachments') and returns a confirmation with the message ID. Uses whatever SMTP credentials your Spring Boot application provides.",
  },
  slack_webhook: {
    overview:
      'Posts a message into a Slack channel. The fastest way for an agent to tell your team something important — an alert, a completed deployment, or a summary of what it just did.',
    description:
      "Posts the supplied message text (Slack-flavored markdown accepted) to a Slack Incoming Webhook URL. Optional 'channel' and 'username' overrides let you redirect without changing the webhook. Validates that the URL starts with https://hooks.slack.com/ and caps message length at 40,000 characters.",
  },
  jira: {
    overview:
      "Works with your Jira tickets. Agents can search the backlog, read a specific ticket, open new ones, or add comments — perfect for automating the small-but-tedious parts of project tracking.",
    description:
      "Talks to Jira Cloud via its REST API v3 using Basic auth (email + API token). Four operations are supported: 'search_issues' runs a JQL query; 'get_issue' fetches one ticket with its description and comments; 'create_issue' opens a new ticket with project, summary, issue type, and optional description; 'add_comment' appends a comment to an existing ticket.",
  },
  notion: {
    overview:
      "Reads your team's Notion pages and databases. Agents can look up documentation, runbooks, or project notes your team already maintains — so answers come from your own source of truth, not a generic guess.",
    description:
      "Talks to the Notion API with an internal-integration token. Three operations are supported: 'search' matches keywords across the workspace's pages and databases; 'get_page' returns the page metadata and rendered block text for one page ID; 'query_database' runs a filter/sort against a database ID. The integration must be explicitly shared with each target page or database in Notion's UI.",
  },
  s3_object: {
    overview:
      "Works with files stored in Amazon S3, a very common place companies keep logs, reports, and shared data. Agents can list what's there, read small files, upload results, or clean up old items.",
    description:
      "Wraps the AWS SDK S3 client with five operations: 'list' enumerates objects under a prefix; 'read' returns a text object's body (capped at 1 MiB to protect the agent's context); 'write' uploads a text object; 'head' returns metadata without transferring the body; 'delete' removes an object. Uses the default AWS credential chain so it works from env vars, profiles, or IAM roles.",
  },
  semantic_search: {
    overview:
      "Finds documents by meaning, not by matching exact words — the search that powers modern AI assistants. Ask for 'how to onboard a new hire' and it can surface the onboarding guide even if that exact phrase isn't in the title.",
    description:
      'Wraps whatever Spring AI VectorStore bean is configured in your application — Chroma, PGVector, Weaviate, Redis, Milvus, or Qdrant — and performs a natural-language similarity search. The query string is embedded on the fly and matched against stored vectors. Returns up to 20 top-K chunks with similarity scores; an optional threshold filters out weak matches.',
  },
  pinecone: {
    overview:
      "Pinecone is a managed vector database — the storage layer behind most 'ask my own documents' AI assistants. Your content gets pre-processed into numeric fingerprints (embeddings) once; this tool lets the agent instantly find the fingerprints most similar to any new question, so it can answer using your data instead of guessing.",
    description:
      "Four operations are exposed. 'query' runs a nearest-neighbor search and returns the most similar vectors with their metadata. 'upsert' writes new vectors (up to 100 per call). 'delete' removes vectors by ID (up to 1000 per call). 'stats' returns the index's total vector count and per-namespace breakdown. Embeddings must be generated elsewhere — this tool only manages stored vectors. Top-K is capped at 100 per query.",
  },
  openapi_call: {
    overview:
      "If an API publishes a spec (a menu of what it can do), this tool reads the menu and can call any operation on it. One tool that becomes whatever API your agent needs to reach — no custom integration code required.",
    description:
      "Loads an OpenAPI 3.x spec from a URL or inline string (parsed once and cached). Two operations: 'list_operations' returns every operationId with its HTTP method, path, and parameter schema; 'invoke' calls a specific operationId with path/query/header/body parameters and an optional bearer token. Flagged DANGEROUS because any endpoint in the spec becomes reachable.",
  },
  image_generate: {
    overview:
      "Turns a text description into an actual image, using OpenAI's DALL·E models. Tell it what you want — 'a minimalist product hero for a climate-tech launch' — and it renders the picture for the agent to deliver or hand off to another step.",
    description:
      "Calls the OpenAI Images API to generate images from a text prompt. Supports DALL-E 2, DALL-E 3, and gpt-image-1 with size, quality, style, and count options. Returns either a hosted URL or base64 bytes, and can optionally save the result to a local file path.",
  },
  ocr: {
    overview:
      "Reads the words out of an image. Hand it a photo, scanned document, or screenshot and it returns the text inside — useful for invoices, receipts, or any document that isn't already digital text.",
    description:
      "Uses Tesseract (via Tess4J) to extract text from PNG, JPEG, TIFF, BMP, or GIF images. Accepts a local path, a URL, or inline base64, and supports multi-language models such as 'eng+deu'. Requires the Tesseract binaries and language data files on the host system.",
  },
  kafka_produce: {
    overview:
      "Sends a message onto Kafka, the widely-used event bus that many companies run as the backbone of their systems. Lets agents publish events — decisions, alerts, state changes — so downstream services can react in real time.",
    description:
      "Publishes a string-valued message to a Kafka topic with optional key, headers, and partition. Accepts extra producer config (SASL, SSL, acks, compression) and enforces idempotent delivery with configurable retry and timeout controls.",
  },
  repo_query: {
    overview:
      "Lets the agent call your existing Spring Data repositories directly — the methods your team already wrote (findByEmail, countActive, …) become tools the agent can invoke. Write methods are refused unless you explicitly allow them.",
    description:
      "Reflectively exposes every Spring Data Repository bean in the application context (JpaRepository, CrudRepository, etc.) as an agent-callable tool. Three operations: 'list_repositories' enumerates beans; 'list_methods' shows each repository's query methods; 'invoke' calls one with JSON-coerced arguments. Write methods (save/delete/update) are refused unless allow_writes=true.",
  },
};

const raw = fs.readFileSync(CATALOG, 'utf-8');
const data = JSON.parse(raw);

let updated = 0;
const missing = [];

data.groups.forEach((g) => {
  g.tools.forEach((t) => {
    const p = prose[t.id];
    if (p) {
      t.overview = p.overview;
      t.description = p.description;
      updated += 1;
    } else {
      missing.push(t.id);
    }
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
console.log(`Rewrote overview + description for ${updated} tools.`);
if (missing.length) {
  console.warn(`No prose defined for: ${missing.join(', ')}`);
  process.exit(1);
}
