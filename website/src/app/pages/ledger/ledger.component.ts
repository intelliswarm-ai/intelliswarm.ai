import { Component, OnInit } from '@angular/core';
import { LedgerService, LedgerSnapshot } from '../../services/ledger.service';
import { SeoService } from '../../services/seo.service';

type LoadState = 'loading' | 'loaded' | 'empty' | 'error';

@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.scss'],
})
export class LedgerComponent implements OnInit {
  state: LoadState = 'loading';
  snapshot: LedgerSnapshot | null = null;
  errorMessage = '';

  constructor(
    private ledger: LedgerService,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Community Ledger',
      description:
        'Aggregated opt-in telemetry from SwarmAI deployments: counters for tokens invested, proposals generated, and improvements recorded. Counters only — no workflow content.',
      keywords: 'SwarmAI ledger, open source metrics',
    });
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.ledger.getLedger().subscribe({
      next: (snap) => {
        this.snapshot = snap;
        this.state = snap.coverage.reportingInstallations === 0 ? 'empty' : 'loaded';
      },
      error: (err) => {
        this.state = 'error';
        this.errorMessage = err?.error?.error || 'Unable to load ledger.';
      },
    });
  }

  // Category labels — keep the public surface readable; raw enum names stay in the API.
  readonly categoryLabels: Record<string, string> = {
    CONVERGENCE_DEFAULT: 'Convergence defaults',
    TOOL_ROUTING: 'Tool routing',
    ANTI_PATTERN: 'Anti-patterns',
    PROMPT_EFFICIENCY: 'Prompt efficiency',
    SKILL_PROMOTION: 'Skill promotions',
    EXPENSIVE_TASK: 'Expensive task optimizations',
    FAILURE_PATTERN: 'Failure patterns',
    UNKNOWN: 'Other',
  };

  get sortedCategories(): Array<{ key: string; label: string; count: number }> {
    if (!this.snapshot?.categories) return [];
    return Object.entries(this.snapshot.categories)
      .map(([key, count]) => ({
        key,
        label: this.categoryLabels[key] || key,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  formatNumber(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 10_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  formatExact(n: number): string {
    return n.toLocaleString();
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
