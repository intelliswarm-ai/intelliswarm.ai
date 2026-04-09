/**
 * Contribution handlers.
 * Storage adapter is injected so the same logic works with
 * filesystem (Express) or DynamoDB (Lambda).
 *
 * Storage interface:
 *   save(contribution)  → void
 *   list()              → ContributionSummary[]
 *
 * When a contribution is received:
 *   1. Validate format (exportFormat === "swarmai-improvements")
 *   2. Save to storage
 *   3. Send email notification to contribute@intelliswarm.ai
 *   4. Create GitHub issue (if GITHUB_TOKEN is set)
 *   5. Return tracking ID
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
      status: 'PENDING',
      reviewedAt: null,
      reviewNotes: '',
      organizationName: organizationName || 'Anonymous',
      contactEmail: contactEmail || '',
      notes: notes || '',
      improvementsCount: improvements.length,
      frameworkVersion: improvementData.frameworkVersion || 'unknown',
      improvementData,
    };

    await storage.save(contribution);

    console.log(
      `[Contribution] ${trackingId}: ${improvements.length} improvements from "${organizationName || 'Anonymous'}" — status: PENDING`
    );

    // Email and GitHub issue are NOT sent here — they fire on APPROVAL
    // via handleReviewContribution()

    return {
      statusCode: 200,
      body: {
        success: true,
        trackingId,
        improvementsReceived: improvements.length,
        status: 'PENDING',
        message: 'Thank you for contributing. Your submission is pending review.',
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

/**
 * Send email notification for a new improvement contribution via AWS SES.
 * Non-blocking — email failures don't affect the contribution acceptance.
 */
