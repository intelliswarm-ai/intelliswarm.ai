import { Component, OnInit } from '@angular/core';

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
}
