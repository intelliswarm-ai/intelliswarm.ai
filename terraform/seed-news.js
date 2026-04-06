const path = require('path');
const fs = require('fs');

// Resolve modules from backend/node_modules regardless of where this script runs
const backendDir = path.join(__dirname, '..', 'backend');
const { DynamoDBClient } = require(path.join(backendDir, 'node_modules', '@aws-sdk', 'client-dynamodb'));
const { DynamoDBDocumentClient, PutCommand } = require(path.join(backendDir, 'node_modules', '@aws-sdk', 'lib-dynamodb'));

const region = process.env.AWS_REGION || 'eu-central-2';
const tableName = process.env.NEWS_TABLE || 'intelliswarm-news';
const newsFile = path.join(__dirname, '..', 'backend', 'data', 'news.json');

const client = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(client);

async function seed() {
  const news = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
  for (const item of news) {
    await ddb.send(new PutCommand({ TableName: tableName, Item: item }));
    console.log('Seeded:', item.id);
  }
  console.log('Done:', news.length, 'items seeded to', tableName);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
