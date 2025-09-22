import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialise DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});

// Create document client for easier interaction
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
  },
});

export const TABLE_NAME = 'EcommerceData';
