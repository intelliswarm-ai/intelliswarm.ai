/**
 * Storage factory.
 *
 * Picks the storage backend based on the STORAGE_BACKEND env var:
 *   "filesystem"  — local JSON files (default for Express/Docker/VPS)
 *   "dynamodb"    — AWS DynamoDB (for Lambda)
 *   "s3"          — S3-compatible (AWS S3, Cloudflare R2, DO Spaces, MinIO)
 *
 * This is the only place that knows about storage implementations.
 * Handlers only depend on the storage interface.
 */

const path = require('path');

function createStorage() {
  const backend = (process.env.STORAGE_BACKEND || 'filesystem').toLowerCase();

  switch (backend) {
    case 'dynamodb': {
      const { createNewsDynamoStorage, createContributionDynamoStorage, createContactDynamoStorage } = require('./dynamodb');
      return {
        news: createNewsDynamoStorage(),
        contributions: createContributionDynamoStorage(),
        contacts: createContactDynamoStorage(),
      };
    }

    case 's3': {
      const { createNewsS3Storage, createContributionS3Storage } = require('./s3compatible');
      return {
        news: createNewsS3Storage(),
        contributions: createContributionS3Storage(),
      };
    }

    case 'filesystem':
    default: {
      const { createNewsFileStorage, createContributionFileStorage, createContactFileStorage } = require('./filesystem');
      const dataDir = process.env.DATA_DIR || path.join(__dirname, '..');
      return {
        news: createNewsFileStorage(path.join(dataDir, 'data', 'news.json')),
        contributions: createContributionFileStorage(path.join(dataDir, 'contributions')),
        contacts: createContactFileStorage(path.join(dataDir, 'contacts')),
      };
    }
  }
}

module.exports = { createStorage };
