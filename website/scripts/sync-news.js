cre#!/usr/bin/env node
/**
 * Copies backend/data/news.json into the Angular build so /news is served
 * as a static asset (no Lambda, no DynamoDB). Run before `ng build`.
 *
 * Source of truth: ../backend/data/news.json (committed).
 * Output: src/assets/data/news.json (gitignored — regenerated each build).
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', '..', 'backend', 'data', 'news.json');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'assets', 'data');
const OUTPUT = path.join(OUTPUT_DIR, 'news.json');

if (!fs.existsSync(SOURCE)) {
  console.error(`sync-news: source not found at ${SOURCE}`);
  process.exit(1);
}

const raw = fs.readFileSync(SOURCE, 'utf8');
const news = JSON.parse(raw);
if (!Array.isArray(news)) {
  console.error('sync-news: source must be a JSON array of news items');
  process.exit(1);
}

news.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify({ news, total: news.length }, null, 2));

console.log(`sync-news: wrote ${news.length} items to ${path.relative(process.cwd(), OUTPUT)}`);
