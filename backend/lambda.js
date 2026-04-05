/**
 * AWS Lambda entry point.
 *
 * Routes API Gateway HTTP API events to the shared handlers.
 * Storage backend is determined by STORAGE_BACKEND env var
 * (typically "dynamodb" or "s3" for Lambda deployments).
 *
 * Deploy to eu-central-2 (Zurich) for data residency.
 */

const { createStorage } = require('./storage');
const { handleHealth } = require('./handlers/health');
const { handleGetNews, handleCreateNews } = require('./handlers/news');
const { handleContribute, handleListContributions } = require('./handlers/contribute');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let storage;

exports.handler = async (event) => {
  // Lazy-init storage on first invocation
  if (!storage) {
    storage = createStorage();
  }

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.rawPath || event.path;

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  let result;

  try {
    switch (true) {
      case path === '/api/health' && method === 'GET':
        result = await handleHealth({ runtime: 'lambda-zurich' });
        break;

      case path === '/api/news' && method === 'GET':
        result = await handleGetNews(storage.news, event.queryStringParameters || {});
        break;

      case path === '/api/news' && method === 'POST':
        result = await handleCreateNews(storage.news, JSON.parse(event.body || '{}'));
        break;

      case path === '/api/contribute' && method === 'POST':
        result = await handleContribute(storage.contributions, JSON.parse(event.body || '{}'));
        break;

      case path === '/api/contributions' && method === 'GET':
        result = await handleListContributions(storage.contributions);
        break;

      default:
        result = { statusCode: 404, body: { error: 'Not found' } };
    }
  } catch (err) {
    console.error('Lambda error:', err);
    result = { statusCode: 500, body: { error: 'Internal server error' } };
  }

  return {
    statusCode: result.statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(result.body),
  };
};
