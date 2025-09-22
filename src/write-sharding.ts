import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './config';

/**
 * Example of write sharding for high-traffic entities
 * This helps distribute write load across multiple partitions
 */
export class WriteShardingExample {
  
  /**
   * Create a sharded key for high-traffic entities
   */
  private getShardKey(baseKey: string, numShards: number): string {
    const shardId = Math.floor(Math.random() * numShards);
    return `${baseKey}#SHARD${shardId}`;
  }

  /**
   * Write user activity with sharding to avoid hot partitions
   */
  async writeUserActivity(userId: string, activity: any, numShards: number = 5) {
    const pk = this.getShardKey(`USER#${userId}`, numShards);
    const sk = `ACTIVITY#${Date.now()}`;
    
    const item = {
      PK: pk,
      SK: sk,
      Type: 'UserActivity',
      Data: {
        userId,
        ...activity,
        timestamp: new Date().toISOString()
      },
      CreatedAt: new Date().toISOString()
    };

    const params = {
      TableName: TABLE_NAME,
      Item: item
    };

    try {
      await docClient.send(new PutCommand(params));
      console.log(`✅ Activity recorded for user ${userId} in shard ${pk.split('#SHARD')[1]}`);
    } catch (error) {
      console.error('Error writing user activity:', error);
      throw error;
    }
  }

  /**
   * Read all activities for a user across all shards
   */
  async getUserActivities(userId: string, numShards: number = 5) {
    console.log(`🔍 Getting activities for user ${userId} across ${numShards} shards`);
    
    const promises = [];
    
    // Query each shard
    for (let shardId = 0; shardId < numShards; shardId++) {
      const pk = `USER#${userId}#SHARD${shardId}`;
      
      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':sk': 'ACTIVITY#'
        }
      };
      
      promises.push(docClient.send(new QueryCommand(params)));
    }
    
    try {
      const results = await Promise.all(promises);
      const allActivities = results.flatMap(result => result.Items || []);
      
      // Sort by timestamp
      allActivities.sort((a, b) => {
        const timeA = new Date(a.Data.timestamp).getTime();
        const timeB = new Date(b.Data.timestamp).getTime();
        return timeB - timeA; // Most recent first
      });
      
      console.log(`✅ Found ${allActivities.length} activities across all shards`);
      
      return allActivities;
      
    } catch (error) {
      console.error('Error getting user activities:', error);
      throw error;
    }
  }

  /**
   * Demo the write sharding functionality
   */
  async demo() {
    console.log('\n📊 Write Sharding Demo');
    console.log('=======================');
    
    const userId = '12345';
    const activities = [
      { action: 'login', source: 'web' },
      { action: 'view_product', productId: 'ABC123' },
      { action: 'add_to_cart', productId: 'ABC123' },
      { action: 'purchase', orderId: 'ORD003', amount: 199.99 },
      { action: 'logout', source: 'web' }
    ];

    // Write activities (these will be distributed across shards)
    console.log('\n📝 Writing activities with sharding...');
    for (const activity of activities) {
      await this.writeUserActivity(userId, activity);
      // Small delay to show different timestamps
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Read all activities
    console.log('\n📖 Reading activities from all shards...');
    const allActivities = await this.getUserActivities(userId);
    
    allActivities.forEach((activity, index) => {
      const data = activity.Data;
      console.log(`   ${index + 1}. ${data.action} - ${data.timestamp}`);
    });

    console.log('\n💡 Benefits of write sharding:');
    console.log('   • Distributes write load across multiple partitions');
    console.log('   • Prevents hot partition issues for popular users/products');
    console.log('   • Maintains query flexibility by reading from all shards');
    console.log('   • Scales with increasing write volume');
  }
}
