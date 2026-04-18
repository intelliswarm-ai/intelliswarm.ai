# Demo trace schema

Contract between the **recorder** (Java, lives in `swarm-ai-examples/demo-recorder`) and the **player** (Angular, lives in `website/src/app/pages/demos`).

Every demo is a **matrix** of `(demo-slug, model) → { swarm.json, baseline.json }`. Both sides share one schema so the UI can render them with the same component.

## Directory layout

```
demos/
  <demo-slug>/
    meta.json                               # static demo metadata
    prompt.md                               # the user-facing prompt (input to both sides)
    workflow.yaml                           # the swarm-ai workflow DSL (for display only)
    runs/
      <model-slug>/
        <framework-version>/
          <demo-slug>.json                  # left panel: agentic workflow trace
          <demo-slug>-2.json                # additional swarms in same JVM (optional)
          baseline.json                     # right panel: raw ChatClient call trace
```

Example: `demos/error-handling-and-recovery/runs/gpt-4o/1.0.3/error-handling-and-recovery.json`

**Why the framework version sits in the path:** it lets recordings of the same
demo across SwarmAI releases live side-by-side, feeding the regression CLI and
the v1.0-vs-v1.3 self-improvement demo. The baseline is stored under the same
version directory so a `(model, version)` run set is self-contained — baseline
drift from the provider is pinned to the same point in time.

`<model-slug>` must match the `name` field in the website's model registry (`website/src/app/pages/demos/models.ts`).

## meta.json

```jsonc
{
  "slug": "error-handling-and-recovery",           // matches directory name
  "title": "Error Handling & Recovery",
  "category": "Core",                              // Core | Advanced | Enterprise | Getting Started
  "process": "SEQUENTIAL",                         // the swarm-ai process type
  "sourceExample": "error-handling-and-recovery",  // swarm-ai-examples dir name
  "summary": "Single-sentence pitch for the list page.",
  "description": "Longer markdown description shown on the detail page header.",
  "asymmetryClaim": "Kill the provider mid-call — the swarm retries and falls back. Raw LLM dies.",
  "valueAddScore": 85,                             // from FRAMEWORK_EVALUATION_*
  "availableRuns": [                               // which (model, side) combos have recordings
    { "model": "gpt-4o",             "swarm": true, "baseline": true },
    { "model": "claude-sonnet-4-6",  "swarm": true, "baseline": true },
    { "model": "llama-3.1-70b-local","swarm": true, "baseline": true }
  ],
  "recordedAt": "2026-04-18T12:00:00Z",
  "frameworkVersion": "1.0.3"
}
```

## Trace file (swarm.json / baseline.json)

```jsonc
{
  "demoSlug": "error-handling-and-recovery",
  "side": "swarm",                                 // "swarm" | "baseline"
  "model": "gpt-4o",
  "modelDisplayName": "GPT-4o",
  "provider": "openai",                            // openai | anthropic | ollama | azure
  "frameworkVersion": "1.0.3",                     // only meaningful for side=swarm
  "recordedAt": "2026-04-18T12:00:00Z",

  "metrics": {
    "wallTimeMs": 42017,
    "totalTokens": 12500,
    "inputTokens": 3100,
    "outputTokens": 9400,
    "costUsd": 0.0187,
    "toolCalls": 7,                                // 0 for baseline
    "agentTurns": 4,                               // 1 for baseline
    "llmRequests": 6,
    "failures": 0,
    "retries": 0
  },

  "finalOutput": {
    "format": "markdown",                          // markdown | json | text
    "content": "..."                               // the artifact shown at end of playback
  },

  "steps": [ /* see step kinds below */ ]
}
```

## Step kinds

