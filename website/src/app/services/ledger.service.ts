import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Public community-investment ledger snapshot.
 * Shape mirrors GET /api/v1/self-improving/ledger on the backend
 * (see intelliswarm.ai/backend/handlers/ledger.js).
 */
export interface LedgerSnapshot {
  snapshotTime: string;
  coverage: {
    reportingInstallations: number;
    reportingWindowDays: number;
    firstReportAt: string | null;
  };
  inputs: {
    totalWorkflowRuns: number;
    totalTokensInvested: number;
    totalObservationsCollected: number;
  };
  outputs: {
    totalProposalsGenerated: number;
    totalTier1AutoEligible: number;
    totalTier2PRsFiled: number;
    totalTier3Proposals: number;
    totalAntiPatternsDiscovered: number;
    totalSkillsPromoted: number;
  };
  categories: Record<string, number>;
  ratios: {
    proposalsPerMillionTokens: number;
    shipRatePercent: number;
  };
}

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly endpoint = '/api/v1/self-improving/ledger';

  constructor(private http: HttpClient) {}

  getLedger(): Observable<LedgerSnapshot> {
    return this.http.get<LedgerSnapshot>(this.endpoint);
  }
}
