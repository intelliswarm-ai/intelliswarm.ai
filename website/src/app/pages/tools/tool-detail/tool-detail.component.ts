import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SeoService } from '../../../services/seo.service';
import toolsCatalog from '../../../../assets/tools/index.json';

interface ConfigItem {
  key: string;
  description: string;
  required: boolean;
}

interface Example {
  prompt?: string;
  call?: string;
  result?: string;
}

interface Tool {
  id: string;
  title: string;
  tagline?: string;
  content: string;
  overview?: string;
  description?: string;
  configuration?: ConfigItem[];
  workflows?: string[];
  example?: Example;
  codeSnippet?: string;
  javaSnippet?: string;
  sourcePath?: string;
}

interface Group {
  id: string;
  titleLead: string;
  titleHighlight: string;
  accent: string;
  tools: Tool[];
}

interface Catalog {
  repoUrl: string;
  repoBlobBase: string;
  groups: Group[];
}

const AVAILABLE_ICONS = 27;

@Component({
  selector: 'app-tool-detail',
  templateUrl: './tool-detail.component.html',
  styleUrl: './tool-detail.component.css',
})
export class ToolDetailComponent implements OnInit, OnDestroy {
  tool?: Tool;
  group?: Group;
  iconNumber = '1';
  githubUrl = '';
  notFound = false;

  private routeSub?: Subscription;
  private readonly catalog = toolsCatalog as unknown as Catalog;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.load(id);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private load(id: string | null): void {
    if (!id) {
      this.notFound = true;
      return;
    }

    let globalIndex = 0;
    for (const g of this.catalog.groups) {
      for (const t of g.tools) {
        globalIndex += 1;
        if (t.id === id) {
          this.tool = t;
          this.group = g;
          this.iconNumber = String(((globalIndex - 1) % AVAILABLE_ICONS) + 1);
          this.githubUrl = t.sourcePath
            ? `${this.catalog.repoBlobBase}${t.sourcePath}`
            : this.catalog.repoUrl;
          this.seo.update({
            title: `${t.title} · Built-in Tool`,
            description: t.description || t.content,
            keywords: `SwarmAI ${t.title}, ${t.id}, SwarmAI built-in tool, agent tool`,
          });
          return;
        }
      }
    }

    this.notFound = true;
    this.seo.update({
      title: 'Tool not found',
      description: 'The built-in tool you are looking for could not be found.',
    });
  }

  get hasConfig(): boolean {
    return !!this.tool?.configuration && this.tool.configuration.length > 0;
  }

  get hasWorkflows(): boolean {
    return !!this.tool?.workflows && this.tool.workflows.length > 0;
  }

  get hasExample(): boolean {
    const ex = this.tool?.example;
    return !!ex && (!!ex.prompt || !!ex.call || !!ex.result);
  }

  get iconSrc(): string {
    return `../../../../assets/img/icon/${this.iconNumber}.svg`;
  }
}
