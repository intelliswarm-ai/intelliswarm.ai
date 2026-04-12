import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
  summary: string;
  coverImage: string;
  readingTime: number;
}

export interface BlogPostDetail extends BlogPost {
  content: string;  // pre-rendered HTML
}

interface BlogIndex {
  posts: BlogPost[];
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private index$: Observable<BlogPost[]> | null = null;

  constructor(private http: HttpClient) {}

  getPosts(): Observable<BlogPost[]> {
    if (!this.index$) {
      this.index$ = this.http
        .get<BlogIndex>('/assets/blog/blog-index.json')
        .pipe(
          map(data => data.posts),
          shareReplay(1)
        );
    }
    return this.index$;
  }

  getPost(slug: string): Observable<BlogPostDetail> {
    return this.http.get<BlogPostDetail>(`/assets/blog/data/${slug}.json`);
  }

  getAllTags(): Observable<string[]> {
    return this.getPosts().pipe(
      map(posts => {
        const tagSet = new Set<string>();
        posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
      })
    );
  }

  getAllCategories(): Observable<string[]> {
    return this.getPosts().pipe(
      map(posts => {
        const catSet = new Set<string>();
        posts.forEach(p => catSet.add(p.category));
        return Array.from(catSet).sort();
      })
    );
  }
}
