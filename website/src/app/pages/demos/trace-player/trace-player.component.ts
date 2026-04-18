import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { DemoTrace, TraceStep } from '../models/demo-trace';

interface RevealedStep {
  step: TraceStep;
  /** 0..1 — for stretched steps (llm_request) this reflects partial reveal */
  progress: number;
}

@Component({
  selector: 'app-trace-player',
  templateUrl: './trace-player.component.html',
  styleUrls: ['./trace-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracePlayerComponent implements OnChanges {
  @Input() trace!: DemoTrace;
  @Input() elapsedMs = 0;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() accent: 'swarm' | 'baseline' = 'swarm';

  revealed: RevealedStep[] = [];
  finalProgress = 0;
  livingTokens = 0;
  livingCost = 0;
  livingToolCalls = 0;
  livingAgentTurns = 0;

  constructor(private sanitizer: DomSanitizer) {
    // marked defaults are sensible (GFM on, line-breaks off) — no config needed.
  }

  /** Render the final output as HTML after streaming completes.
   *  During streaming we keep plain text so partial markdown doesn't flash broken tags. */
  renderedFinalHtml(): SafeHtml {
    const text = this.finalOutputContent();
    if (!text) return '';
    const html = marked.parse(text, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.trace) return;
    if (changes['trace'] || changes['elapsedMs']) {
      this.recompute();
    }
  }

  private recompute(): void {
    const steps = this.trace.steps;
    const revealed: RevealedStep[] = [];
    let tokens = 0;
    let cost = 0;
    let toolCalls = 0;
    const agents = new Set<string>();
    let finalProgress = 0;

    for (const step of steps) {
      if (step.t > this.elapsedMs) break;

      let progress = 1;
      const duration = Number(step.durationMs ?? 0);
      if (duration > 0 && this.elapsedMs < step.t + duration) {
        progress = Math.min(1, Math.max(0, (this.elapsedMs - step.t) / duration));
      }
      revealed.push({ step, progress });

      // live metrics tick proportionally for stretched llm_request
      if (step.kind === 'llm_request') {
        const inTok = Number(step.promptTokens ?? 0);
        const outTok = Number(step.completionTokens ?? 0);
        const stepCost = Number(step.costUsd ?? 0);
        tokens += Math.round((inTok + outTok) * progress);
        cost += stepCost * progress;
      }
      if (step.kind === 'tool_call' && progress >= 1) toolCalls++;
      if (step.kind === 'agent_started') agents.add(String(step.agent ?? ''));

      if (step.kind === 'final') {
        // Reveal the final content over a pleasant 2.5s (or remainder)
        const stretchMs = 2500;
        const target = step.t + stretchMs;
        finalProgress = Math.min(1, Math.max(0, (this.elapsedMs - step.t) / stretchMs));
        // stop updating live metrics after final arrives — use trace totals for the denouement
        if (this.elapsedMs >= target) {
          tokens = this.trace.metrics.totalTokens;
          cost = this.trace.metrics.costUsd;
          toolCalls = this.trace.metrics.toolCalls;
        }
      }
    }

    this.revealed = revealed;
    this.finalProgress = finalProgress;
    this.livingTokens = tokens;
    this.livingCost = cost;
    this.livingToolCalls = toolCalls;
    this.livingAgentTurns = agents.size;
  }

  // --- content streaming for final output ---
  revealedFinal(): string {
    const content = this.finalOutputContent();
    if (this.finalProgress >= 1) return content;
    if (this.finalProgress <= 0) return '';
    const cutoff = Math.floor(content.length * this.finalProgress);
    return content.slice(0, cutoff);
  }

  /** Client-side fallback: if finalOutput.content is empty (happens when the
   * framework's SWARM_COMPLETED event didn't include the output), pick it up
   * from the last agent_completed step so the final card still renders real
   * content. Newer recordings (recorder 0.2+) embed this in finalOutput directly. */
  finalOutputContent(): string {
    const direct = this.trace?.finalOutput?.content ?? '';
    if (direct) return direct;
    const steps = this.trace?.steps ?? [];
    for (let i = steps.length - 1; i >= 0; i--) {
      const s = steps[i];
      if (s.kind === 'agent_completed' && typeof s.output === 'string' && s.output.trim()) {
        return s.output as string;
      }
      if (s.kind === 'agent_message' && typeof s.content === 'string' && s.content.trim()) {
        return s.content;
      }
    }
    return '';
  }

  get elapsedSeconds(): string {
    return (Math.min(this.elapsedMs, this.trace?.metrics.wallTimeMs ?? 0) / 1000).toFixed(1);
  }

  get totalSeconds(): string {
    return (this.trace.metrics.wallTimeMs / 1000).toFixed(1);
  }

  get costDisplay(): string {
    return this.livingCost === 0 ? '$0.00 · local' : '$' + this.livingCost.toFixed(4);
  }

  // --- step rendering helpers ---

  agentInitial(agent?: string): string {
    if (!agent) return '•';
    return agent
      .split(/[-_ ]/)
      .map((p) => p.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }

  agentColorIndex(agent?: string): number {
    if (!agent) return 0;
    let h = 0;
    for (let i = 0; i < agent.length; i++) h = (h * 31 + agent.charCodeAt(i)) | 0;
    return Math.abs(h) % 6;
  }

  /** Character-stream effect for llm_request content */
  streamedContent(step: TraceStep, progress: number): string {
    const full = String(step.content ?? '');
    if (!full) return '';
    if (progress >= 1) return full;
    return full.slice(0, Math.floor(full.length * progress));
  }

  /** Pretty short one-liner for tool input */
  toolInputSummary(input: unknown): string {
    if (input == null) return '';
    try {
      const s = JSON.stringify(input);
      return s.length > 120 ? s.slice(0, 117) + '…' : s;
    } catch { return String(input); }
  }

  trackByStep = (i: number, r: RevealedStep) => i + ':' + r.step.kind + ':' + r.step.t;

  /** Rough heuristic to decide which steps deserve a visible row (skip tiny internal events).
   * When agent_message is present for the same content as agent_completed, we suppress the
   * redundant agent_completed row (message already shown as a chat bubble). */
  isHeadline(kind: string): boolean {
    return [
      'swarm_started','process_started','task_started','task_completed',
      'agent_started','agent_message','agent_completed','agent_delegate',
      'iteration_started','iteration_completed',
      'tool_call','tool_failed','retry','fallback',
      'budget_warning','budget_exceeded',
      'skill_generated','skill_registered',
      'approval_requested','approval_granted',
      'llm_request',
      'swarm_completed','final',
    ].includes(kind);
  }
}
