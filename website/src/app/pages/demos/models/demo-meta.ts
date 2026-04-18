export interface AvailableRun {
  model: string;
  swarm: boolean;
  baseline: boolean;
  canonical?: boolean;
  /** Framework version this run was recorded against. Falls back to {@link DemoMeta.frameworkVersion}. */
  frameworkVersion?: string;
}

export interface DemoMeta {
  $schema?: number;
  slug: string;
  title: string;
  category: 'Core' | 'Advanced' | 'Enterprise' | 'Getting Started' | string;
  process: string;
  sourceExample: string;
  summary: string;
  description: string;
  asymmetryClaim: string;
  valueAddScore: number;
  availableRuns: AvailableRun[];
  recordedAt: string;
  frameworkVersion: string;
}

export interface DemosIndex {
  $schema?: number;
  generatedAt: string;
  demos: string[];
}
