/**
 * DynamoDB-based storage for AWS Lambda deployments.
 *
 * Uses @aws-sdk/lib-dynamodb (DocumentClient) for automatic
 * marshalling/unmarshalling of JavaScript objects.
 *
 * Tables are configured via environment variables:
 *   NEWS_TABLE          (default: intelliswarm-news)
 *   CONTRIBUTIONS_TABLE (default: intelliswarm-contributions)
 */

let ddb = null;

function getDdb() {
  if (ddb) return ddb;
  // Lazy-load AWS SDK so it doesn't break non-AWS environments
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
  const client = new DynamoDBClient({});
  ddb = DynamoDBDocumentClient.from(client);
  return ddb;
}

function createNewsDynamoStorage(tableName) {
  tableName = tableName || process.env.NEWS_TABLE || 'intelliswarm-news';

  return {
    async getAll() {
      const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
      const result = await getDdb().send(new ScanCommand({ TableName: tableName }));
      return result.Items || [];
    },
    async put(item) {
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      await getDdb().send(new PutCommand({ TableName: tableName, Item: item }));
    },
  };
}

function createContributionDynamoStorage(tableName) {
  tableName = tableName || process.env.CONTRIBUTIONS_TABLE || 'intelliswarm-contributions';

  return {
    async save(contribution) {
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      await getDdb().send(
        new PutCommand({ TableName: tableName, Item: contribution })
      );
    },
    async list() {
      const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
      const result = await getDdb().send(new ScanCommand({ TableName: tableName }));
      return (result.Items || []).map((item) => ({
        trackingId: item.trackingId,
        receivedAt: item.receivedAt,
        organizationName: item.organizationName,
        improvementsCount: item.improvementsCount,
        frameworkVersion: item.frameworkVersion,
        status: item.status || 'PENDING',
      }));
    },
    async get(trackingId) {
      const { GetCommand } = require('@aws-sdk/lib-dynamodb');
      const result = await getDdb().send(
        new GetCommand({ TableName: tableName, Key: { trackingId } })
      );
      return result.Item || null;
    },
    async update(trackingId, updates) {
      const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
      const expressions = [];
      const names = {};
      const values = {};
      Object.entries(updates).forEach(([key, value], i) => {
        expressions.push(`#k${i} = :v${i}`);
        names[`#k${i}`] = key;
        values[`:v${i}`] = value;
      });
      const result = await getDdb().send(
        new UpdateCommand({
          TableName: tableName,
          Key: { trackingId },
          UpdateExpression: 'SET ' + expressions.join(', '),
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ReturnValues: 'ALL_NEW',
        })
      );
      return result.Attributes;
    },
    async delete(trackingId) {
      const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
      await getDdb().send(
        new DeleteCommand({ TableName: tableName, Key: { trackingId } })
      );
    },
  };
}

function createContactDynamoStorage(tableName) {
  tableName = tableName || process.env.CONTACTS_TABLE || 'intelliswarm-contacts';

  return {
    async save(contact) {
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      await getDdb().send(
        new PutCommand({ TableName: tableName, Item: contact })
      );
    },
  };
}

function createLedgerDynamoStorage(tableName) {
  tableName = tableName || process.env.LEDGER_TABLE || 'intelliswarm-ledger';

  // Schema: partition key = installationId#reportDate, enforces idempotent overwrite
  function rollupKey(record) {
    return `${record.installationId}#${record.reportDate}`;
  }

  return {
    async putDailyRollup(record) {
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      await getDdb().send(
        new PutCommand({
          TableName: tableName,
          Item: { rollupKey: rollupKey(record), ...record },
        })
      );
    },
    async listDailyRollups(sinceIsoDate) {
      const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
      // Scan is acceptable here because the ledger table has bounded size
      // (30-day reporting window × N installations). If N grows > 10k, switch
      // to a GSI on reportDate and Query instead.
      const filter = sinceIsoDate
        ? {
            FilterExpression: '#d >= :since',
            ExpressionAttributeNames: { '#d': 'reportDate' },
            ExpressionAttributeValues: { ':since': sinceIsoDate },
          }
        : {};
      const result = await getDdb().send(
        new ScanCommand({ TableName: tableName, ...filter })
      );
      return (result.Items || []).map((item) => {
        // Strip the DynamoDB-specific composite key before returning
        const { rollupKey: _key, ...rest } = item;
        return rest;
      });
    },
  };
}

module.exports = {
  createNewsDynamoStorage,
  createContributionDynamoStorage,
  createContactDynamoStorage,
  createLedgerDynamoStorage,
};