async function sendImprovementEmail(contribution, improvements) {
  const toEmail = process.env.CONTRIBUTE_EMAIL || 'contribute@intelliswarm.ai';
  const sourceEmail = process.env.CONTACT_EMAIL || toEmail;

  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({ region: process.env.AWS_REGION || process.env.SES_REGION || 'eu-central-2' });

    const { trackingId, organizationName, contactEmail, notes, frameworkVersion, receivedAt } = contribution;

    // Categorize improvements by tier
    const tier1 = improvements.filter((i) => i.tier === 'TIER_1_AUTO' || i.tier === 'TIER_1_AUTOMATIC');
    const tier2 = improvements.filter((i) => i.tier === 'TIER_2_REVIEWED' || i.tier === 'TIER_2_REVIEW');
    const tier3 = improvements.filter((i) => i.tier === 'TIER_3_ARCHITECTURE' || i.tier === 'TIER_3_PROPOSAL');

    // Categorize by type
    const categories = {};
    improvements.forEach((imp) => {
      const cat = imp.category || 'UNKNOWN';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Estimate total token savings
    const totalTokenSavings = improvements
      .reduce((sum, imp) => sum + (imp.estimatedTokenSavings || 0), 0);

    const subject = `[SwarmAI Contribution] ${improvements.length} improvements from ${organizationName} (${trackingId})`;

    const body = [
      `New Self-Improvement Contribution Received`,
      `============================================`,
      ``,
      `Tracking ID:       ${trackingId}`,
      `Received:          ${receivedAt}`,
      `Organization:      ${organizationName}`,
      `Contact:           ${contactEmail || 'not provided'}`,
      `Framework Version: ${frameworkVersion}`,
      ``,
      notes ? `Notes: ${notes}\n` : '',
      `Summary`,
      `-------`,
      `Total improvements: ${improvements.length}`,
      `  Tier 1 (auto-merge):    ${tier1.length}`,
      `  Tier 2 (needs review):  ${tier2.length}`,
      `  Tier 3 (architecture):  ${tier3.length}`,
      ``,
      `Estimated token savings: ${totalTokenSavings.toLocaleString()} tokens/run`,
      ``,
      `Categories:`,
      ...Object.entries(categories).map(([cat, count]) => `  ${cat}: ${count}`),
      ``,
      `Improvement Details`,
      `-------------------`,
      ...improvements.map((imp, i) => [
        ``,
        `#${i + 1}: ${imp.category || 'UNKNOWN'} (${imp.tier || 'UNKNOWN'})`,
        `  Confidence:    ${imp.confidence ? (imp.confidence * 100).toFixed(0) + '%' : 'N/A'}`,
        `  Cross-valid:   ${imp.crossValidated ? 'Yes' : 'No'}`,
        `  Observations:  ${imp.supportingObservations || 'N/A'}`,
        `  Token savings: ${imp.estimatedTokenSavings ? imp.estimatedTokenSavings.toLocaleString() : 'N/A'}`,
        `  Condition:     ${JSON.stringify(imp.condition || {})}`,
        `  Recommendation: ${imp.recommendation || 'N/A'}`,
      ].join('\n')),
      ``,
      ``,
      `---`,
      `This contribution was submitted via the SwarmAI self-improvement pipeline.`,
      `The data is anonymized — no workflow content, user data, or API keys are included.`,
      ``,
      `To process: review the improvements above and create PRs for the intelligence files.`,
      `Raw data: check contributions/${trackingId}.json on the server.`,
    ].join('\n');

    await ses.send(new SendEmailCommand({
      Source: sourceEmail,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: body },
        },
      },
    }));

    console.log(`[Contribution] Email notification sent to ${toEmail}`);
  } catch (err) {
    // Email failures are non-fatal — the contribution is already saved
    console.warn('[Contribution] Email notification failed:', err.message);
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

/**
 * Review (approve/reject) a pending contribution.
 * On APPROVE: sends email + creates GitHub issue.
 * On REJECT: stores reason, no further action.
 */
async function handleReviewContribution(storage, trackingId, data) {
  try {
    if (!trackingId) {
      return { statusCode: 400, body: { error: 'trackingId is required' } };
    }

    const { action, reviewNotes } = data || {};
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return { statusCode: 400, body: { error: 'action must be APPROVE or REJECT' } };
    }

    let contribution;
    try {
      contribution = await storage.get(trackingId);
    } catch (getErr) {
      console.error('[Contribution] Failed to get contribution:', getErr);
      return { statusCode: 500, body: { error: 'Failed to read contribution: ' + getErr.message } };
    }

    if (!contribution) {
      return { statusCode: 404, body: { error: 'Contribution not found' } };
    }

    // Handle old contributions that don't have a status field
    const currentStatus = contribution.status || 'PENDING';
    if (currentStatus !== 'PENDING') {
      return {
        statusCode: 409,
        body: { error: `Contribution already ${currentStatus.toLowerCase()}`, currentStatus },
      };
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    try {
      await storage.update(trackingId, {
        status: newStatus,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes || '',
      });
    } catch (updateErr) {
      console.error('[Contribution] Failed to update status:', updateErr);
      return { statusCode: 500, body: { error: 'Failed to update contribution: ' + updateErr.message } };
    }

    console.log(`[Contribution] ${trackingId}: ${currentStatus} → ${newStatus}`);

    // On approval: send email and create GitHub issue (non-blocking)
    if (newStatus === 'APPROVED') {
      const improvements = contribution.improvementData?.improvements || [];
      try { await sendImprovementEmail(contribution, improvements); } catch (e) {
        console.warn('[Contribution] Email failed (non-fatal):', e.message);
      }
      try { await createGitHubIssue(contribution, improvements); } catch (e) {
        console.warn('[Contribution] GitHub issue failed (non-fatal):', e.message);
      }
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        trackingId,
        status: newStatus,
        message: newStatus === 'APPROVED'
          ? 'Contribution approved.'
          : 'Contribution rejected.',
      },
    };
  } catch (error) {
    console.error('[Contribution] Review error:', error);
    return { statusCode: 500, body: { error: 'Failed to review contribution: ' + error.message } };
  }
}

async function handleGetContribution(storage, trackingId) {
  try {
    if (!trackingId) {
      return { statusCode: 400, body: { error: 'trackingId is required' } };
    }
    const contribution = await storage.get(trackingId);
    if (!contribution) {
      return { statusCode: 404, body: { error: 'Contribution not found' } };
    }
    return { statusCode: 200, body: contribution };
  } catch (error) {
    return { statusCode: 500, body: { error: 'Failed to get contribution' } };
  }
}

module.exports = { handleContribute, handleListContributions, handleGetContribution, handleReviewContribution };
