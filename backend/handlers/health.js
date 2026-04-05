/**
 * Health check handler.
 * @param {object} context - { runtime: string }
 * @returns {{ statusCode: number, body: object }}
 */
async function handleHealth(context = {}) {
  return {
    statusCode: 200,
    body: {
      status: 'ready',
      timestamp: new Date().toISOString(),
      runtime: context.runtime || 'unknown',
    },
  };
}

module.exports = { handleHealth };
