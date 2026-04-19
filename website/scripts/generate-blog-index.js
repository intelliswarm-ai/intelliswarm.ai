#!/usr/bin/env node

/**
 * Blog Index Generator
 *
 * Reads Markdown files with YAML frontmatter from src/assets/blog/posts/
 * and generates:
 *   - src/assets/blog/blog-index.json  (metadata for the list page)
 *   - src/assets/blog/data/{slug}.json (full post with HTML content)
 *
 * Usage:  node scripts/generate-blog-index.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'src', 'assets', 'blog', 'posts');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'blog');
const DATA_DIR = path.join(OUTPUT_DIR, 'data');

// ── Frontmatter parser ────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Array: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    meta[key] = value;
  });

  return { meta, body: match[2].trim() };
}

// ── Markdown → HTML (lightweight, zero-dependency) ────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="blog-img">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function markdownToHtml(md) {
  // Normalise line endings
  md = md.replace(/\r\n/g, '\n');

  // Extract fenced code blocks first (protect from other transforms)
  const codeBlocks = [];
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(
      `<pre class="code-block"><code class="language-${lang || 'text'}">${escapeHtml(code.trimEnd())}</code></pre>`
    );
    return placeholder;
  });

  // Ensure headings are always isolated into their own block
  // 1. Add blank line before headings that follow other content
  md = md.replace(/\n(#{1,6}\s)/g, '\n\n$1');
  // 2. Add blank line after heading lines that have body text following
  md = md.replace(/^(#{1,6}\s+.+)\n(?!#|\n)/gm, '$1\n\n');

  const blocks = md.split(/\n{2,}/);
  const htmlBlocks = blocks.map(block => {
    block = block.trim();
    if (!block) return '';

    // Code block placeholder
    if (block.startsWith('%%CODEBLOCK_')) return block;

    // Heading
    const headingMatch = block.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return `<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(block)) return '<hr>';

    // Blockquote
    if (block.startsWith('> ')) {
      const inner = block.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n');
      return `<blockquote>${inlineMarkdown(inner)}</blockquote>`;
    }

    const lines = block.split('\n');

    // Table (lines containing | pipes, with a separator row of |---|)
    if (lines.length >= 2 && lines[0].includes('|') && lines[1].match(/^\|[\s\-:|]+\|$/)) {
      const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
      const alignRow = lines[1].split('|').map(c => c.trim()).filter(Boolean);
      const aligns = alignRow.map(c => {
        if (c.startsWith(':') && c.endsWith(':')) return 'center';
        if (c.endsWith(':')) return 'right';
        return 'left';
      });
      const thead = '<thead><tr>' + headerCells.map((c, i) =>
        `<th style="text-align:${aligns[i] || 'left'}">${inlineMarkdown(c)}</th>`
      ).join('') + '</tr></thead>';
      const bodyRows = lines.slice(2).map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        return '<tr>' + cells.map((c, i) =>
          `<td style="text-align:${aligns[i] || 'left'}">${inlineMarkdown(c)}</td>`
        ).join('') + '</tr>';
      }).join('\n');
      return `<table>${thead}<tbody>${bodyRows}</tbody></table>`;
    }

    // Unordered list
    if (lines.every(l => /^\s*[-*]\s/.test(l))) {
      const items = lines.map(l => `<li>${inlineMarkdown(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('\n');
      return `<ul>${items}</ul>`;
    }

    // Ordered list
    if (lines.every(l => /^\s*\d+\.\s/.test(l))) {
      const items = lines.map(l => `<li>${inlineMarkdown(l.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('\n');
      return `<ol>${items}</ol>`;
    }

    // Paragraph
    return `<p>${inlineMarkdown(block.replace(/\n/g, '<br>'))}</p>`;
  });

  let html = htmlBlocks.join('\n');

  // Restore code blocks
  codeBlocks.forEach((cb, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, cb);
  });

  return html;
}

// ── Main ──────────────────────────────────────────────────────────────
function main() {
  // Ensure output directories exist
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'blog-index.json'), JSON.stringify({ posts: [] }, null, 2));
    console.log('No posts found. Created empty blog-index.json');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'blog-index.json'), JSON.stringify({ posts: [] }, null, 2));
    console.log('No .md files found. Created empty blog-index.json');
    return;
  }

  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const htmlContent = markdownToHtml(body);

    const wordCount = body.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const post = {
      slug: meta.slug || file.replace(/\.md$/, ''),
      title: meta.title || 'Untitled',
      date: meta.date || new Date().toISOString().split('T')[0],
      author: meta.author || 'IntelliSwarm Team',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      category: meta.category || 'general',
      summary: meta.summary || '',
      coverImage: meta.coverImage || '',
      readingTime,
    };

    // Write individual post JSON (with HTML content)
    fs.writeFileSync(
      path.join(DATA_DIR, `${post.slug}.json`),
      JSON.stringify({ ...post, content: htmlContent }, null, 2)
    );

    posts.push(post);
    console.log(`  + ${post.slug} (${readingTime} min read)`);
  }

  // Sort newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'blog-index.json'),
    JSON.stringify({ posts }, null, 2)
  );

  console.log(`Blog index generated: ${posts.length} post(s)`);
}

main();
