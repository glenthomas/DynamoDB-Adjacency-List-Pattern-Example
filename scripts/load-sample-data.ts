import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

async function loadSampleData() {
  console.log('📥 Loading sample data into DynamoDB...');
  
  try {
    // Read data files organised by pattern type
    const dataDir = path.join(__dirname, '../data');
    
    // Core entities (PK = SK pattern) - these are the main business objects
    const coreEntities = JSON.parse(fs.readFileSync(path.join(dataDir, 'core-entities.json'), 'utf-8'));
    
    // Adjacency relationships (PK ≠ SK pattern) - these link entities together
    const adjacencyRelationships = JSON.parse(fs.readFileSync(path.join(dataDir, 'adjacency-relationships.json'), 'utf-8'));
    
    // Combine all data
    const allItems = [...coreEntities, ...adjacencyRelationships];
    
    console.log(`📊 Adjacency List Pattern Data Breakdown:`);
    console.log(`   Core entities (PK = SK): ${coreEntities.length} items`);
    console.log(`   Adjacency relationships (PK ≠ SK): ${adjacencyRelationships.length} items`);
    console.log(`   Total items to load: ${allItems.length}`);
    
    // Batch write items (DynamoDB batch write limit is 25 items per request)
    const batchSize = 25;
    const batches: Record<string, any>[] = [];
    
    for (let i = 0; i < allItems.length; i += batchSize) {
      batches.push(allItems.slice(i, i + batchSize));
    }
    
    console.log(`Processing ${batches.length} batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const writeRequests = batch.map(item => ({
        PutRequest: {
          Item: item
        }
      }));
      
      const params = {
        RequestItems: {
          [TABLE_NAME]: writeRequests
        }
      };
      
      await docClient.send(new BatchWriteCommand(params));
      console.log(`✅ Batch ${i + 1}/${batches.length} completed (${batch.length} items)`);
      
      // Add a small delay to avoid throttling
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('🎉 Sample data loaded successfully!');
    console.log('\n📋 Data Pattern Summary:');
    console.log('════════════════════════════════════════');
    console.log('Core Entities (PK = SK):');
    console.log('• 3 Users (customers and sellers)');
    console.log('• 3 Products (headphones, books, speaker)');  
    console.log('• 6 Orders (multiple orders per customer)');
    console.log('• 3 Reviews (product reviews)');
    console.log('• 2 Categories (electronics, books)');
    console.log('');
    console.log('Adjacency Relationships (PK ≠ SK):');
    console.log('• 8 Order→Product links (order items)');
    console.log('• 3 Product→Category links (categorization)');
    console.log('• 3 User→Review links (review authorship)');
    console.log('• 3 Product→Review links (review targets)');
    console.log('• 6 User→Order links (customer orders)');
    console.log('');
    console.log('📊 Customer Order History:');
    console.log('• John Doe (12345): 4 orders - $569.97 total');
    console.log('• Alice Smith (54321): 3 orders - $649.95 total');
    console.log('');
    console.log('🚀 Ready to demonstrate adjacency list queries!');
    console.log('   Run: npm start');
    
  } catch (error) {
    console.error('❌ Error loading sample data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  loadSampleData().catch(console.error);
}

export { loadSampleData };
