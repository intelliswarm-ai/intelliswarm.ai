const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { ChromaClient } = require('chromadb');
const { Ollama } = require('ollama');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize clients
const chroma = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
const ollama = new Ollama({ host: process.env.OLLAMA_URL || 'http://localhost:11434' });

// Global variables
let collection;
let isReady = false;

// Initialize ChromaDB collection
async function initializeChroma() {
  try {
    collection = await chroma.getOrCreateCollection({
      name: 'resume_knowledge',
      metadata: { 'hnsw:space': 'cosine' }
    });
    console.log('✅ ChromaDB collection initialized');
    isReady = true;
  } catch (error) {
    console.error('❌ Failed to initialize ChromaDB:', error);
  }
}

// RAG Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    if (!isReady) {
      return res.status(503).json({ error: 'Service not ready. Please try again.' });
    }

    const { message, conversation_history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Query vector database for relevant context
    const searchResults = await collection.query({
      queryTexts: [message],
      nResults: 5
    });

    // Step 2: Prepare context from search results
    const context = searchResults.documents[0]?.join('\n\n') || '';
    
    // Step 3: Build prompt with context and conversation history
    const conversationContext = conversation_history
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
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

    // Step 4: Get response from Ollama
    const response = await ollama.generate({
      model: 'mistral:7b', // or 'llama3:8b'
      prompt: prompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      }
    });

    res.json({
      success: true,
      message: response.response,
      context_used: searchResults.documents[0]?.length || 0
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: isReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString(),
    services: {
      chromadb: process.env.CHROMA_URL,
      ollama: process.env.OLLAMA_URL
    }
  });
});

// Models endpoint
app.get('/api/models', async (req, res) => {
  try {
    const models = await ollama.list();
    res.json({ models: models.models });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Collection info endpoint
app.get('/api/collection/info', async (req, res) => {
  try {
    if (!collection) {
      return res.status(503).json({ error: 'Collection not ready' });
    }

    const count = await collection.count();
    res.json({
      name: 'resume_knowledge',
      count: count,
      status: 'ready'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get collection info' });
  }
});

// --- Improvement Contributions endpoint ---
const CONTRIBUTIONS_DIR = path.join(__dirname, 'contributions');
if (!fs.existsSync(CONTRIBUTIONS_DIR)) {
  fs.mkdirSync(CONTRIBUTIONS_DIR, { recursive: true });
}

app.post('/api/contribute', async (req, res) => {
  try {
    const { improvementData, organizationName, contactEmail, notes } = req.body;

    if (!improvementData) {
      return res.status(400).json({ error: 'improvementData is required' });
    }

    if (improvementData.exportFormat !== 'swarmai-improvements') {
      return res.status(400).json({
        error: 'Invalid format. Expected exportFormat: "swarmai-improvements"'
      });
    }

    const improvements = improvementData.improvements || [];
    const trackingId = `CONTRIB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Store contribution to disk
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

    const filename = `${trackingId}.json`;
    fs.writeFileSync(
      path.join(CONTRIBUTIONS_DIR, filename),
      JSON.stringify(contribution, null, 2)
    );

    console.log(
      `[Contribution] ${trackingId}: ${improvements.length} improvements from "${organizationName || 'Anonymous'}"`
    );

    // Attempt to create a GitHub issue for the team to review
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      try {
        const issueBody = [
          `## New Improvement Contribution`,
          ``,
          `**Tracking ID:** ${trackingId}`,
          `**Organization:** ${organizationName || 'Anonymous'}`,
          `**Framework Version:** ${improvementData.frameworkVersion || 'unknown'}`,
          `**Improvements:** ${improvements.length}`,
          `**Contact:** ${contactEmail || 'not provided'}`,
          ``,
          notes ? `**Notes:** ${notes}\n` : '',
          `### Breakdown`,
          `- Tier 1 (Auto-merge): ${improvements.filter(i => i.tier === 'TIER_1_AUTO').length}`,
          `- Tier 2 (PR Review): ${improvements.filter(i => i.tier === 'TIER_2_REVIEWED').length}`,
          `- Tier 3 (Architecture): ${improvements.filter(i => i.tier === 'TIER_3_ARCHITECTURE').length}`,
          ``,
          `File stored at: \`contributions/${filename}\``,
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
              title: `[Contribution] ${improvements.length} improvements from ${organizationName || 'Anonymous'}`,
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

    res.json({
      success: true,
      trackingId,
      improvementsAccepted: improvements.length,
      message: 'Thank you for contributing back to SwarmAI.',
    });
  } catch (error) {
    console.error('[Contribution] Error:', error);
    res.status(500).json({
      error: 'Failed to process contribution',
      details: error.message,
    });
  }
});

// List contributions (admin)
app.get('/api/contributions', (req, res) => {
  try {
    const files = fs.readdirSync(CONTRIBUTIONS_DIR).filter(f => f.endsWith('.json'));
    const contributions = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(CONTRIBUTIONS_DIR, f), 'utf8'));
      return {
        trackingId: data.trackingId,
        receivedAt: data.receivedAt,
        organizationName: data.organizationName,
        improvementsCount: data.improvementsCount,
        frameworkVersion: data.frameworkVersion,
      };
    });
    res.json({ contributions, total: contributions.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list contributions' });
  }
});

// Initialize and start server
async function startServer() {
  await initializeChroma();
  
  app.listen(PORT, () => {
    console.log(`🚀 IntelliSwarm RAG Backend running on port ${PORT}`);
    console.log(`📊 ChromaDB: ${process.env.CHROMA_URL || 'http://localhost:8000'}`);
    console.log(`🤖 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  });
}

startServer().catch(console.error);