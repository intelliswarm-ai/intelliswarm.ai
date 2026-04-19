import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { DemoMeta, DemosIndex } from '../models/demo-meta';
import { DemoTrace, TraceSide } from '../models/demo-trace';

const BASE = '/assets/demos';

@Injectable({ providedIn: 'root' })
export class DemosService {
  private indexCache$?: Observable<DemosIndex>;
  private metaCache = new Map<string, Observable<DemoMeta>>();
  private traceCache = new Map<string, Observable<DemoTrace>>();

  constructor(private http: HttpClient) {}

  loadIndex(): Observable<DemosIndex> {
    if (!this.indexCache$) {
      this.indexCache$ = this.http
        .get<DemosIndex>(`${BASE}/index.json`)
        .pipe(shareReplay(1));
    }
    return this.indexCache$;
  }

  loadAllMeta(): Observable<DemoMeta[]> {
    return this.loadIndex().pipe(
      switchMap((idx) =>
        idx.demos.length ? forkJoin(idx.demos.map((s) => this.loadMeta(s))) : of([])
      )
    );
  }

  loadMeta(slug: string): Observable<DemoMeta> {
    if (!this.metaCache.has(slug)) {
      this.metaCache.set(
        slug,
        this.http
          .get<DemoMeta>(`${BASE}/${slug}/meta.json`)
          .pipe(shareReplay(1))
      );
    }
    return this.metaCache.get(slug)!;
  }

  loadTrace(slug: string, model: string, side: TraceSide, frameworkVersion: string): Observable<DemoTrace> {
    const key = `${slug}/${model}/${frameworkVersion}/${side}`;
    if (!this.traceCache.has(key)) {
      // Swarm side uses the example slug as the filename (e.g. error-handling-and-recovery.json).
      // Baseline side is always baseline.json — unambiguous as the right-panel companion.
      const fileName = side === 'swarm' ? `${slug}.json` : 'baseline.json';
      this.traceCache.set(
        key,
        this.http
          .get<DemoTrace>(`${BASE}/${slug}/runs/${model}/${frameworkVersion}/${fileName}`)
          .pipe(shareReplay(1))
      );
    }
    return this.traceCache.get(key)!;
  }

  loadPrompt(slug: string): Observable<string> {
    return this.http
      .get(`${BASE}/${slug}/prompt.md`, { responseType: 'text' })
      .pipe(catchError(() => of('')));
  }

  loadWorkflow(slug: string): Observable<string> {
    return this.http
      .get(`${BASE}/${slug}/workflow.yaml`, { responseType: 'text' })
      .pipe(catchError(() => of('')));
  }

  loadAnalysis(slug: string): Observable<string> {
    return this.http
      .get(`${BASE}/${slug}/analysis.md`, { responseType: 'text' })
      .pipe(catchError(() => of('')));
  }

  loadDetail(slug: string, model: string, frameworkVersion: string) {
    return forkJoin({
      meta: this.loadMeta(slug),
      prompt: this.loadPrompt(slug),
      workflow: this.loadWorkflow(slug),
      analysis: this.loadAnalysis(slug),
      swarm: this.loadTrace(slug, model, 'swarm', frameworkVersion),
      baseline: this.loadTrace(slug, model, 'baseline', frameworkVersion),
    });
  }
}
