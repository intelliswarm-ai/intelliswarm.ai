import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;        // 'website' | 'article'
  author?: string;
  publishedTime?: string;
  section?: string;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteTitle = 'IntelliSwarm.AI';
  private readonly siteUrl = 'https://intelliswarm.ai';
  private readonly defaultDescription =
    'Enterprise-grade AI agent orchestration for Java. Self-improving multi-agent workflows with 7 process types, YAML DSL, and 24 built-in tools.';
  private readonly defaultImage = `${this.siteUrl}/assets/img/IntelliSwarm_AI_Logo.jpg`;

  constructor(
    private meta: Meta,
    private titleService: Title,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  update(config: SeoConfig): void {
    const title = config.title
      ? `${config.title} | ${this.siteTitle}`
      : this.siteTitle;
    const description = config.description || this.defaultDescription;
    const image = config.image || this.defaultImage;
    const url = config.url || `${this.siteUrl}${this.router.url}`;
    const type = config.type || 'website';

    // Page title
    this.titleService.setTitle(title);

    // Standard meta
    this.setTag('description', description);
    if (config.keywords) {
      this.setTag('keywords', config.keywords);
    }
    this.setTag('author', config.author || this.siteTitle);

    // Open Graph (LinkedIn, Facebook)
    this.setProperty('og:title', config.title || this.siteTitle);
    this.setProperty('og:description', description);
    this.setProperty('og:image', image);
    this.setProperty('og:url', url);
    this.setProperty('og:type', type);
    this.setProperty('og:site_name', this.siteTitle);

    // Twitter Card
    this.setTag('twitter:card', 'summary_large_image');
    this.setTag('twitter:title', config.title || this.siteTitle);
    this.setTag('twitter:description', description);
    this.setTag('twitter:image', image);

    // Article-specific (blog posts)
    if (type === 'article') {
      if (config.publishedTime) {
        this.setProperty('article:published_time', config.publishedTime);
      }
      if (config.author) {
        this.setProperty('article:author', config.author);
      }
      if (config.section) {
        this.setProperty('article:section', config.section);
      }
      if (config.tags) {
        // Remove old article:tag entries
        const existing = this.meta.getTags('property="article:tag"');
        existing.forEach(el => this.meta.removeTagElement(el));
        config.tags.forEach(tag => {
          this.meta.addTag({ property: 'article:tag', content: tag });
        });
      }
    }

    // Canonical URL
    this.setCanonicalUrl(url);
  }

  resetToDefaults(): void {
    this.update({});
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private setTag(name: string, content: string): void {
    const existing = this.meta.getTag(`name="${name}"`);
    if (existing) {
      this.meta.updateTag({ name, content });
    } else {
      this.meta.addTag({ name, content });
    }
  }

  private setProperty(property: string, content: string): void {
    const existing = this.meta.getTag(`property="${property}"`);
    if (existing) {
      this.meta.updateTag({ property, content });
    } else {
      this.meta.addTag({ property, content });
    }
  }

  private setCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
