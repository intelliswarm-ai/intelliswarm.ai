import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { BlogService, BlogPostDetail } from '../../../services/blog.service';
import { SeoService } from '../../../services/seo.service';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss'],
})
export class BlogPostComponent implements OnInit, OnDestroy {
  post: BlogPostDetail | null = null;
  safeContent: SafeHtml = '';
  loading = true;
  error = '';
  shareUrl = '';
  copied = false;

  private sub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private seo: SeoService,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap
      .pipe(switchMap(params => {
        const slug = params.get('slug') || '';
        this.loading = true;
        this.error = '';
        return this.blogService.getPost(slug);
      }))
      .subscribe({
        next: post => {
          this.post = post;
          this.safeContent = this.sanitizer.bypassSecurityTrustHtml(post.content);
          this.loading = false;

          // SEO
          this.seo.update({
            title: post.title,
            description: post.summary,
            type: 'article',
            author: post.author,
            publishedTime: post.date,
            section: post.category,
            tags: post.tags,
            image: post.coverImage || undefined,
            keywords: post.tags.join(', '),
          });

          // Share URL
          if (isPlatformBrowser(this.platformId)) {
            this.shareUrl = window.location.href;
          }
        },
        error: () => {
          this.error = 'Blog post not found.';
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  shareLinkedIn(): void {
    const url = encodeURIComponent(this.shareUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'noopener,noreferrer,width=600,height=500'
    );
  }

  shareTwitter(): void {
    const url = encodeURIComponent(this.shareUrl);
    const text = encodeURIComponent(this.post?.title || '');
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400'
    );
  }

  copyLink(): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(this.shareUrl).then(() => {
        this.copied = true;
        setTimeout(() => (this.copied = false), 2000);
      });
    }
  }
}
