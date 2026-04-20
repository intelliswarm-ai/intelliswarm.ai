---
title: "Introducing SwarmAI: A Multi-Agent Orchestration Framework for Java"
slug: introducing-swarmai-framework
date: 2026-04-11
author: IntelliSwarm Team
tags: [open-source, java, multi-agent, spring-boot, reinforcement-learning, enterprise]
category: announcement
summary: "A Java-native multi-agent framework with 7 process types, RL-driven decisions, and enterprise governance — here's why we built it and how it works."
coverImage: 
---

## The Gap We Saw

In early 2025, the multi-agent landscape looked like this: LangChain, CrewAI, AutoGen, OpenAI Swarm — all Python, all single-user, all missing the things enterprises actually need to ship agents to production.

Meanwhile, Java runs 90% of enterprise backends. Spring Boot is the de-facto standard for production services. But if you wanted to orchestrate AI agents in the JVM ecosystem, your options were essentially "write it yourself."

We built SwarmAI to close that gap. Not a thin wrapper around LLM APIs — a production-grade orchestration framework with governance, observability, and the kind of reliability guarantees that enterprises expect from their infrastructure.

Today, we're open-sourcing it. **1,128 tests passing. 70,000+ lines of code. 11 Maven modules. Apache 2.0 for core.**

## What SwarmAI Actually Is

SwarmAI is a multi-agent orchestration framework for Java 21, built on Spring Boot 3.4 and Spring AI 1.0.4 GA. It lets you define workflows where multiple AI agents collaborate, using any combination of 8 orchestration patterns:

```java
CompiledSwarm swarm = SwarmGraph.create()
    .addAgent(researcher)
    .addAgent(analyst)
    .addAgent(writer)
    .addTask(researchTask)
    .addTask(analysisTask)
    .addTask(reportTask)
    .process(ProcessType.HIERARCHICAL)
    .memory(memory)
    .compileOrThrow();  // Validates BEFORE execution

SwarmOutput output = swarm.kickoff(Map.of("topic", "AI agents in production"));
```

Notice `compileOrThrow()`. SwarmAI uses a sealed lifecycle — **Build, Compile, Execute** — that validates agent references, task dependencies, and process requirements at compile time, not when your agents are mid-execution with a half-spent token budget.

## Eight Process Types

This is where the orchestration density matters. Most frameworks give you one or two patterns and expect you to compose everything from primitives. We shipped eight:

| Process | What It Does |
|---------|-------------|
| **Sequential** | Tasks run in dependency order, each receiving prior outputs |
| **Parallel** | Independent tasks run concurrently with synchronization barriers |
| **Hierarchical** | Manager agent creates plans, delegates to specialists, synthesizes |
| **Iterative** | Execute-review-refine loop until reviewer approves or max iterations |
| **Self-Improving** | Iterative + dynamic skill generation when capability gaps are detected |
| **Swarm** | Distributed fan-out with independent agents per target |
| **Distributed** | RAFT consensus for multi-node coordination |
| **Composite** | Chain any of the above into a DAG pipeline |

The Composite type is what makes this practical. Real enterprise workflows aren't just "sequential" or "parallel" — they're "fan-out in parallel, then hierarchical analysis, then iterative refinement." CompositeProcess lets you express that declaratively:

```yaml
swarm:
  name: "Audit Pipeline"
  process: COMPOSITE
  stages:
    - name: discovery
      process: PARALLEL
      tasks: [scan_services, scan_configs, scan_deps]
    - name: analysis
      process: HIERARCHICAL
      tasks: [triage, deep_analysis, risk_scoring]
    - name: reporting
      process: ITERATIVE
      tasks: [draft_report, review_report]
```

## Dynamic Skill Generation

When an agent hits a capability gap at runtime, SwarmAI's skill generation pipeline can produce a new tool on the fly:

