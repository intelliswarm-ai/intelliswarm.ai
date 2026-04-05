/**
 * Contribution handlers.
 * Storage adapter is injected so the same logic works with
 * filesystem (Express) or DynamoDB (Lambda).
 *
 * Storage interface:
 *   save(contribution)  → void
 *   list()              → ContributionSummary[]
 */

async function handleContribute(storage, data) {
  try {
    const { improvementData, organizationName, contactEmail, notes } = data;

    if (!improvementData) {
      return { statusCode: 400, body: { error: 'improvementData is required' } };
    }

    if (improvementData.exportFormat !== 'swarmai-improvements') {
      return {
        statusCode: 400,
        body: { error: 'Invalid format. Expected exportFormat: "swarmai-improvements"' },
      };
    }

    const improvements = improvementData.improvements || [];
    const trackingId = `CONTRIB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const contribution = {
      trackingId,
      receivedAt: new Date().toISOString(),
      organizationName: organizationName || 'Anonymous',
      contactEmail: contactEmail || '',
      notes: notes || '',
      improvementsCount: improvements.length,
      frameworkVersion: improvementData.frameworkVersion || 'unknown',
      improvementData,
    };

    await storage.save(contribution);

    console.log(
      `[Contribution] ${trackingId}: ${improvements.length} improvements from "${organizationName || 'Anonymous'}"`
    );

    // Create GitHub issue if token is configured
    await createGitHubIssue(contribution, improvements);

    return {
      statusCode: 200,
      body: {
        success: true,
        trackingId,
        improvementsAccepted: improvements.length,
        message: 'Thank you for contributing back to SwarmAI.',
      },
    };
  } catch (error) {
    console.error('[Contribution] Error:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to process contribution', details: error.message },
    };
  }
}

async function handleListContributions(storage) {
  try {
    const contributions = await storage.list();
    return { statusCode: 200, body: { contributions, total: contributions.length } };
  } catch (error) {
    return { statusCode: 500, body: { error: 'Failed to list contributions' } };
  }
}

async function createGitHubIssue(contribution, improvements) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return;

  try {
    const { trackingId, organizationName, contactEmail, notes } = contribution;
    const version = contribution.frameworkVersion;

    const issueBody = [
      `## New Improvement Contribution`,
      ``,
      `**Tracking ID:** ${trackingId}`,
      `**Organization:** ${organizationName}`,
      `**Framework Version:** ${version}`,
      `**Improvements:** ${improvements.length}`,
      `**Contact:** ${contactEmail || 'not provided'}`,
      ``,
      notes ? `**Notes:** ${notes}\n` : '',
      `### Breakdown`,
      `- Tier 1 (Auto-merge): ${improvements.filter((i) => i.tier === 'TIER_1_AUTO').length}`,
      `- Tier 2 (PR Review): ${improvements.filter((i) => i.tier === 'TIER_2_REVIEWED').length}`,
      `- Tier 3 (Architecture): ${improvements.filter((i) => i.tier === 'TIER_3_ARCHITECTURE').length}`,
    ].join('\n');

    const ghResponse = await fetch(
      'https://api.github.com/repos/intelliswarm-ai/swarm-ai/issues',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[Contribution] ${improvements.length} improvements from ${organizationName}`,
          body: issueBody,
          labels: ['self-improving', 'contribution'],
        }),
      }
    );

    if (ghResponse.ok) {
      const issue = await ghResponse.json();
      console.log(`[Contribution] GitHub issue created: ${issue.html_url}`);
    } else {
      console.warn(`[Contribution] GitHub issue creation failed: ${ghResponse.status}`);
    }
  } catch (ghErr) {
    console.warn('[Contribution] GitHub notification failed:', ghErr.message);
  }
}

module.exports = { handleContribute, handleListContributions };
