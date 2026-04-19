#!/usr/bin/env node

/**
 * Prerender Route Generator
 *
 * Emits website/prerender-routes.txt — the explicit route list consumed by
 * Angular's prerenderer. Parameterized routes (/:slug) won't be discovered
 * automatically, and some static routes aren't reached by the crawler, so
 * both are listed here to guarantee each gets its own static HTML with the
 * right <title> / Open Graph tags (critical for social share previews).
 *
 * Depends on generate-blog-index.js having written blog-index.json first.
 *
 * Usage:  node scripts/generate-prerender-routes.js
 */

const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(WEBSITE_DIR, 'src', 'assets');
const ROUTES_FILE = path.join(WEBSITE_DIR, 'prerender-routes.txt');

// Static routes that must be individually prerendered so social crawlers
// (LinkedIn, X/Twitter, Slack, FB) receive per-page <title>/<meta> instead
// of the SPA fallback.
const STATIC_ROUTES = [
  '/home',
  '/blog',
  '/demos',
  '/news',
  '/docs',
  '/examples',
  '/contribute',
];

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function blogRoutes() {
  const idx = readJsonSafe(path.join(ASSETS_DIR, 'blog', 'blog-index.json'));
  if (!idx || !Array.isArray(idx.posts)) return [];
  return idx.posts.map(p => `/blog/${p.slug}`);
}

function demoRoutes() {
  const idx = readJsonSafe(path.join(ASSETS_DIR, 'demos', 'index.json'));
  if (!idx || !Array.isArray(idx.demos)) return [];
  return idx.demos.map(slug => `/demos/${slug}`);
}

function main() {
  const routes = [
    ...STATIC_ROUTES,
    ...blogRoutes(),
    ...demoRoutes(),
  ];

  // De-dupe while preserving order
  const seen = new Set();
  const unique = routes.filter(r => (seen.has(r) ? false : (seen.add(r), true)));

  fs.writeFileSync(ROUTES_FILE, unique.join('\n') + '\n');
  console.log(`Prerender routes written: ${unique.length} route(s) -> ${path.relative(WEBSITE_DIR, ROUTES_FILE)}`);
  unique.forEach(r => console.log(`  + ${r}`));
}

main();
