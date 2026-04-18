import { Component, OnInit } from '@angular/core';
import { DemosService } from '../services/demos.service';
import { DemoMeta } from '../models/demo-meta';
import { SeoService } from '../../../services/seo.service';

@Component({
  selector: 'app-demos-list',
  templateUrl: './demos-list.component.html',
  styleUrls: ['./demos-list.component.scss']
})
export class DemosListComponent implements OnInit {
  demos: DemoMeta[] = [];
  loading = true;
  selectedCategory = 'All';
  categories: string[] = ['All'];

  constructor(
    private demosService: DemosService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Demos — side-by-side with raw LLM',
      description: 'Prerecorded SwarmAI workflows played back alongside the same prompt sent to the raw LLM. Real numbers, real traces, zero cost per visit.',
      keywords: 'SwarmAI demos, agent framework comparison, LLM baseline, Java Spring AI agents',
    });

    this.demosService.loadAllMeta().subscribe({
      next: (metas) => {
        this.demos = metas;
        const cats = new Set<string>(metas.map((m) => m.category));
        this.categories = ['All', ...Array.from(cats)];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get filteredDemos(): DemoMeta[] {
    return this.selectedCategory === 'All'
      ? this.demos
      : this.demos.filter((d) => d.category === this.selectedCategory);
  }

  selectCategory(c: string): void {
    this.selectedCategory = c;
  }

  modelChips(meta: DemoMeta): string[] {
    return meta.availableRuns.map((r) => r.model);
  }
}
