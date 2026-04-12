import { Component, OnInit } from '@angular/core';

interface ContributionSummary {
  trackingId: string;
  receivedAt: string;
  organizationName: string;
  improvementsCount: number;
  frameworkVersion: string;
  status?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ContributionDetail extends ContributionSummary {
  contactEmail?: string;
  notes?: string;
  improvementData?: {
    exportFormat: string;
    frameworkVersion: string;
    improvements: Improvement[];
  };
  improvementIssues?: Record<string, IssueInfo>;
}

interface IssueInfo {
  url: string;
  number: number;
  repo: string;
  createdAt: string;
}

type RepoKey = 'swarm-ai' | 'swarm-ai-examples' | 'swarm-ai-skills';

interface Improvement {
  category: string;
  tier: string;
  condition: Record<string, any>;
  confidence: number;
  recommendation: string;
  crossValidated: boolean;
  supportingObservations: number;
  estimatedTokenSavings: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  // Auth state
  authenticated = false;
  authChecking = true;
  loginPassword = '';
  loginError = '';
  loginLoading = false;
  private authToken: string | null = null;

  // Data state
  contributions: ContributionSummary[] = [];
  selectedContribution: ContributionDetail | null = null;
  loading = false;
  error = '';

  // Review
  reviewNotes = '';
  reviewLoading = false;

  // Per-improvement issue creation
  issueCreating: Record<number, boolean> = {};
  issueError: Record<number, string> = {};
  issueRepoSelection: Record<number, RepoKey> = {};
  repoOptions: RepoKey[] = ['swarm-ai', 'swarm-ai-examples', 'swarm-ai-skills'];

  // Delete state
  deleteLoading = false;

  // Stats
  totalContributions = 0;
  totalImprovements = 0;
  totalPending = 0;
  uniqueOrganizations = 0;

  ngOnInit(): void {
    this.authToken = sessionStorage.getItem('admin_token');
    if (this.authToken) {
      this.checkAuth();
    } else {
      this.authChecking = false;
    }
  }

  // --- Authentication (Bearer token) ---

  private authHeaders(): Record<string, string> {
    return this.authToken
      ? { 'Authorization': `Bearer ${this.authToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  async checkAuth(): Promise<void> {
    this.authChecking = true;
    try {
      const response = await fetch('/api/admin/auth-check', { headers: this.authHeaders() });
      const data = await response.json();
      this.authenticated = data.authenticated === true;
      if (this.authenticated) {
        this.loadContributions();
      } else {
        sessionStorage.removeItem('admin_token');
        this.authToken = null;
      }
    } catch {
      this.authenticated = false;
    } finally {
      this.authChecking = false;
    }
  }

  async login(): Promise<void> {
    if (!this.loginPassword) return;
    this.loginLoading = true;
    this.loginError = '';
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: this.loginPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.token) {
        this.authToken = data.token;
        sessionStorage.setItem('admin_token', data.token);
        this.authenticated = true;
        this.loginPassword = '';
        this.loadContributions();
      } else {
        this.loginError = data.error || 'Login failed';
      }
    } catch (err: any) {
      this.loginError = 'Connection failed';
    } finally {
      this.loginLoading = false;
    }
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem('admin_token');
    this.authToken = null;
    this.authenticated = false;
    this.contributions = [];
    this.selectedContribution = null;
  }

  onPasswordKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }

  // --- Data Loading ---

  async loadContributions(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const response = await fetch('/api/admin/contributions', { headers: this.authHeaders() });
      if (response.status === 401) {
        this.authenticated = false;
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.contributions = (data.contributions || []).sort(
        (a: ContributionSummary, b: ContributionSummary) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
      this.totalContributions = this.contributions.length;
      this.totalImprovements = this.contributions.reduce((sum, c) => sum + c.improvementsCount, 0);
      this.totalPending = this.contributions.filter((c) => (c.status || 'PENDING') === 'PENDING').length;
      this.uniqueOrganizations = new Set(this.contributions.map((c) => c.organizationName)).size;
    } catch (err: any) {
      this.error = err.message || 'Failed to load contributions';
    } finally {
      this.loading = false;
    }
  }

  async selectContribution(trackingId: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/contributions/${trackingId}`, { headers: this.authHeaders() });
      if (response.status === 401) {
        this.authenticated = false;
        return;
      }
      if (response.ok) {
        this.selectedContribution = await response.json();
      }
    } catch {
      const contrib = this.contributions.find((c) => c.trackingId === trackingId);
      if (contrib) this.selectedContribution = contrib as any;
    }
  }

