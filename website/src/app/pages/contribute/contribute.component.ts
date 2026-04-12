import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeoService } from '../../services/seo.service';

interface ContributionStatus {
  state: 'idle' | 'validating' | 'submitting' | 'success' | 'error';
  message: string;
}

interface ParsedImprovement {
  version: string;
  exportedAt: string;
  totalImprovements: number;
  tier1: number;
  tier2: number;
  tier3: number;
  estimatedTokenSavings: number;
  totalWorkflowsAnalyzed: number;
}

@Component({
  selector: 'app-contribute',
  templateUrl: './contribute.component.html',
  styleUrls: ['./contribute.component.scss'],
})
export class ContributeComponent implements OnInit {
  contributeForm!: FormGroup;
  status: ContributionStatus = { state: 'idle', message: '' };
  parsedData: ParsedImprovement | null = null;
  rawJson: string = '';
  fileName: string = '';
  isDragOver: boolean = false;

  constructor(private fb: FormBuilder, private seo: SeoService) {
    this.contributeForm = this.fb.group({
      organizationName: [''],
      contactEmail: ['', Validators.email],
      notes: [''],
      agreedTerms: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Contribute',
      description: 'Submit anonymized framework improvements discovered by your SwarmAI deployment. Help improve the framework for all users worldwide.',
      keywords: 'contribute SwarmAI, open source contribution, framework improvement',
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.name.endsWith('.json')) {
      this.status = { state: 'error', message: 'Please upload a .json file.' };
      return;
    }
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.rawJson = reader.result as string;
      this.validateJson(this.rawJson);
    };
    reader.readAsText(file);
  }

  onPasteJson(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.rawJson = textarea.value;
    if (this.rawJson.trim()) {
      this.validateJson(this.rawJson);
    } else {
      this.parsedData = null;
      this.status = { state: 'idle', message: '' };
    }
  }

  private validateJson(json: string): void {
    this.status = { state: 'validating', message: 'Validating improvement data...' };
    try {
      const data = JSON.parse(json);

      if (!data.exportFormat || data.exportFormat !== 'swarmai-improvements') {
        this.status = {
          state: 'error',
          message: 'Invalid format. Expected a SwarmAI improvement export file (exportFormat: "swarmai-improvements").',
        };
        this.parsedData = null;
        return;
      }

      this.parsedData = {
        version: data.frameworkVersion || 'unknown',
        exportedAt: data.exportedAt || 'unknown',
        totalImprovements: (data.improvements?.length) || 0,
        tier1: data.improvements?.filter((i: any) => i.tier === 'TIER_1_AUTO').length || 0,
        tier2: data.improvements?.filter((i: any) => i.tier === 'TIER_2_REVIEWED').length || 0,
        tier3: data.improvements?.filter((i: any) => i.tier === 'TIER_3_ARCHITECTURE').length || 0,
        estimatedTokenSavings: data.communityInvestment?.estimatedTokenSavingsPerRun || 0,
        totalWorkflowsAnalyzed: data.communityInvestment?.totalWorkflowsAnalyzed || 0,
      };
      this.status = { state: 'idle', message: '' };
    } catch {
      this.status = { state: 'error', message: 'Invalid JSON. Please check the file contents.' };
      this.parsedData = null;
    }
  }

  async handleSubmit(): Promise<void> {
    if (!this.contributeForm.valid || !this.rawJson) return;

    this.status = { state: 'submitting', message: 'Submitting improvements...' };
    try {
      const payload = {
        improvementData: JSON.parse(this.rawJson),
        organizationName: this.contributeForm.value.organizationName || 'Anonymous',
        contactEmail: this.contributeForm.value.contactEmail || '',
        notes: this.contributeForm.value.notes || '',
      };

      const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Submission failed');
      }

      const result = await response.json();
      this.status = {
        state: 'success',
        message: `Contribution received. ${result.improvementsAccepted} improvements accepted. Tracking ID: ${result.trackingId}`,
      };
      this.contributeForm.reset({ agreedTerms: false });
      this.rawJson = '';
      this.parsedData = null;
      this.fileName = '';
    } catch (err: any) {
      this.status = {
        state: 'error',
        message: err.message || 'Failed to submit. Please try again or use an alternative channel.',
      };
    }
  }
}
