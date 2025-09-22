import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './config';
import { User, Product, Order, OrderItem, Review, Category, OrderWithItems, ProductWithRelationships } from './types';

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
        const user = result.Item as User;
        console.log('✅ User found:', JSON.stringify(user));
        return user;
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
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ORDER#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const orders = (result.Items || []) as Order[];
      
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
      const items = (result.Items || []);
      
      console.log(`✅ Found ${items.length} items (product + relationships)`);
      
      const product = items.find(item => item.Type === 'Product') as Product;
      const reviews = items.filter(item => item.Type === 'ProductReview') as Review[];
      const categories = items.filter(item => item.Type === 'ProductCategory') as Category[];

      if (!product) {
        console.log('❌ Product not found');
        return null;
      }
      
      console.log('   Product:', product);
      console.log(`   Reviews: ${reviews.length} found`);
      console.log(`   Categories: ${categories.length} found`);
      
      return {
        product,
        reviews,
        categories
      };
    } catch (error) {
      console.error('Error getting product with relationships:', error);
      throw error;
    }
  }

  /**
   * 4. Get all reviews for a specific product
   */
  async getProductReviews(productId: string): Promise<Review[]> {
    console.log(`\n🔍 Query 4: Getting reviews for productId: ${productId}`);

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
        ':sk': 'REVIEW#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []);
      
      // Filter for ProductReview relationship items
      const reviews = items.filter(item => item.Type === 'ProductReview') as Review[];
      
      console.log(`✅ Found ${reviews.length} reviews for product`);
      
      return reviews;
    } catch (error) {
      console.error('Error getting product reviews:', error);
      throw error;
    }
  }

  /**
   * 5. Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<string[]> {
    console.log(`\n🔍 Query 5: Getting products in categoryId: ${categoryId}`);
    
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
      const items = (result.Items || []);
      
      // These would be ProductCategory relationship items, extract product IDs
      const productIds = items.map(item => item.productId as string).filter(Boolean);
      
      console.log(`✅ Found ${productIds.length} products in category`);
      
      return productIds;
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  }

  /**
   * 6. Get order with all order items
   */
  async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    console.log(`\n🔍 Query 6: Getting order and items for orderId: ${orderId}`);
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `ORDER#${orderId}`
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []);
      
      const order = items.find(item => item.Type === 'Order') as Order;
      const orderItems = items.filter(item => item.Type === 'OrderItem') as OrderItem[];

      if (!order) {
        console.log('❌ Order not found');
        return null;
      }
      
      console.log('✅ Order found with items:');
      console.log('   Order:', order);
      console.log(`   Items: ${orderItems.length} found`);
      
      return {
        order,
        items: orderItems
      };
    } catch (error) {
      console.error('Error getting order with items:', error);
      throw error;
    }
  }

  /**
   * 7. Get all reviews by a customer
   */
  async getCustomerReviews(customerId: string): Promise<string[]> {
    console.log(`\n🔍 Query 7: Getting reviews by customerId: ${customerId}`);

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${customerId}`,
        ':sk': 'REVIEW#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const items = (result.Items || []);
      
      const reviewItems = items.filter(item => item.Type === 'UserReview');
      const reviewIds = reviewItems.map(item => item.reviewId as string).filter(Boolean);
      
      console.log(`✅ Found ${reviewIds.length} reviews by customer`);
      
      return reviewIds;
    } catch (error) {
      console.error('Error getting customer reviews:', error);
      throw error;
    }
  }

  /**
   * 8. Get all orders containing a specific product
   */
  async getOrdersForProduct(productId: string): Promise<string[]> {
    console.log(`\n🔍 Query 8: Getting orders for productId: ${productId}`);

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
      const items = (result.Items || []);

      // These would be OrderItem relationship items, extract order IDs
      const orderIds = items.map(item => item.orderId as string).filter(Boolean);

      console.log(`✅ Found ${orderIds.length} orders for product`);

      return orderIds;
    } catch (error) {
      console.error('Error getting orders for product:', error);
      throw error;
    }
  }
}
