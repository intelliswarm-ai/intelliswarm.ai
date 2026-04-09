/**
 * Admin authentication using JWT-style signed tokens.
 *
 * No cookies. The frontend stores the token in memory and sends it
 * as Authorization: Bearer <token> on every request.
 *
 * Flow:
 *   POST /api/admin/login  { password }  → returns { token }
 *   GET  /api/admin/*       Authorization: Bearer <token>  → middleware validates
 *
 * Token format:  base64(timestamp):hmac-sha256(timestamp, secret)
 * Valid for 24 hours. Stateless — no server-side session storage.
 */

const crypto = require('crypto');

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret() {
  return process.env.ADMIN_PASSWORD || '';
}

function createToken() {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}:${hmac}`;
}

function verifyToken(token) {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [timestamp, providedHmac] = parts;

  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > TOKEN_MAX_AGE_MS || age < 0) return false;

  const expectedHmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(headers) {
  const auth = headers?.authorization || headers?.Authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  return null;
}

/**
 * Express middleware: rejects requests without a valid Bearer token.
 */
function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({
      error: 'Admin panel not configured. Set ADMIN_PASSWORD environment variable.',
    });
  }

  const token = extractToken(req.headers);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

/**
 * Login handler: validates password, returns signed token.
 */
async function handleLogin(data) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return {
      statusCode: 503,
      body: { error: 'Admin panel not configured. Set ADMIN_PASSWORD env var.' },
    };
  }

  const { password } = data || {};
  if (!password || password !== adminPassword) {
    return { statusCode: 401, body: { error: 'Invalid password' } };
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      token: createToken(),
      expiresIn: TOKEN_MAX_AGE_MS,
      message: 'Logged in',
    },
  };
}

/**
 * Check if a token from the Authorization header is valid.
 */
async function handleAuthCheck(headers) {
  const token = extractToken(headers);
  return {
    statusCode: 200,
    body: { authenticated: verifyToken(token) },
  };
}

/**
 * Lambda helper: verify token from event headers.
 */
function isAdminAuthenticated(headers) {
  const token = extractToken(headers);
  return verifyToken(token);
}

module.exports = { requireAdmin, handleLogin, handleAuthCheck, isAdminAuthenticated };
