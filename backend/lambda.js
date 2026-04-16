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
const {
  handleContribute,
  handleListContributions,
  handleGetContribution,
  handleReviewContribution,
  handleCreateImprovementIssue,
  handleDeleteContribution,
} = require('./handlers/contribute');
const { handleTelemetryReport, handlePublicLedger } = require('./handlers/ledger');
const { handleContact } = require('./handlers/contact');
const { handleLogin, handleAuthCheck, isAdminAuthenticated } = require('./handlers/admin-auth');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Public GET endpoints whose responses are safe to cache at CloudFront.
// Matched exactly against the request path.
const CACHEABLE_GET_PATHS = new Set(['/api/news', '/api/health', '/api/v1/self-improving/ledger']);
const CACHE_CONTROL_PUBLIC =
  'public, max-age=300, s-maxage=600, stale-while-revalidate=3600';

let storage;

exports.handler = async (event) => {
  // Lazy-init storage on first invocation
  if (!storage) {
    storage = createStorage();
  }

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.rawPath || event.path;
  const headers = event.headers || {};

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // Extract tracking ID from paths like /api/admin/contributions/CONTRIB-xxx
  const adminContribMatch = path.match(/^\/api\/admin\/contributions\/([^/]+)$/);
  const adminReviewMatch = path.match(/^\/api\/admin\/contributions\/([^/]+)\/review$/);
  const adminCreateIssueMatch = path.match(/^\/api\/admin\/contributions\/([^/]+)\/improvements\/([^/]+)\/create-issue$/);

  let result;

  try {
    switch (true) {
      // --- Public ---
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

      case path === '/api/v1/self-improving/telemetry' && method === 'POST':
        result = await handleTelemetryReport(storage.ledger, JSON.parse(event.body || '{}'));
        break;

      case path === '/api/v1/self-improving/ledger' && method === 'GET':
        result = await handlePublicLedger(storage.ledger);
        break;

      case path === '/api/contact' && method === 'POST':
        result = await handleContact(storage.contacts, JSON.parse(event.body || '{}'));
        break;

      // --- Admin Auth (Bearer token, no cookies) ---
      case path === '/api/admin/login' && method === 'POST':
        result = await handleLogin(JSON.parse(event.body || '{}'));
        break;

      case path === '/api/admin/auth-check' && method === 'GET':
        result = await handleAuthCheck(headers);
        break;

      // --- Admin Protected (requires Authorization: Bearer <token>) ---
      case path === '/api/admin/contributions' && method === 'GET':
        if (!isAdminAuthenticated(headers)) {
          result = { statusCode: 401, body: { error: 'Authentication required' } };
        } else {
          result = await handleListContributions(storage.contributions);
        }
        break;

      case !!adminReviewMatch && method === 'POST':
        if (!isAdminAuthenticated(headers)) {
          result = { statusCode: 401, body: { error: 'Authentication required' } };
        } else {
          result = await handleReviewContribution(
            storage.contributions, adminReviewMatch[1], JSON.parse(event.body || '{}'));
        }
        break;

      case !!adminContribMatch && method === 'GET':
        if (!isAdminAuthenticated(headers)) {
          result = { statusCode: 401, body: { error: 'Authentication required' } };
        } else {
          result = await handleGetContribution(storage.contributions, adminContribMatch[1]);
        }
        break;

      case !!adminContribMatch && method === 'DELETE':
        if (!isAdminAuthenticated(headers)) {
          result = { statusCode: 401, body: { error: 'Authentication required' } };
        } else {
          result = await handleDeleteContribution(storage.contributions, adminContribMatch[1]);
        }
        break;

      case !!adminCreateIssueMatch && method === 'POST':
        if (!isAdminAuthenticated(headers)) {
          result = { statusCode: 401, body: { error: 'Authentication required' } };
        } else {
          result = await handleCreateImprovementIssue(
            storage.contributions,
            adminCreateIssueMatch[1],
            adminCreateIssueMatch[2],
            JSON.parse(event.body || '{}')
          );
        }
        break;

      default:
        result = { statusCode: 404, body: { error: 'Not found' } };
    }
  } catch (err) {
    console.error('Lambda error:', err);
    result = { statusCode: 500, body: { error: 'Internal server error' } };
  }

  const responseHeaders = { ...CORS_HEADERS };
  const queryString = event.rawQueryString || '';
  const isCacheableHit =
    method === 'GET' &&
    CACHEABLE_GET_PATHS.has(path) &&
    !queryString &&
    result.statusCode >= 200 &&
    result.statusCode < 300;

  if (isCacheableHit) {
    responseHeaders['Cache-Control'] = CACHE_CONTROL_PUBLIC;
  } else if (method !== 'OPTIONS') {
    responseHeaders['Cache-Control'] = 'no-store';
  }

  return {
    statusCode: result.statusCode,
    headers: responseHeaders,
    body: JSON.stringify(result.body),
  };
};
