/**
 * Self-improvement community ledger handlers.
 *
 * Two endpoints:
 *   POST /api/v1/self-improving/telemetry   — accept a daily rollup (opt-in)
 *   GET  /api/v1/self-improving/ledger      — public aggregate
 *
 * Storage interface (ledger):
 *   putDailyRollup(record)                  → void (idempotent by installationId+reportDate)
 *   listDailyRollups(sinceIsoDate)          → rollup[]
 *
 * Design choices (see docs/internal/SHOW_HN_DRAFT.md §ledger):
 *   - Opt-in only. SwarmAI deployments default telemetryEnabled=false.
 *   - Daily rollup, not per-run — reduces PII risk and attack surface.
 *   - Separates "inputs" (tokens invested = fuel) from "outputs" (proposals, PRs,
 *     anti-patterns = value) so the public page can lead with the output ratio.
 *   - Global aggregate only, never per-org, to remove incentive to inflate.
 *   - Installation ID is an anonymous random UUID generated once per deployment;
 *     it does not identify users or organizations.
 */

const CATEGORY_WHITELIST = new Set([
  'CONVERGENCE_DEFAULT',
  'TOOL_ROUTING',
  'ANTI_PATTERN',
  'PROMPT_EFFICIENCY',
  'SKILL_PROMOTION',
  'EXPENSIVE_TASK',
  'FAILURE_PATTERN',
  'UNKNOWN',
]);

// Hard caps on per-report values — anything above is dropped as suspicious.
// A single deployment reporting >1B tokens/day or >100K workflow runs/day is
// either a bug or an attempt to inflate the community counter.
const LIMITS = {
  workflowRuns: 100_000,
  tokensInvested: 1_000_000_000,
  observationsCollected: 10_000_000,
  proposalsGenerated: 100_000,
  tier1AutoEligible: 100_000,
  tier2PRsFiled: 100_000,
  tier3Proposals: 100_000,
  antiPatternsDiscovered: 100_000,
  skillsPromoted: 100_000,
  categoryCount: 100_000,
  bodyBytes: 10 * 1024, // 10KB
};

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FRAMEWORK_VERSION_PATTERN = /^[0-9a-zA-Z.\-+]{1,32}$/;

function clampInt(value, max) {
  const n = Number.isFinite(value) ? Math.floor(value) : 0;
  if (n < 0) return 0;
  return Math.min(n, max);
}

function validateAndNormalize(data) {
  if (!data || typeof data !== 'object') {
    return { error: 'body must be a JSON object' };
  }

  const bodySize = Buffer.byteLength(JSON.stringify(data), 'utf8');
  if (bodySize > LIMITS.bodyBytes) {
    return { error: `payload too large (max ${LIMITS.bodyBytes} bytes)` };
  }

  const { installationId, reportDate, frameworkVersion, inputs, outputs, categories, runtime } = data;

  if (!installationId || !UUID_PATTERN.test(installationId)) {
    return { error: 'installationId must be a UUID' };
  }
  if (!reportDate || !DATE_PATTERN.test(reportDate)) {
    return { error: 'reportDate must match YYYY-MM-DD' };
  }
  if (!frameworkVersion || !FRAMEWORK_VERSION_PATTERN.test(frameworkVersion)) {
    return { error: 'frameworkVersion is required and must match semver-like pattern' };
  }

  // Reject dates more than 1 day in the future (clock skew) or > 90 days old.
  const reportTime = Date.parse(reportDate + 'T00:00:00Z');
  if (Number.isNaN(reportTime)) {
    return { error: 'reportDate is invalid' };
  }
  const now = Date.now();
  if (reportTime > now + 24 * 3600 * 1000) {
    return { error: 'reportDate cannot be in the future' };
  }
  if (reportTime < now - 90 * 24 * 3600 * 1000) {
    return { error: 'reportDate is older than the 90-day retention window' };
  }

  const rt = runtime && typeof runtime === 'object' ? runtime : {};

  const normalizedCategories = {};
  if (categories && typeof categories === 'object') {
    for (const [key, value] of Object.entries(categories)) {
      if (CATEGORY_WHITELIST.has(key)) {
        normalizedCategories[key] = clampInt(value, LIMITS.categoryCount);
      }
    }
  }

  const record = {
    installationId,
    reportDate,
    frameworkVersion,
    runtime: {
      javaVersion: String(rt.javaVersion || '').slice(0, 16),
      os: String(rt.os || '').slice(0, 16),
    },
    inputs: {
      workflowRuns: clampInt(inputs?.workflowRuns, LIMITS.workflowRuns),
      tokensInvested: clampInt(inputs?.tokensInvested, LIMITS.tokensInvested),
      observationsCollected: clampInt(inputs?.observationsCollected, LIMITS.observationsCollected),
    },
    outputs: {
      proposalsGenerated: clampInt(outputs?.proposalsGenerated, LIMITS.proposalsGenerated),
      tier1AutoEligible: clampInt(outputs?.tier1AutoEligible, LIMITS.tier1AutoEligible),
      tier2PRsFiled: clampInt(outputs?.tier2PRsFiled, LIMITS.tier2PRsFiled),
      tier3Proposals: clampInt(outputs?.tier3Proposals, LIMITS.tier3Proposals),
      antiPatternsDiscovered: clampInt(outputs?.antiPatternsDiscovered, LIMITS.antiPatternsDiscovered),
      skillsPromoted: clampInt(outputs?.skillsPromoted, LIMITS.skillsPromoted),
    },
    categories: normalizedCategories,
    receivedAt: new Date().toISOString(),
  };

  return { record };
}