1. **Gap detection** — If an agent can't complete a task, the `SkillGapAnalyzer` identifies what's missing
2. **Skill generation** — The LLM writes a new tool in Groovy, complete with input schema and test cases
3. **Validation** — The skill runs in a sandbox. Security scan. Test execution. Deduplication check against existing skills
4. **Registration** — Valid skills enter the registry as CANDIDATE, graduate to ACTIVE after sustained successful use

## Reinforcement Learning, Not Heuristics

Three decisions in the iterative loop are genuinely hard:

- **Should we generate a skill?** (expensive, might not help)
- **Should we stop iterating?** (premature stopping wastes potential; late stopping wastes tokens)
- **Which agent should handle this?** (selection among candidates)

Most frameworks hardcode thresholds. We implemented three RL policy engines:

```java
public interface PolicyEngine {
    SkillDecision shouldGenerateSkill(SkillGenerationContext context);
    boolean shouldStopIteration(ConvergenceContext context);
    double[] getSelectionWeights(SelectionContext context);
    void recordOutcome(Decision decision, Outcome outcome);
}
```

| Policy | Algorithm | Cold Start | Use Case |
|--------|-----------|-----------|----------|
| **HeuristicPolicy** | Static weighted thresholds | None | Default, safe baseline |
| **LearningPolicy** | LinUCB contextual bandits + Thompson Sampling | ~50 decisions | Production: learns within a session |
| **DeepRLPolicy** | DQN with experience replay + dual networks | ~500 steps | Enterprise: learns across sessions |

