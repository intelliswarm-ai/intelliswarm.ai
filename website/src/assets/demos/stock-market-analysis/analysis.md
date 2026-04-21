## What you're looking at

Same prompt — institutional-quality AAPL investment analysis. **Left: SwarmAI** (7 agents, Finnhub + SEC XBRL tools, cited output). **Right: raw LLM** (one call, no tools, no memory).

## On GPT-4o

<div class="compare-grid">
  <div class="compare-card swarm popular">
    <div class="card-badge">Most useful</div>
    <div class="card-tag swarm-tag">SwarmAI</div>
    <h4 class="card-verdict">HOLD <span class="conf">(HIGH)</span></h4>
    <p class="card-reason">Justified by P/E 33.68 and current ratio 0.89</p>
    <ul class="card-list">
      <li>Pulls real FY-2025 filings: mcap <b>$3.97T</b>, revenue <b>$416B</b>, P/E <b>33.68</b>, current ratio <b>0.89</b></li>
      <li>Every figure cites Finnhub or the 10-K</li>
      <li>Defensible at an investment committee</li>
    </ul>
  </div>
  <div class="compare-card baseline">
    <div class="card-tag baseline-tag">Baseline</div>
    <h4 class="card-verdict">No call</h4>
    <p class="card-reason">Refuses to invent numbers</p>
    <ul class="card-list negative">
      <li>Output is a template: <code>[Insert Current Price]</code>, <code>[Insert P/E Ratio]</code></li>
      <li>Honest — but unusable at an investment committee</li>
    </ul>
  </div>
</div>

**Gain:** an LLM that would otherwise stonewall becomes an analyst-grade tool with auditable output.

## On GPT-5.4 mini

<div class="compare-grid">
  <div class="compare-card swarm popular">
    <div class="card-badge">Most useful</div>
    <div class="card-tag swarm-tag">SwarmAI</div>
    <h4 class="card-verdict">BUY <span class="conf">(HIGH)</span></h4>
    <p class="card-reason">2.3× longer report, grounded in $416B revenue cited to the 10-K</p>
    <ul class="card-list">
      <li>Same pipeline, same filings, same data</li>
      <li>Every number traces back to Finnhub or the 10-K</li>
      <li>Defensible in a meeting</li>
    </ul>
  </div>
  <div class="compare-card baseline">
    <div class="card-tag baseline-tag">Baseline</div>
    <h4 class="card-verdict">BUY <span class="conf warn">(fabricated)</span></h4>
    <p class="card-reason">Commits to a specific <b>$235 12-month price target</b> out of thin air</p>
    <ul class="card-list negative">
      <li>Zero tools called, zero filings consulted</li>
      <li>Textbook confident hallucination</li>
    </ul>
  </div>
</div>

**Gain:** proof that citation discipline isn't optional — without it, the model fabricates plausible-looking specifics.

## Why the two models disagree (HOLD vs BUY)

Identical numbers, different conclusion. Frontier models read facts differently — the framework's job is making *both* auditable, not picking the winner.

## Metrics

<div class="metrics-grid">
  <div class="metric-card">
    <div class="metric-label">Wall time</div>
    <div class="metric-row"><span class="pill swarm-pill">Swarm 4o</span><span class="metric-val">46.6 s</span></div>
    <div class="metric-row"><span class="pill baseline-pill">Baseline 4o</span><span class="metric-val">6.8 s</span></div>
    <div class="metric-row"><span class="pill swarm-pill">Swarm 5.4-mini</span><span class="metric-val">45.5 s</span></div>
    <div class="metric-row"><span class="pill baseline-pill">Baseline 5.4-mini</span><span class="metric-val">8.4 s</span></div>
  </div>
  <div class="metric-card">
    <div class="metric-label">Tokens</div>
    <div class="metric-row"><span class="pill swarm-pill">Swarm 4o</span><span class="metric-val">143,732</span></div>
    <div class="metric-row"><span class="pill baseline-pill">Baseline 4o</span><span class="metric-val">762</span></div>
    <div class="metric-row"><span class="pill swarm-pill">Swarm 5.4-mini</span><span class="metric-val">162,468</span></div>
    <div class="metric-row"><span class="pill baseline-pill">Baseline 5.4-mini</span><span class="metric-val">1,055</span></div>
  </div>
  <div class="metric-card">
    <div class="metric-label">Output</div>
    <div class="metric-row"><span class="pill swarm-pill">Swarm 4o</span><span class="metric-val">3.3k chars, cited</span></div>
    <div class="metric-row"><span class="pill baseline-pill">Baseline 4o</span><span class="metric-val">placeholders</span></div>
    <div class="metric-row"><span class="pill swarm-pill">Swarm 5.4-mini</span><span class="metric-val">7.8k chars, cited</span></div>
    <div class="metric-row"><span class="pill baseline-pill">Baseline 5.4-mini</span><span class="metric-val">$235, no source</span></div>
  </div>
</div>

Switch the model chips above to replay either side.
