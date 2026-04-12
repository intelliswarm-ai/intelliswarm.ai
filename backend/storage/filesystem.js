const fs = require('fs');
const path = require('path');

/**
 * Filesystem-based storage for local/VPS/Docker deployments.
 */

function createNewsFileStorage(filePath) {
  return {
    async getAll() {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    },
    async put(item) {
      const news = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      news.push(item);
      fs.writeFileSync(filePath, JSON.stringify(news, null, 2));
    },
  };
}

function createContributionFileStorage(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return {
    async save(contribution) {
      const filename = `${contribution.trackingId}.json`;
      fs.writeFileSync(
        path.join(dirPath, filename),
        JSON.stringify(contribution, null, 2)
      );
    },
    async list() {
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
      return files.map((f) => {
        const data = JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
        return {
          trackingId: data.trackingId,
          receivedAt: data.receivedAt,
          organizationName: data.organizationName,
          improvementsCount: data.improvementsCount,
          frameworkVersion: data.frameworkVersion,
          status: data.status || 'PENDING',
        };
      });
    },
    async get(trackingId) {
      const filename = `${trackingId}.json`;
      const filePath = path.join(dirPath, filename);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    },
    async update(trackingId, updates) {
      const filename = `${trackingId}.json`;
      const filePath = path.join(dirPath, filename);
      if (!fs.existsSync(filePath)) return null;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      Object.assign(data, updates);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return data;
    },
    async delete(trackingId) {
      const filePath = path.join(dirPath, `${trackingId}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    },
  };
}

function createContactFileStorage(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return {
    async save(contact) {
      const filename = `${contact.contactId}.json`;
      fs.writeFileSync(
        path.join(dirPath, filename),
        JSON.stringify(contact, null, 2)
      );
    },
  };
}

module.exports = { createNewsFileStorage, createContributionFileStorage, createContactFileStorage };
