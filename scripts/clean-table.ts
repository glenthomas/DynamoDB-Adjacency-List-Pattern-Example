import { ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../src/config';

async function cleanTable() {
  console.log('🧹 Cleaning DynamoDB table...');
  
  try {
    // First, scan to get all items
    const scanParams = {
      TableName: TABLE_NAME,
      ProjectionExpression: 'PK, SK'
    };
    
    const scanResult = await docClient.send(new ScanCommand(scanParams));
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('✅ Table is already empty');
      return;
    }
    
    console.log(`Found ${scanResult.Items.length} items to delete`);
    
    // Batch delete items (limit is 25 per request)
    const batchSize = 25;
    const batches: Record<string, any>[] = [];
    
    for (let i = 0; i < scanResult.Items.length; i += batchSize) {
      batches.push(scanResult.Items.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }
      }));
      
      const params = {
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      };
      
      await docClient.send(new BatchWriteCommand(params));
      console.log(`✅ Deleted batch ${i + 1}/${batches.length} (${batch.length} items)`);
      
      // Add a small delay to avoid throttling
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('🎉 Table cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  cleanTable().catch(console.error);
}

export { cleanTable };