The LinUCB implementation runs on 8-dimensional context vectors (task complexity, agent capability, budget remaining, skill registry size, etc.) and achieves 656 cumulative regret over 1,000 decisions — **4-12x better than Monte Carlo baselines** depending on noise conditions. We validated this across 30 random seeds per configuration with statistical significance (Cohen's d > 2.0).

This isn't a marketing claim. The [benchmark results](https://github.com/intelliswarm-ai/swarm-ai/blob/main/docs/benchmarks/BENCHMARK_RESULTS.md) are published with methodology.

## Enterprise from Day 1, Not Bolted On

We've seen too many frameworks add "enterprise features" as an afterthought — a middleware layer that doesn't integrate cleanly, or a platform dependency that locks you in. SwarmAI's enterprise capabilities are architectural:

**Multi-Tenancy** — `TenantContext` propagates via ThreadLocal with `ObservabilityContext.Snapshot` for async operations. Memory and knowledge stores use prefix-scoped isolation (`tenantId::key`). Cross-tenant data leakage is architecturally prevented, not just policy-guarded.

**Governance Gates** — Four trigger points (BEFORE_TASK, AFTER_TASK, BEFORE_SKILL_GEN, AFTER_SKILL_GEN) where workflows pause for human approval. No agent runs unchecked in production.

**Budget Enforcement** — Token and cost tracking per model, per workflow, per tenant. Three enforcement modes: HARD_STOP (kill the workflow), WARN (log and continue), SOFT_LIMIT (graceful degradation). BudgetExceededException carries the exact spent/limit/remaining values.

**Tool Permissions** — Every tool declares a permission level: READ_ONLY, WORKSPACE_WRITE, or DANGEROUS. Every agent declares what it's allowed to use. The framework enforces this at execution time. An LLM can't social-engineer its way to a higher permission level because the enforcement happens in Java, not in the prompt.

```java
Agent researcher = Agent.builder()
    .role("Research Analyst")
    .goal("Find accurate information")
    .backstory("Careful researcher who verifies sources")
    .chatClient(chatClient)
    .tools(List.of(webSearchTool, pdfReadTool))
    .permissionMode(PermissionLevel.READ_ONLY)  // Cannot write files or execute code
    .maxTurns(5)
    .build();
```

**Audit Trail** — `AuditSink` SPI with `JdbcAuditSink` implementation. Flyway-managed schema. Every agent action, tool call, approval decision, and budget check is recorded with correlation IDs for full execution replay.

## Zero-Code YAML DSL

Not everyone wants to write Java. SwarmAI includes a YAML DSL with 28 definition types that covers the full feature surface:

```yaml
swarm:
  name: "Customer Research Pipeline"
  process: SELF_IMPROVING
  verbose: true

  agents:
    researcher:
      role: "Market Intelligence Analyst"
      goal: "Find comprehensive competitive intelligence"
      backstory: "15 years of market research experience"
      maxTurns: 3
      tools: [web-search, web-scrape, sec-filings]
      permissionMode: READ_ONLY

    analyst:
      role: "Strategy Consultant"
      goal: "Synthesize research into actionable insights"
      backstory: "Former McKinsey partner"
      maxTurns: 2
      tools: [data-analysis, csv-analysis]

  tasks:
    research:
      description: "Research {{company}} competitive landscape"
      agent: researcher
      expectedOutput: "Comprehensive market analysis with sources"

    analysis:
      description: "Create strategic recommendations from research"
      agent: analyst
      dependsOn: [research]
      outputFormat: MARKDOWN
      outputFile: "strategy-report.md"

  governance:
    budget:
      tokenLimit: 150000
      enforcementMode: HARD_STOP
    approvalGates:
      - trigger: AFTER_TASK
        taskId: research
        requiredApprovals: 1
```

The DSL compiles to the same `CompiledSwarm` as the Java API. Same validation. Same sealed lifecycle.

## 25 Built-In Tools

We shipped with production-ready tools across six categories:

**Web:** web_search, web_scrape, http_request, headless_browser
**File & Data:** file_read, file_write, directory_read, pdf_read, csv_analysis, json_transform, xml_parse, database_query
**Compute:** code_execution (Groovy sandbox), calculator, data_analysis, semantic_search
**Communication:** email (SMTP), slack_webhook
**Specialized:** sec_filings (10-K/10-Q/8-K parsing), report_generator, cve_lookup, github_pr_tool
**Integration:** mcp_adapter (Model Context Protocol bridging)

The MCP adapter is worth highlighting — it bridges SwarmAI's tool system to the emerging [Model Context Protocol](https://modelcontextprotocol.io/) ecosystem via stdio transport, letting you connect any MCP-compatible tool server.

## 5-Layer Observability

We built observability into the framework, not as a logging library:

1. **Context propagation** — `ObservabilityContext` carries correlationId, tenantId, userId via ThreadLocal with `Snapshot` capture for async operations
2. **Structured events** — `SwarmEvent` / `EnrichedSwarmEvent` published through Spring's event system
3. **Decision tracing** — `DecisionTracer` records every RL decision, approval outcome, and skill generation attempt
4. **Metrics** — Micrometer-based metrics (Prometheus-compatible): agent latency, tool call counts, budget consumption, skill generation success rates
5. **Health checks** — Spring Boot Actuator indicators for memory, budget, and event store health

## RAFT Consensus for Distributed Agents

For workflows that exceed single-node capacity, the `swarmai-distributed` module implements RAFT consensus for multi-node agent coordination:

- Leader election and log replication
- Goal-based work partitioning across nodes
- Heartbeat-based failure detection
- Cross-node intelligence mesh for shared learning

This isn't theoretical — it's designed for use cases like auditing 10,000+ microservices or processing millions of documents where no single JVM has enough capacity.

## Why This Matters

The multi-agent pattern is moving from experiment to infrastructure. The frameworks that win will be the ones that treat agents like production services — with governance, observability, reliability, and cost controls.

We built SwarmAI for the Java ecosystem because that's where enterprise production runs. We built governance in from day one because trust is the prerequisite for enterprise adoption.

**The framework is open-source and available now:**

- [GitHub Repository](https://github.com/intelliswarm-ai/swarm-ai)
- [Getting Started Guide](https://github.com/intelliswarm-ai/swarm-ai/blob/main/GETTING_STARTED.md)
- [RL Benchmark Results](https://github.com/intelliswarm-ai/swarm-ai/blob/main/docs/benchmarks/BENCHMARK_RESULTS.md)

We'd love your feedback, contributions, and hard questions. File an issue, open a PR, or just tell us what we got wrong — that's how frameworks get better.
