import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './config';
import { User, Product, Order, OrderItem, Review, Category, BaseItem, OrderWithItems, ProductWithRelationships } from './types';

export class EcommerceQueries {
  /**
   * 1. Get user details by userId
   */
  async getUserDetails(userId: string): Promise<User | null> {
    console.log(`\n🔍 Query 1: Getting user details for userId: ${userId}`);
    
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `USER#${userId}`
      }
    };

    try {
      const result = await docClient.send(new GetCommand(params));
      if (result.Item) {
        const item = result.Item as BaseItem;
        console.log('✅ User found:', item.Data);
        return item.Data as User;
      } else {
        console.log('❌ User not found');
        return null;
      }
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  /**
   * 2. Get user's orders with order details
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    console.log(`\n🔍 Query 2: Getting orders for userId: ${userId}`);
    
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ORDER#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      const orders = items.map(item => item.Data as Order);
      
      console.log(`✅ Found ${orders.length} orders`);
      
      orders.forEach((order, index) => {
        console.log(`   Order ${index + 1}:`, order);
      });
      
      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * 3. Get product with all its relationships (reviews, categories, etc.)
   */
  async getProductWithRelationships(productId: string): Promise<ProductWithRelationships | null> {
    console.log(`\n🔍 Query 3: Getting product and relationships for productId: ${productId}`);
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      
      console.log(`✅ Found ${items.length} items (product + relationships)`);
      
      const productItem = items.find(item => item.Type === 'Product');
      const reviewItems = items.filter(item => item.Type === 'ProductReview');
      const categoryItems = items.filter(item => item.Type === 'ProductCategory');
      
      if (!productItem) {
        console.log('❌ Product not found');
        return null;
      }

      const product = productItem.Data as Product;
      const reviews = reviewItems.map(item => ({
        reviewId: item.Data.reviewId,
        customerId: '', // Would need to fetch from review entity
        productId: item.Data.productId,
        rating: item.Data.rating,
        comment: '',
        reviewDate: ''
      })) as Review[];
      
      const categories = categoryItems.map(item => ({
        categoryId: item.Data.categoryId,
        name: item.Data.categoryId, // Would need to fetch full category details
        description: ''
      })) as Category[];
      
      console.log('   Product:', product);
      console.log(`   Reviews: ${reviews.length} found`);
      console.log(`   Categories: ${categories.length} found`);
      
      reviews.forEach((review, index) => {
        console.log(`     Review ${index + 1} - Rating: ${review.rating}`);
      });
      
      return { product, reviews, categories };
    } catch (error) {
      console.error('Error getting product with relationships:', error);
      throw error;
    }
  }

  /**
   * 4. Get recent reviews for a product
   */
  async getProductReviews(productId: string, limit: number = 10): Promise<Review[]> {
    console.log(`\n🔍 Query 4: Getting recent reviews for productId: ${productId}`);
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
        ':sk': 'REVIEW#'
      },
      ScanIndexForward: false, // Get most recent first
      Limit: limit
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      
      // These are ProductReview relationship items, extract review info
      const reviews = items.map(item => ({
        reviewId: item.Data.reviewId,
        customerId: '', // Would need separate query to get full review details
        productId: item.Data.productId,
        rating: item.Data.rating,
        comment: '',
        reviewDate: ''
      })) as Review[];
      
      console.log(`✅ Found ${reviews.length} reviews`);
      
      reviews.forEach((review, index) => {
        console.log(`   Review ${index + 1} - Rating: ${review.rating}, ReviewId: ${review.reviewId}`);
      });
      
      return reviews;
    } catch (error) {
      console.error('Error getting product reviews:', error);
      throw error;
    }
  }

  /**
   * 5. Get products in category
   */
  async getProductsInCategory(categoryId: string): Promise<string[]> {
    console.log(`\n🔍 Query 5: Getting products in category: ${categoryId}`);
    
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
        ':sk': 'PRODUCT#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      
      // These are ProductCategory relationship items, extract product IDs
      const productIds = items.map(item => item.Data.productId as string);
      
      console.log(`✅ Found ${productIds.length} products in category`);
      
      productIds.forEach((productId, index) => {
        console.log(`   Product ${index + 1}: ${productId}`);
      });
      
      return productIds;
    } catch (error) {
      console.error('Error getting products in category:', error);
      throw error;
    }
  }

  /**
   * 6. Get order with all items
   */
  async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    console.log(`\n🔍 Query 6: Getting order with all items for orderId: ${orderId}`);
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `ORDER#${orderId}`
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      
      console.log(`✅ Found ${items.length} items (order + order items)`);
      
      const orderItem = items.find(item => item.Type === 'Order');
      const orderItemItems = items.filter(item => item.Type === 'OrderItem');
      
      if (!orderItem) {
        console.log('❌ Order not found');
        return null;
      }

      const order = orderItem.Data as Order;
      const orderItems = orderItemItems.map(item => item.Data as OrderItem);
      
      console.log('   Order:', order);
      console.log(`   Order Items: ${orderItems.length} found`);
      
      let totalCalculated = 0;
      orderItems.forEach((item, index) => {
        console.log(`     Item ${index + 1}: ${item.productId} x ${item.quantity} = $${item.totalPrice}`);
        totalCalculated += item.totalPrice;
      });
      
      console.log(`   Total calculated: $${totalCalculated}`);
      
      return { order, items: orderItems };
    } catch (error) {
      console.error('Error getting order with items:', error);
      throw error;
    }
  }

  /**
   * Advanced: Get all reviews by a user
   */
  async getUserReviews(userId: string): Promise<string[]> {
    console.log(`\n🔍 Advanced Query: Getting all reviews by userId: ${userId}`);
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'REVIEW#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      
      // These are UserReview relationship items, extract review IDs
      const reviewIds = items.map(item => item.Data.reviewId as string);
      
      console.log(`✅ Found ${reviewIds.length} reviews by this user`);
      
      return reviewIds;
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  }

  /**
   * Advanced: Get all orders for a specific product
   */
  async getOrdersForProduct(productId: string): Promise<string[]> {
    console.log(`\n🔍 Advanced Query: Getting orders for productId: ${productId}`);
    
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
        ':sk': 'ORDER#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []) as BaseItem[];
      
      // These are OrderItem relationship items, extract order IDs
      const orderIds = items.map(item => item.Data.orderId as string);
      
      console.log(`✅ Found ${orderIds.length} orders containing this product`);
      
      return orderIds;
    } catch (error) {
      console.error('Error getting orders for product:', error);
      throw error;
    }
  }
}
