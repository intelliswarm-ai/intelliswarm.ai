import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface NewsItem {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  link: string;
}

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit {
  allNews: NewsItem[] = [];
  filteredNews: NewsItem[] = [];
  categories: string[] = [];
  activeCategory: string = 'all';
  expandedId: string | null = null;
  loading: boolean = true;
  error: string = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.fetchNews();
  }

  async fetchNews(): Promise<void> {
    try {
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to load news');
      const data = await response.json();
      this.allNews = data.news;
      this.filteredNews = this.allNews;
      this.categories = [...new Set(this.allNews.map((n) => n.category))];
      this.loading = false;
    } catch {
      this.error = 'Unable to load news. Please try again later.';
      this.loading = false;
    }
  }

  filterByCategory(category: string): void {
    this.activeCategory = category;
    this.filteredNews =
      category === 'all'
        ? this.allNews
        : this.allNews.filter((n) => n.category === category);
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      release: 'Release',
      feature: 'Feature',
      milestone: 'Milestone',
      announcement: 'Announcement',
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      release: 'new_releases',
      feature: 'auto_awesome',
      milestone: 'flag',
      announcement: 'campaign',
    };
    return icons[category] || 'article';
  }

  isInternal(link: string): boolean {
    return link.startsWith('/');
  }

  renderContent(content: string): SafeHtml {
    const html = content
      .split('\n\n')
      .map(block => {
        // Check if block is a list (lines starting with -)
        const lines = block.split('\n');
        if (lines.every(l => l.trimStart().startsWith('- '))) {
          const items = lines.map(l => `<li>${this.inlineMarkdown(l.replace(/^\s*-\s*/, ''))}</li>`).join('');
          return `<ul>${items}</ul>`;
        }
        // Check if block contains mixed content with list items
        if (lines.some(l => l.trimStart().startsWith('- '))) {
          let html = '';
          let listItems: string[] = [];
          for (const line of lines) {
            if (line.trimStart().startsWith('- ')) {
              listItems.push(`<li>${this.inlineMarkdown(line.replace(/^\s*-\s*/, ''))}</li>`);
            } else {
              if (listItems.length) {
                html += `<ul>${listItems.join('')}</ul>`;
                listItems = [];
              }
              html += `<p>${this.inlineMarkdown(line)}</p>`;
            }
          }
          if (listItems.length) html += `<ul>${listItems.join('')}</ul>`;
          return html;
        }
        // Numbered list (lines starting with digits)
        if (lines.every(l => /^\d+\.\s/.test(l.trimStart()))) {
          const items = lines.map(l => `<li>${this.inlineMarkdown(l.replace(/^\s*\d+\.\s*/, ''))}</li>`).join('');
          return `<ol>${items}</ol>`;
        }
        return `<p>${this.inlineMarkdown(block)}</p>`;
      })
      .join('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private inlineMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }
}
