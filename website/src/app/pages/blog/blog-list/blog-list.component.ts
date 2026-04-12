import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlogService, BlogPost } from '../../../services/blog.service';
import { SeoService } from '../../../services/seo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit, OnDestroy {
  allPosts: BlogPost[] = [];
  filteredPosts: BlogPost[] = [];
  allTags: string[] = [];
  activeTag = 'all';
  loading = true;
  error = '';

  private sub!: Subscription;

  constructor(
    private blogService: BlogService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Blog',
      description:
        'Engineering insights, architecture decisions, and framework updates from the IntelliSwarm.ai team.',
      type: 'website',
      keywords: 'AI, multi-agent, Java, Spring Boot, engineering blog, IntelliSwarm',
    });

    this.sub = this.blogService.getPosts().subscribe({
      next: posts => {
        this.allPosts = posts;
        this.filteredPosts = posts;
        const tagSet = new Set<string>();
        posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
        this.allTags = Array.from(tagSet).sort();
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load blog posts. Please try again later.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  filterByTag(tag: string): void {
    this.activeTag = tag;
    this.filteredPosts =
      tag === 'all'
        ? this.allPosts
        : this.allPosts.filter(p => p.tags.includes(tag));
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      engineering: 'engineering',
      announcement: 'campaign',
      tutorial: 'school',
      release: 'new_releases',
      architecture: 'architecture',
      general: 'article',
    };
    return icons[category] || 'article';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
