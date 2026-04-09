const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { createStorage } = require('./storage');
const { handleHealth } = require('./handlers/health');
const { handleGetNews, handleCreateNews } = require('./handlers/news');
const { handleContribute, handleListContributions, handleGetContribution, handleReviewContribution } = require('./handlers/contribute');
const { handleContact } = require('./handlers/contact');
const { requireAdmin, handleLogin, handleLogout, handleAuthCheck } = require('./handlers/admin-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize storage (filesystem by default, configurable via STORAGE_BACKEND)
const storage = createStorage();

// --- Helper: adapt handler result to Express response ---
function sendResult(res, result) {
  res.status(result.statusCode).json(result.body);
}

// --- Health ---
app.get('/api/health', async (req, res) => {
  sendResult(res, await handleHealth({ runtime: 'express' }));
});

// --- News ---
app.get('/api/news', async (req, res) => {
  sendResult(res, await handleGetNews(storage.news, req.query));
});

app.post('/api/news', async (req, res) => {
  sendResult(res, await handleCreateNews(storage.news, req.body));
});

// --- Contributions ---
app.post('/api/contribute', async (req, res) => {
  sendResult(res, await handleContribute(storage.contributions, req.body));
});

// --- Admin Auth ---
function sendResultWithCookie(res, result) {
  if (result.cookie) {
    const { name, value, options } = result.cookie;
    res.cookie(name, value, options);
  }
  if (result.clearCookie) {
    res.clearCookie(result.clearCookie, { path: '/' });
  }
  res.status(result.statusCode).json(result.body);
}

app.post('/api/admin/login', async (req, res) => {
  sendResultWithCookie(res, await handleLogin(req.body));
});

app.post('/api/admin/logout', async (req, res) => {
  sendResultWithCookie(res, await handleLogout());
});

app.get('/api/admin/auth-check', async (req, res) => {
  sendResult(res, await handleAuthCheck(req));
});

// --- Admin-Protected Contribution Endpoints ---
app.get('/api/admin/contributions', requireAdmin, async (req, res) => {
  sendResult(res, await handleListContributions(storage.contributions));
});

app.get('/api/admin/contributions/:trackingId', requireAdmin, async (req, res) => {
  sendResult(res, await handleGetContribution(storage.contributions, req.params.trackingId));
});

app.post('/api/admin/contributions/:trackingId/review', requireAdmin, async (req, res) => {
  sendResult(res, await handleReviewContribution(storage.contributions, req.params.trackingId, req.body));
});

// --- Contact ---
app.post('/api/contact', async (req, res) => {
  sendResult(res, await handleContact(storage.contacts, req.body));
});

// --- RAG Chat (requires ChromaDB + Ollama — only available on full server deployments) ---
if (process.env.CHROMA_URL || process.env.OLLAMA_URL) {
  const { ChromaClient } = require('chromadb');
  const { Ollama } = require('ollama');

  const chroma = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
  const ollama = new Ollama({ host: process.env.OLLAMA_URL || 'http://localhost:11434' });

  let collection;
  let isReady = false;

  async function initializeChroma() {
    try {
      collection = await chroma.getOrCreateCollection({
        name: 'resume_knowledge',
        metadata: { 'hnsw:space': 'cosine' },
      });
      console.log('ChromaDB collection initialized');
      isReady = true;
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error);
    }
  }

  app.post('/api/chat', async (req, res) => {
    try {
      if (!isReady) {
        return res.status(503).json({ error: 'Service not ready. Please try again.' });
      }

      const { message, conversation_history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const searchResults = await collection.query({ queryTexts: [message], nResults: 5 });
      const context = searchResults.documents[0]?.join('\n\n') || '';

      const conversationContext = conversation_history
        .map((msg) => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const prompt = `You are an AI assistant representing a senior AI/ML engineer and the creator of IntelliSwarm.ai. Answer questions about professional experience, technical skills, and projects based on the provided context.

Context from resume and projects:
${context}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}

Current question: ${message}

Instructions:
- Answer in first person as if you are the engineer
- Be specific about technical details when relevant
- Reference specific projects from IntelliSwarm.ai when applicable
- Keep responses concise but informative
- If the question is outside your expertise area, acknowledge it honestly

Response:`;

      const response = await ollama.generate({
        model: 'mistral:7b',
        prompt,
        options: { temperature: 0.7, top_p: 0.9, max_tokens: 500 },
      });

      res.json({
        success: true,
        message: response.response,
        context_used: searchResults.documents[0]?.length || 0,
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat message', details: error.message });
    }
  });

  app.get('/api/models', async (req, res) => {
    try {
      const models = await ollama.list();
      res.json({ models: models.models });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  app.get('/api/collection/info', async (req, res) => {
    try {
      if (!collection) return res.status(503).json({ error: 'Collection not ready' });
      const count = await collection.count();
      res.json({ name: 'resume_knowledge', count, status: 'ready' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get collection info' });
    }
  });

  initializeChroma();
}

// Start server
app.listen(PORT, () => {
  console.log(`IntelliSwarm backend running on port ${PORT}`);
  console.log(`Storage: ${process.env.STORAGE_BACKEND || 'filesystem'}`);
});
