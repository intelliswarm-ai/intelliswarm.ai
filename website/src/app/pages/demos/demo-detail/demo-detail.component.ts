import {
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { DemosService } from '../services/demos.service';
import { DemoMeta } from '../models/demo-meta';
import { DemoTrace } from '../models/demo-trace';
import { SeoService } from '../../../services/seo.service';

const TICK_MS = 32; // ~30fps — snappy enough, half the CD cost of 60fps
const FINAL_REVEAL_MS = 2500;

@Component({
  selector: 'app-demo-detail',
  templateUrl: './demo-detail.component.html',
  styleUrls: ['./demo-detail.component.scss'],
})
export class DemoDetailComponent implements OnInit, OnDestroy {
  loading = true;
  notFound = false;
  traceMissing = false; // true when meta loaded but no real recording exists yet

  meta?: DemoMeta;
  prompt = '';
  workflow = '';
  analysisHtml: SafeHtml = '';
  swarmTrace?: DemoTrace;
  baselineTrace?: DemoTrace;

  selectedModel = '';

  // clock
  currentTimeMs = 0;
  isPlaying = false;
  speed = 1;
  readonly speedOptions = [1, 2, 4] as const;
  maxDuration = 0;

  private tickHandle: number | null = null;
  private routeSub?: Subscription;
  private readonly isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demosService: DemosService,
    private seo: SeoService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) { this.notFound = true; this.loading = false; return; }
      this.loadDemo(slug);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.stopTicker();
  }

  private loadDemo(slug: string): void {
    this.loading = true;
    this.demosService.loadMeta(slug).subscribe({
      next: (meta) => {
        this.meta = meta;
        this.seo.update({
          title: meta.title + ' — SwarmAI vs raw LLM',
          description: meta.asymmetryClaim,
          keywords: 'SwarmAI demo, ' + meta.category + ', ' + meta.process,
        });

        const modelFromQuery = this.route.snapshot.queryParamMap.get('model');
        const canonical = meta.availableRuns.find((r) => r.canonical)?.model;
        this.selectedModel = modelFromQuery ?? canonical ?? meta.availableRuns[0]?.model ?? '';
        this.loadTracesForSelected();
      },
      error: () => { this.notFound = true; this.loading = false; },
    });
  }

  private loadTracesForSelected(): void {
    if (!this.meta || !this.selectedModel) return;
    const slug = this.meta.slug;
    const model = this.selectedModel;
    const run = this.meta.availableRuns.find((r) => r.model === model);
    const frameworkVersion = run?.frameworkVersion ?? this.meta.frameworkVersion;

    this.traceMissing = false;
    this.swarmTrace = undefined;
    this.baselineTrace = undefined;

    this.demosService.loadDetail(slug, model, frameworkVersion).subscribe({
      next: (d) => {
        this.prompt = d.prompt;
        this.workflow = d.workflow;
        this.analysisHtml = d.analysis
          ? this.sanitizer.bypassSecurityTrustHtml(marked.parse(d.analysis, { async: false }) as string)
          : '';
        this.swarmTrace = d.swarm;
        this.baselineTrace = d.baseline;
        this.maxDuration =
          Math.max(d.swarm.metrics.wallTimeMs, d.baseline.metrics.wallTimeMs) + FINAL_REVEAL_MS;
        this.loading = false;
        this.resetClock();
        this.play(); // autoplay muted
      },
      error: () => {
        // The meta loaded but the trace JSON 404'd — this demo hasn't been
        // recorded against this (model, version) yet. Show an honest pending
        // state rather than silently breaking the UI.
        this.traceMissing = true;
        this.loading = false;
      },
    });
  }

  // --- clock controls ---

  play(): void {
    if (this.currentTimeMs >= this.maxDuration) this.currentTimeMs = 0;
    this.isPlaying = true;
    this.startTicker();
  }

  pause(): void {
    this.isPlaying = false;
    this.stopTicker();
  }

  togglePlay(): void { this.isPlaying ? this.pause() : this.play(); }

  setSpeed(s: number): void { this.speed = s; }

  seek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const ms = Number(input.value);
    this.currentTimeMs = Math.max(0, Math.min(this.maxDuration, ms));
  }

  skipToEnd(): void {
    this.currentTimeMs = this.maxDuration;
    this.isPlaying = false;
    this.stopTicker();
  }

  replay(): void {
    this.currentTimeMs = 0;
    this.play();
  }

  private resetClock(): void {
    this.currentTimeMs = 0;
    this.isPlaying = false;
  }

  private startTicker(): void {
    if (!this.isBrowser) return;
    if (this.tickHandle != null) return;

    // Run the timer outside Angular so the interval itself doesn't trigger CD;
    // we re-enter the zone only when we mutate bound state.
    this.zone.runOutsideAngular(() => {
      let last = performance.now();
      const tick = () => {
        if (!this.isPlaying) { this.tickHandle = null; return; }
        const now = performance.now();
        const dt = now - last;
        last = now;
        this.zone.run(() => {
          this.currentTimeMs = Math.min(
            this.maxDuration,
            this.currentTimeMs + dt * this.speed
          );
          if (this.currentTimeMs >= this.maxDuration) {
            this.isPlaying = false;
          }
        });
        if (this.isPlaying) {
          this.tickHandle = window.setTimeout(tick, TICK_MS) as unknown as number;
        } else {
          this.tickHandle = null;
        }
      };
      this.tickHandle = window.setTimeout(tick, TICK_MS) as unknown as number;
    });
  }

  private stopTicker(): void {
    if (this.tickHandle != null) {
      clearTimeout(this.tickHandle);
      this.tickHandle = null;
    }
  }

  // --- model switch ---

  selectModel(m: string): void {
    if (m === this.selectedModel) return;
    this.selectedModel = m;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { model: m },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.loadTracesForSelected();
  }

  // --- display helpers ---

  get progressPct(): number {
    if (!this.maxDuration) return 0;
    return (this.currentTimeMs / this.maxDuration) * 100;
  }

  get tokenDelta(): string {
    if (!this.swarmTrace || !this.baselineTrace) return '';
    const d = this.swarmTrace.metrics.totalTokens - this.baselineTrace.metrics.totalTokens;
    return (d > 0 ? '+' : '') + d.toLocaleString();
  }

  get costDelta(): string {
    if (!this.swarmTrace || !this.baselineTrace) return '';
    const d = this.swarmTrace.metrics.costUsd - this.baselineTrace.metrics.costUsd;
    return (d > 0 ? '+$' : '-$') + Math.abs(d).toFixed(4);
  }

  get wallTimeDelta(): string {
    if (!this.swarmTrace || !this.baselineTrace) return '';
    const d = this.swarmTrace.metrics.wallTimeMs - this.baselineTrace.metrics.wallTimeMs;
    return (d > 0 ? '+' : '') + (d / 1000).toFixed(1) + 's';
  }

  get sourceExampleUrl(): string {
    const path = this.meta?.sourceExample;
    if (!path) return '';
    return `https://github.com/intelliswarm-ai/swarm-ai-examples/tree/main/${path}`;
  }

  get frameworkVersionForDisplay(): string {
    // Prefer the framework version actually embedded in the loaded swarm trace,
    // then the per-run override from meta.availableRuns[], then the demo-level
    // default. This way, switching model chips reflects the real fw version
    // that recorded *this* run — not a stale top-level value.
    if (this.swarmTrace?.frameworkVersion) return this.swarmTrace.frameworkVersion;
    if (this.meta) {
      const run = this.meta.availableRuns.find((r) => r.model === this.selectedModel);
      if (run?.frameworkVersion) return run.frameworkVersion;
      return this.meta.frameworkVersion ?? '';
    }
    return '';
  }
}
