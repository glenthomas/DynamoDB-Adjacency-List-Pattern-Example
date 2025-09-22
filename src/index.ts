import { EcommerceQueries } from './queries';
import { WriteShardingExample } from './write-sharding';
import { HierarchicalDataExample } from './hierarchical-data';

async function runDemo() {
  console.log('🚀 DynamoDB Adjacency List Pattern Demo');
  console.log('==========================================');
  
  const queries = new EcommerceQueries();
  const shardingExample = new WriteShardingExample();
  const hierarchicalExample = new HierarchicalDataExample();

  try {
    // 1. Get user details
    const user = await queries.getUserDetails('12345');
    if (user) {
      console.log(`User type: ${user.userType}, Email: ${user.email}`);
    }
    
    // 2. Get user orders
    const orders = await queries.getUserOrders('12345');
    orders.forEach(order => {
      console.log(`Order ${order.orderId} - Status: ${order.status}, Total: $${order.total}`);
    });
    
    // 3. Get product with relationships
    const productData = await queries.getProductWithRelationships('ABC123');
    if (productData) {
      console.log(`Product: ${productData.product.name} - $${productData.product.price}`);
      console.log(`Reviews count: ${productData.reviews.length}`);
      console.log(`Categories count: ${productData.categories.length}`);
    }
    
    // 4. Get product reviews
    const reviews = await queries.getProductReviews('ABC123');
    reviews.forEach(review => {
      console.log(`Review ${review.reviewId}: ${review.rating} stars`);
    });
    
    // 5. Get product IDs in category
    const productIds = await queries.getProductsInCategory('electronics');
    console.log(`Found ${productIds.length} products in electronics category: ${productIds.join(', ')}`);
    
    // 6. Get order with items
    const orderData = await queries.getOrderWithItems('ORD001');
    if (orderData) {
      console.log(`Order ${orderData.order.orderId} has ${orderData.items.length} items`);
      const totalFromItems = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      console.log(`Calculated total: $${totalFromItems}`);
    }
    
    // Advanced queries with types
    console.log('\n📈 Advanced Queries');
    console.log('===================');
    
    // Get all review IDs by a user
    const userReviewIds = await queries.getUserReviews('54321');
    console.log(`User has written ${userReviewIds.length} reviews: ${userReviewIds.join(', ')}`);
    
    // Get all order IDs for a specific product
    const orderIdsForProduct = await queries.getOrdersForProduct('ABC123');
    console.log(`Product appears in ${orderIdsForProduct.length} orders: ${orderIdsForProduct.join(', ')}`);
    
    // Write sharding demo
    await shardingExample.demo();
    
    // Hierarchical data demo
    await hierarchicalExample.demo();
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📈 Summary: The Adjacency List pattern demonstrated:');
    console.log('════════════════════════════════════════════════════');
    console.log('✅ Basic relational queries (users, products, orders, reviews)');
    console.log('✅ Complex relationship traversal in single queries');
    console.log('✅ Write sharding for high-traffic entities');
    console.log('✅ Hierarchical data structures with efficient navigation');
    console.log('✅ Bidirectional relationships with GSI support');
    console.log('✅ Cost-effective querying with minimal API calls');
    console.log('');
    console.log('💡 Key Benefits:');
    console.log('   • Single table design reduces operational complexity');
    console.log('   • Efficient relationship traversal');
    console.log('   • Scalable to millions of items');
    console.log('   • Flexible access patterns without schema changes');
    console.log('   • Cost-effective compared to normalised approaches');
    console.log('');
    console.log('🔗 Perfect for: E-commerce, Social networks, Content management,');
    console.log('    Organisational hierarchies, and any relational data at scale!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}
