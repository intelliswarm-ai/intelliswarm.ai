export type TraceSide = 'swarm' | 'baseline';

export type StepKind =
  | 'swarm_started' | 'swarm_completed'
  | 'process_started' | 'process_completed'
  | 'task_started'   | 'task_completed'   | 'task_failed'
  | 'iteration_started' | 'iteration_completed'
  | 'agent_started'  | 'agent_message'    | 'agent_completed' | 'agent_delegate'
  | 'tool_call'      | 'tool_failed'
  | 'llm_request'    | 'llm_chunk'
  | 'budget_warning' | 'budget_exceeded'
  | 'skill_generated' | 'skill_registered'
  | 'approval_requested' | 'approval_granted'
  | 'rl_decision'
  | 'retry' | 'fallback'
  | 'final'
  | string; // tolerate unknown kinds per schema rule

export interface TraceStep {
  t: number;
  kind: StepKind;
  agent?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  tool?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  willRetry?: boolean;
  durationMs?: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  attempt?: number;
  delayMs?: number;
  reason?: string;
  fromProvider?: string;
  toProvider?: string;
  fromAgent?: string;
  toAgent?: string;
  task?: string;
  taskId?: string;
  description?: string;
  round?: number;
  score?: number;
  tokensUsed?: number;
  budget?: number;
  mode?: string;
  gateName?: string;
  approver?: string;
  rationale?: string;
  skillName?: string;
  sourcePreview?: string;
  swarmId?: string;
  process?: string;
  agentCount?: number;
  outcome?: string;
  turns?: number;
  totalTokens?: number;
  tokensSoFar?: number;
  [k: string]: unknown;
}

export interface TraceMetrics {
  wallTimeMs: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  toolCalls: number;
  agentTurns: number;
  llmRequests: number;
  failures: number;
  retries: number;
}

export interface FinalOutput {
  format: 'markdown' | 'json' | 'text';
  content: string;
}

export interface DemoTrace {
  $schema?: number;
  demoSlug: string;
  side: TraceSide;
  model: string;
  modelDisplayName: string;
  provider: string;
  frameworkVersion: string | null;
  recordedAt: string;
  metrics: TraceMetrics;
  finalOutput: FinalOutput;
  steps: TraceStep[];
}
