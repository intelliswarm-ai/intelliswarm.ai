import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';
// Canonical tools catalog. The same file is deployed to the CDN at
// /assets/tools/index.json so third-party clients can fetch the catalog
// directly. Importing it here ensures the prerendered HTML also contains the
// full content for social crawlers and search engines.
import toolsCatalog from '../../../assets/tools/index.json';

interface ConfigItem {
  key: string;
  description: string;
  required: boolean;
}

interface ToolCard {
  id: string;
  title: string;
  tagline?: string;
  content: string;
  overview?: string;
  description?: string;
  configuration?: ConfigItem[];
  workflows?: string[];
  sourcePath?: string;
  link?: string;
  img?: string;
}

interface ToolGroup {
  id?: string;
  titleLead: string;
  titleHighlight: string;
  accent: string;
  tools: ToolCard[];
}

interface Catalog {
  repoUrl: string;
  repoBlobBase: string;
  groups: ToolGroup[];
}

const AVAILABLE_ICONS = 27;

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.css',
})
export class ToolsComponent implements OnInit {
  constructor(private seo: SeoService) {}

  private readonly catalog = toolsCatalog as unknown as Catalog;
  private readonly catalogUrl = '/assets/tools/index.json';

  toolGroups: ToolGroup[] = this.catalog.groups;

  get totalTools(): number {
    return this.toolGroups.reduce((sum, g) => sum + g.tools.length, 0);
  }

  iconFor(index: number): string {
    return String(((index - 1) % AVAILABLE_ICONS) + 1);
  }

  iconSrc(index: number): string {
    return `../../../assets/img/icon/${this.iconFor(index)}.svg`;
  }

  globalIndex(groupIndex: number, toolIndex: number): number {
    let offset = 0;
    for (let i = 0; i < groupIndex; i++) {
      offset += this.toolGroups[i].tools.length;
    }
    return offset + toolIndex + 1;
  }

  githubUrlFor(tool: ToolCard): string {
    if (tool.sourcePath) {
      return `${this.catalog.repoBlobBase}${tool.sourcePath}`;
    }
    return this.catalog.repoUrl;
  }

  configCount(tool: ToolCard): number {
    return tool.configuration?.length ?? 0;
  }

  workflowCount(tool: ToolCard): number {
    return tool.workflows?.length ?? 0;
  }

  get publicCatalogUrl(): string {
    return this.catalogUrl;
  }

  ngOnInit(): void {
    this.seo.update({
      title: 'Built-in Tools',
      description:
        `Explore the ${this.totalTools}+ built-in tools that ship with SwarmAI: web search, SEC filings, CVE lookup, Wolfram Alpha, PDF reading, code execution, and more — ready to plug into any agent workflow.`,
      keywords:
        'SwarmAI tools, AI agent tools, built-in tools, Spring AI tools, agent framework tools, web search tool, SEC filings tool, CVE lookup',
    });
  }
}
