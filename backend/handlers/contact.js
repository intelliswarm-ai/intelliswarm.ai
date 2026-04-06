/**
 * Contact form handler.
 * Stores submissions, sends email notification via SES, and optionally creates a GitHub issue.
 */

async function sendEmailNotification(submission) {
  const toEmail = process.env.CONTACT_EMAIL;
  if (!toEmail) return;

  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({ region: process.env.AWS_REGION || process.env.SES_REGION || 'eu-central-2' });

    const { contactId, firstName, lastName, companyName, jobTitle, emailAddress, phoneNumber, message, receivedAt } = submission;

    const subject = `[IntelliSwarm Contact] ${firstName} ${lastName}${companyName ? ` — ${companyName}` : ''}`;

    const body = [
      `New contact form submission (${contactId})`,
      `Received: ${receivedAt}`,
      ``,
      `Name:     ${firstName} ${lastName}`,
      `Email:    ${emailAddress}`,
      `Company:  ${companyName || 'not provided'}`,
      `Job Title: ${jobTitle || 'not provided'}`,
      `Phone:    ${phoneNumber || 'not provided'}`,
      ``,
      `--- Message ---`,
      message,
    ].join('\n');

    await ses.send(new SendEmailCommand({
      Source: toEmail,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: body },
        },
      },
    }));

    console.log(`[Contact] Email sent to ${toEmail}`);
  } catch (err) {
    console.warn('[Contact] Email notification failed:', err.message);
  }
}

async function handleContact(storage, data) {
  try {
    const { firstName, lastName, companyName, jobTitle, emailAddress, phoneNumber, message } = data;

    if (!firstName || !lastName || !emailAddress || !message) {
      return {
        statusCode: 400,
        body: { error: 'firstName, lastName, emailAddress, and message are required' },
      };
    }

    const contactId = `CONTACT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const submission = {
      contactId,
      receivedAt: new Date().toISOString(),
      firstName,
      lastName,
      companyName: companyName || '',
      jobTitle: jobTitle || '',
      emailAddress,
      phoneNumber: phoneNumber || '',
      message,
    };

    await storage.save(submission);

    console.log(`[Contact] ${contactId}: ${firstName} ${lastName} <${emailAddress}>`);

    // Send email notification via SES
    await sendEmailNotification(submission);

    // Create GitHub issue for the team to follow up
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      try {
        const issueBody = [
          `## New Contact Form Submission`,
          ``,
          `**Name:** ${firstName} ${lastName}`,
          `**Email:** ${emailAddress}`,
          `**Company:** ${companyName || 'not provided'}`,
          `**Job Title:** ${jobTitle || 'not provided'}`,
          `**Phone:** ${phoneNumber || 'not provided'}`,
          ``,
          `### Message`,
          message,
        ].join('\n');

        await fetch('https://api.github.com/repos/intelliswarm-ai/swarm-ai/issues', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `[Contact] ${firstName} ${lastName} - ${companyName || 'Individual'}`,
            body: issueBody,
            labels: ['contact'],
          }),
        });
      } catch (ghErr) {
        console.warn('[Contact] GitHub notification failed:', ghErr.message);
      }
    }

    return {
      statusCode: 200,
      body: { success: true, contactId, message: 'Thank you for reaching out.' },
    };
  } catch (error) {
    console.error('[Contact] Error:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to process contact submission' },
    };
  }
}

module.exports = { handleContact };