  closeDetail(): void {
    this.selectedContribution = null;
    this.reviewNotes = '';
  }

  async reviewContribution(action: 'APPROVE' | 'REJECT'): Promise<void> {
    if (!this.selectedContribution) return;
    this.reviewLoading = true;
    try {
      const response = await fetch(
        `/api/admin/contributions/${this.selectedContribution.trackingId}/review`,
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ action, reviewNotes: this.reviewNotes }),
        }
      );
      if (response.status === 401) {
        this.authenticated = false;
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        // Update local state
        this.selectedContribution.status = data.status;
        this.selectedContribution.reviewedAt = new Date().toISOString();
        this.selectedContribution.reviewNotes = this.reviewNotes;
        const idx = this.contributions.findIndex(
          (c) => c.trackingId === this.selectedContribution?.trackingId
        );
        if (idx >= 0) {
          this.contributions[idx].status = data.status;
        }
        this.totalPending = this.contributions.filter(
          (c) => (c.status || 'PENDING') === 'PENDING'
        ).length;
        this.reviewNotes = '';
      }
    } catch (err) {
      console.error('Review failed:', err);
    } finally {
      this.reviewLoading = false;
    }
  }

  /**
   * Auto-detect repo for an improvement based on condition.file or category.
   * Mirrors the backend logic.
   */
  detectRepo(imp: Improvement): RepoKey {
    const file = (imp?.condition?.['file'] || '').toLowerCase();
    const category = (imp?.category || '').toLowerCase();

    if (file.includes('examples/') || file.includes('example/') || category.includes('example')) {
      return 'swarm-ai-examples';
    }
    if (file.includes('skills/') || file.includes('skill/') || category.includes('skill')) {
      return 'swarm-ai-skills';
    }
    return 'swarm-ai';
  }

  getSelectedRepo(imp: Improvement, index: number): RepoKey {
    return this.issueRepoSelection[index] || this.detectRepo(imp);
  }

  setSelectedRepo(index: number, repo: RepoKey): void {
    this.issueRepoSelection[index] = repo;
  }

  getIssueForImprovement(index: number): IssueInfo | null {
    return this.selectedContribution?.improvementIssues?.[String(index)] || null;
  }

  async createImprovementIssue(index: number): Promise<void> {
    if (!this.selectedContribution) return;
    const improvement = this.selectedContribution.improvementData?.improvements?.[index];
    if (!improvement) return;

    const repo = this.getSelectedRepo(improvement, index);
    this.issueCreating[index] = true;
    this.issueError[index] = '';

    try {
      const response = await fetch(
        `/api/admin/contributions/${this.selectedContribution.trackingId}/improvements/${index}/create-issue`,
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ repo }),
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        // Update local state
        if (!this.selectedContribution.improvementIssues) {
          this.selectedContribution.improvementIssues = {};
        }
        this.selectedContribution.improvementIssues[String(index)] = data.issue;
      } else {
        this.issueError[index] = data.error || 'Failed to create issue';
      }
    } catch (err: any) {
      this.issueError[index] = err.message || 'Connection failed';
    } finally {
      this.issueCreating[index] = false;
    }
  }

  async deleteContribution(): Promise<void> {
    if (!this.selectedContribution) return;
    if (!confirm(`Delete contribution ${this.selectedContribution.trackingId}? This cannot be undone.`)) {
      return;
    }
    this.deleteLoading = true;
    try {
      const response = await fetch(
        `/api/admin/contributions/${this.selectedContribution.trackingId}`,
        { method: 'DELETE', headers: this.authHeaders() }
      );
      if (response.ok) {
        const deletedId = this.selectedContribution.trackingId;
        this.contributions = this.contributions.filter((c) => c.trackingId !== deletedId);
        this.totalContributions = this.contributions.length;
        this.totalImprovements = this.contributions.reduce((sum, c) => sum + c.improvementsCount, 0);
        this.totalPending = this.contributions.filter((c) => (c.status || 'PENDING') === 'PENDING').length;
        this.uniqueOrganizations = new Set(this.contributions.map((c) => c.organizationName)).size;
        this.closeDetail();
      } else {
        const data = await response.json().catch(() => ({}));
        alert('Delete failed: ' + (data.error || response.status));
      }
    } catch (err: any) {
      alert('Delete failed: ' + (err.message || 'connection error'));
    } finally {
      this.deleteLoading = false;
    }
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  getTimeSince(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }
}
