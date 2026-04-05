/**
 * S3-compatible object storage adapter.
 *
 * Works with: AWS S3, Cloudflare R2, DigitalOcean Spaces,
 * MinIO, Backblaze B2, Wasabi, GCS (via interop).
 *
 * Configuration via environment variables:
 *   S3_BUCKET           (required)
 *   S3_ENDPOINT         (optional — set for non-AWS providers)
 *   S3_REGION           (default: eu-central-2 for Zurich)
 *   S3_ACCESS_KEY_ID    (optional — uses IAM role on AWS if not set)
 *   S3_SECRET_ACCESS_KEY
 *
 * Examples:
 *   AWS S3:             S3_BUCKET=intelliswarm-data S3_REGION=eu-central-2
 *   Cloudflare R2:      S3_BUCKET=intelliswarm-data S3_ENDPOINT=https://<ACCOUNT>.r2.cloudflarestorage.com
 *   DigitalOcean Spaces: S3_BUCKET=intelliswarm-data S3_ENDPOINT=https://fra1.digitaloceanspaces.com
 *   MinIO (self-hosted): S3_BUCKET=intelliswarm-data S3_ENDPOINT=http://localhost:9000
 */

let s3Client = null;

function getS3() {
  if (s3Client) return s3Client;
  const { S3Client } = require('@aws-sdk/client-s3');

  const config = {
    region: process.env.S3_REGION || 'eu-central-2',
  };

  // Non-AWS providers need an explicit endpoint
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = true; // Required for MinIO, R2, Spaces
  }

  // Explicit credentials (optional — falls back to IAM role on AWS)
  if (process.env.S3_ACCESS_KEY_ID) {
    config.credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    };
  }

  s3Client = new S3Client(config);
  return s3Client;
}

function createNewsS3Storage(bucket, prefix) {
  bucket = bucket || process.env.S3_BUCKET;
  prefix = prefix || 'news/';
  const indexKey = `${prefix}index.json`;

  return {
    async getAll() {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      try {
        const resp = await getS3().send(
          new GetObjectCommand({ Bucket: bucket, Key: indexKey })
        );
        const body = await resp.Body.transformToString();
        return JSON.parse(body);
      } catch (err) {
        if (err.name === 'NoSuchKey') return [];
        throw err;
      }
    },
    async put(item) {
      const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
      let news = [];
      try {
        const resp = await getS3().send(
          new GetObjectCommand({ Bucket: bucket, Key: indexKey })
        );
        news = JSON.parse(await resp.Body.transformToString());
      } catch (err) {
        if (err.name !== 'NoSuchKey') throw err;
      }
      news.push(item);
      await getS3().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: indexKey,
          Body: JSON.stringify(news, null, 2),
          ContentType: 'application/json',
        })
      );
    },
  };
}

function createContributionS3Storage(bucket, prefix) {
  bucket = bucket || process.env.S3_BUCKET;
  prefix = prefix || 'contributions/';

  return {
    async save(contribution) {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const key = `${prefix}${contribution.trackingId}.json`;
      await getS3().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: JSON.stringify(contribution, null, 2),
          ContentType: 'application/json',
        })
      );
    },
    async list() {
      const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
      const resp = await getS3().send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
      );
      const items = [];
      for (const obj of resp.Contents || []) {
        if (!obj.Key.endsWith('.json')) continue;
        const data = await getS3().send(
          new GetObjectCommand({ Bucket: bucket, Key: obj.Key })
        );
        const parsed = JSON.parse(await data.Body.transformToString());
        items.push({
          trackingId: parsed.trackingId,
          receivedAt: parsed.receivedAt,
          organizationName: parsed.organizationName,
          improvementsCount: parsed.improvementsCount,
          frameworkVersion: parsed.frameworkVersion,
        });
      }
      return items;
    },
  };
}

module.exports = { createNewsS3Storage, createContributionS3Storage };