async function handleTelemetryReport(storage, data) {
  try {
    const { record, error } = validateAndNormalize(data);
    if (error) {
      return { statusCode: 400, body: { error } };
    }

    await storage.putDailyRollup(record);

    console.log(
      `[Ledger] ${record.installationId.slice(0, 8)}… ${record.reportDate} ` +
      `v${record.frameworkVersion} — ` +
      `${record.inputs.workflowRuns} runs, ${record.inputs.tokensInvested} tokens, ` +
      `${record.outputs.proposalsGenerated} proposals`
    );

    return {
      statusCode: 200,
      body: {
        success: true,
        accepted: true,
        reportDate: record.reportDate,
      },
    };
  } catch (err) {
    console.error('[Ledger] Telemetry error:', err);
    return { statusCode: 500, body: { error: 'Failed to record telemetry' } };
  }
}

/**
 * Aggregate all rollups within the reporting window into a single public snapshot.
 *
 * Reporting window: last 30 days (configurable via LEDGER_WINDOW_DAYS).
 * Older rollups are kept on disk but excluded from the public counter so the
 * "community is active" signal doesn't hide behind a long tail of stale data.
 */
async function handlePublicLedger(storage) {
  try {
    const windowDays = parseInt(process.env.LEDGER_WINDOW_DAYS || '30', 10);
    const sinceDate = new Date(Date.now() - windowDays * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    const rollups = await storage.listDailyRollups(sinceDate);

    const installations = new Set();
    const categoryTotals = {};
    let firstReportAt = null;

    const totals = {
      inputs: { totalWorkflowRuns: 0, totalTokensInvested: 0, totalObservationsCollected: 0 },
      outputs: {
        totalProposalsGenerated: 0,
        totalTier1AutoEligible: 0,
        totalTier2PRsFiled: 0,
        totalTier3Proposals: 0,
        totalAntiPatternsDiscovered: 0,
        totalSkillsPromoted: 0,
      },
    };

    for (const r of rollups) {
      installations.add(r.installationId);
      if (!firstReportAt || r.receivedAt < firstReportAt) firstReportAt = r.receivedAt;

      totals.inputs.totalWorkflowRuns += r.inputs.workflowRuns;
      totals.inputs.totalTokensInvested += r.inputs.tokensInvested;
      totals.inputs.totalObservationsCollected += r.inputs.observationsCollected;
      totals.outputs.totalProposalsGenerated += r.outputs.proposalsGenerated;
      totals.outputs.totalTier1AutoEligible += r.outputs.tier1AutoEligible;
      totals.outputs.totalTier2PRsFiled += r.outputs.tier2PRsFiled;
      totals.outputs.totalTier3Proposals += r.outputs.tier3Proposals;
      totals.outputs.totalAntiPatternsDiscovered += r.outputs.antiPatternsDiscovered;
      totals.outputs.totalSkillsPromoted += r.outputs.skillsPromoted;

      for (const [k, v] of Object.entries(r.categories || {})) {
        categoryTotals[k] = (categoryTotals[k] || 0) + v;
      }
    }

    const totalProposals = totals.outputs.totalProposalsGenerated;
    const shipEligible = totals.outputs.totalTier1AutoEligible + totals.outputs.totalTier2PRsFiled;
    const tokensInvested = totals.inputs.totalTokensInvested;

    const ratios = {
      proposalsPerMillionTokens: tokensInvested > 0
        ? +(totalProposals / (tokensInvested / 1_000_000)).toFixed(2)
        : 0,
      shipRatePercent: totalProposals > 0
        ? +((shipEligible / totalProposals) * 100).toFixed(1)
        : 0,
    };

    return {
      statusCode: 200,
      body: {
        snapshotTime: new Date().toISOString(),
        coverage: {
          reportingInstallations: installations.size,
          reportingWindowDays: windowDays,
          firstReportAt,
        },
        inputs: totals.inputs,
        outputs: totals.outputs,
        categories: categoryTotals,
        ratios,
      },
    };
  } catch (err) {
    console.error('[Ledger] Aggregate error:', err);
    return { statusCode: 500, body: { error: 'Failed to build ledger snapshot' } };
  }
}

module.exports = {
  handleTelemetryReport,
  handlePublicLedger,
  // Exposed for tests
  validateAndNormalize,
  CATEGORY_WHITELIST,
  LIMITS,
};