Every step has `{ t, kind, ...payload }` where `t` is **milliseconds since trace start**. The player renders steps in `t` order, respecting real wall-time by default (rule from DEMO_IDEAS.md: don't speed up).

### Core kinds (emitted for both sides)

| kind | when | payload |
|---|---|---|
| `llm_request` | ChatClient call begins | `{ model, promptTokens, completionTokens, costUsd, durationMs, content? }` |
| `llm_chunk` | streaming chunk (optional) | `{ text, tokensSoFar }` |
| `final` | last step, always present | `{ content }` (matches `finalOutput.content`) |

### Swarm-only kinds (from `SwarmEvent.Type`)

| kind | maps to `SwarmEvent.Type` | payload |
|---|---|---|
| `swarm_started` | `SWARM_STARTED` | `{ swarmId, process, agentCount }` |
| `swarm_completed` | `SWARM_COMPLETED` | `{ swarmId, outcome }` |
| `process_started` | `PROCESS_STARTED` | `{ process }` |
| `task_started` | `TASK_STARTED` | `{ taskId, description, agent }` |
| `task_completed` | `TASK_COMPLETED` | `{ taskId, output }` |
| `task_failed` | `TASK_FAILED` | `{ taskId, error }` |
| `iteration_started` | `ITERATION_STARTED` | `{ round }` |
| `iteration_completed` | `ITERATION_COMPLETED` | `{ round, score? }` |
| `agent_started` | `AGENT_STARTED` | `{ agent, role }` |
| `agent_message` | — (synthesized) | `{ agent, role: "user"\|"assistant"\|"system", content }` |
| `agent_completed` | `AGENT_COMPLETED` | `{ agent, output }` |
| `agent_delegate` | hierarchical delegation | `{ fromAgent, toAgent, task }` |
| `tool_call` | `TOOL_STARTED` + `TOOL_COMPLETED` collapsed | `{ tool, input, output, durationMs, error? }` |
| `tool_failed` | `TOOL_FAILED` | `{ tool, error, willRetry }` |
| `budget_warning` | `BUDGET_WARNING` | `{ tokensUsed, budget }` |
| `budget_exceeded` | `BUDGET_EXCEEDED` | `{ tokensUsed, budget, mode }` |
| `skill_generated` | `SKILL_GENERATED` | `{ skillName, sourcePreview }` |
| `skill_registered` | `SKILL_REGISTERED` | `{ skillName }` |
| `approval_requested` | `APPROVAL_REQUESTED` | `{ gateName, rationale }` |
| `approval_granted` | `APPROVAL_GRANTED` | `{ gateName, approver }` |
| `rl_decision` | `RL_DECISION_MADE` | `{ decision, policyWeights }` |
| `retry` | swarmai resilience4j retry | `{ reason, attempt, delayMs }` |
| `fallback` | provider fallback | `{ fromProvider, toProvider }` |

All payloads except `t` and `kind` are optional. Unknown kinds must be rendered as a generic grey "event" pill — the UI must not crash on a new kind so the recorder can evolve without a simultaneous website release.

## Rules for the recorder

1. **Real numbers only.** Every `metrics.*` field must come from actual measurement. No fake counters.
2. **Wall-time honesty.** `t` is real milliseconds. Don't compress.
3. **No PII in content.** Recorder scrubs prompts/outputs before writing. `<redacted>` tokens are fine.
4. **Deterministic `recordedAt`.** Set from system clock at trace start; don't update per-step.
5. **Atomic writes.** Write to `*.tmp` then rename, so partial traces aren't consumed.
6. **Version guard.** Recorder writes a schema version footer: `"$schema": 1`. Player asserts.

## Reproducibility & regression

Every trace is also a **regression artifact**. The recorder must emit enough metadata to determine whether a future run produced equivalent, better, or worse output.

### Reproducibility block (optional, recommended)

Add to the top level of both `swarm.json` and `baseline.json`:

```jsonc
{
  "reproducibility": {
    "modelVersion": "gpt-4o-2026-01-20",       // pinned model version, not floating alias
    "provider": "openai",
    "temperature": 0,                           // 0 when provider supports it
    "seed": 42,                                 // provider-specific seed (OpenAI, Anthropic seed param)
    "topP": 1.0,
    "maxTokens": 4096,
    "frameworkVersion": "1.0.3",
    "frameworkGitSha": "7614542",
    "workflowHash": "sha256:a4f1...",          // hash of workflow.yaml
    "promptHash": "sha256:c302...",            // hash of prompt.md
    "recorderVersion": "0.1.0",
    "environment": {
      "os": "linux",
      "javaVersion": "21.0.4",
      "timezoneOffset": "+02:00"
    }
  }
}
```

Recorder **must** write `reproducibility.frameworkGitSha` and `reproducibility.modelVersion` — those are the two columns the regression CLI joins on.

### History directory

Every run is archived, not overwritten:

```
demos/
  <slug>/
    runs/
      <model>/                                       # "latest" canonical — website reads this
        swarm.json
        baseline.json
    history/
      2026-04-18T12-00Z__fw-1.0.3__gpt-4o-2026-01-20/
        swarm.json
        baseline.json
      2026-05-15T08-30Z__fw-1.0.4__gpt-4o-2026-01-20/
        swarm.json
        baseline.json
```

On a new recording, the recorder:
1. Writes to `history/<ISO-timestamp>__fw-<fw-ver>__<model-ver>/`.
2. Copies to `runs/<model>/` **only if** the run passed validation (schema valid, no fatal errors, regression thresholds honored — or explicit `--force-promote` flag).

### Regression CLI

Part of the `demo-recorder` module: `RegressionRunner` main class.

Inputs: a demo slug + model. Reads `runs/<model>/` as the reference. Records a new run under `history/`. Compares:

| Check | Threshold | Action |
|---|---|---|
| Schema validity | must pass | FAIL |
| `metrics.costUsd` delta | > +20% | WARN, require review |
| `metrics.wallTimeMs` delta | > +30% | WARN, require review |
| `metrics.failures` delta | > 0 | WARN |
| `finalOutput.content` cosine similarity (TF-IDF or small embedding) | < 0.85 | WARN, require review |
| Step-kind histogram structural change | any new kinds missing | WARN |
| Tool-call count delta | > ±25% | INFO |

Output: a report JSON + a pass/warn/fail exit code for CI use. On explicit `--promote`, the new run overwrites `runs/<model>/`.

Integration points:
- **Per-release CI** in swarm-ai: after artifact deploy, run regression on all demos. Fail release on WARN without human ack.
- **Weekly model-drift cron**: same demos, same framework, compare against last-week baseline. Catches provider-side model updates.
- **Feeds Demo #1 "v1.0 vs v1.3"** — the `history/` directory is exactly the data that side-by-side plays back.

### Determinism notes

- OpenAI: `temperature=0, seed=42, top_p=1.0` is reproducible up to provider-side non-determinism (rare; document observed cases).
- Anthropic: `temperature=0` is reproducible; no seed as of 2026-04.
- Ollama / local Llama: `temperature=0, seed=42` is deterministic.
- For tool outputs (web-search, SEC filings), the recorder **must** capture the exact tool response payload in the trace — re-running wouldn't get byte-identical HTML. Replays compare against the captured payload, not the live web.

## Rules for the player

1. **Tolerate unknown `kind`.** Render as generic event. Never crash.
2. **Tolerate missing optional fields.** E.g. `tool_call.costUsd` may be absent.
3. **Clock-sync both panels.** Left and right play against the same elapsed-ms clock so metrics update in parallel.
4. **Step budget.** If a trace has >500 steps, virtualize the scrollback.
5. **Accessibility.** Every playback control has an ARIA label; scrubber is keyboard-seekable.
