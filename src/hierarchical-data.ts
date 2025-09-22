import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './config';

/**
 * Example of hierarchical data patterns using adjacency lists
 * Shows nested categories and organisational structures
 */
export class HierarchicalDataExample {

  /**
   * Create a hierarchical category structure
   */
  async createCategoryHierarchy() {
    console.log('\n🌳 Creating Category Hierarchy');
    console.log('==============================');

    const categories = [
      // Root categories
      { id: 'electronics', name: 'Electronics', parentId: null },
      { id: 'books', name: 'Books', parentId: null },
      
      // Electronics subcategories
      { id: 'computers', name: 'Computers', parentId: 'electronics' },
      { id: 'audio', name: 'Audio & Video', parentId: 'electronics' },
      { id: 'mobile', name: 'Mobile Devices', parentId: 'electronics' },
      
      // Computer subcategories
      { id: 'laptops', name: 'Laptops', parentId: 'computers' },
      { id: 'desktops', name: 'Desktops', parentId: 'computers' },
      
      // Audio subcategories
      { id: 'headphones', name: 'Headphones', parentId: 'audio' },
      { id: 'speakers', name: 'Speakers', parentId: 'audio' },
      
      // Book subcategories
      { id: 'fiction', name: 'Fiction', parentId: 'books' },
      { id: 'technical', name: 'Technical', parentId: 'books' },
    ];

    for (const category of categories) {
      // Create the category entity
      const categoryItem = {
        PK: `CATEGORY#${category.id}`,
        SK: `CATEGORY#${category.id}`,
        Type: 'Category',
        Data: {
          categoryId: category.id,
          name: category.name,
          parentId: category.parentId
        },
        CreatedAt: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: categoryItem
      }));

      // If it has a parent, create the parent-child relationship
      if (category.parentId) {
        const parentChildItem = {
          PK: `CATEGORY#${category.parentId}`,
          SK: `CHILD#${category.id}`,
          Type: 'CategoryChild',
          Data: {
            parentCategoryId: category.parentId,
            childCategoryId: category.id,
            childName: category.name
          },
          GSI1PK: `CATEGORY#${category.id}`,
          GSI1SK: `PARENT#${category.parentId}`,
          CreatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: parentChildItem
        }));

        console.log(`✅ Created category: ${category.name} (child of ${category.parentId})`);
      } else {
        console.log(`✅ Created root category: ${category.name}`);
      }
    }
  }

  /**
   * Get all children of a category
   */
  async getCategoryChildren(categoryId: string): Promise<any[]> {
    console.log(`\n🔍 Getting children of category: ${categoryId}`);

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
        ':sk': 'CHILD#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const children = result.Items || [];
      
      console.log(`✅ Found ${children.length} direct children:`);
      children.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.Data.childName} (${child.Data.childCategoryId})`);
      });

      return children;
    } catch (error) {
      console.error('Error getting category children:', error);
      throw error;
    }
  }

  /**
   * Get parent of a category using GSI1
   */
  async getCategoryParent(categoryId: string): Promise<any | null> {
    console.log(`\n🔍 Getting parent of category: ${categoryId}`);

    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
        ':sk': 'PARENT#'
      }
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      const parent = result.Items?.[0];
      
      if (parent) {
        console.log(`✅ Parent found: ${parent.Data.parentCategoryId}`);
        return parent;
      } else {
        console.log('✅ This is a root category (no parent)');
        return null;
      }
    } catch (error) {
      console.error('Error getting category parent:', error);
      throw error;
    }
  }

  /**
   * Get full category path (breadcrumb)
   */
  async getCategoryPath(categoryId: string): Promise<string[]> {
    console.log(`\n🔍 Getting full path for category: ${categoryId}`);

    const path: string[] = [categoryId];
    let currentCategoryId = categoryId;

    // Traverse up the hierarchy
    while (true) {
      const parent = await this.getCategoryParent(currentCategoryId);
      if (!parent) break;

      const parentId = parent.Data.parentCategoryId;
      path.unshift(parentId);
      currentCategoryId = parentId;
    }

    console.log(`✅ Full path: ${path.join(' > ')}`);
    return path;
  }

  /**
   * Get all descendants of a category (recursive)
   */
  async getAllCategoryDescendants(categoryId: string, depth: number = 0): Promise<string[]> {
    const indent = '  '.repeat(depth);
    console.log(`${indent}📂 Getting descendants of: ${categoryId}`);

    const children = await this.getCategoryChildren(categoryId);
    const descendants: string[] = [];

    for (const child of children) {
      const childId = child.Data.childCategoryId;
      descendants.push(childId);
      
      // Recursively get grandchildren
      const grandchildren = await this.getAllCategoryDescendants(childId, depth + 1);
      descendants.push(...grandchildren);
    }

    if (depth === 0) {
      console.log(`✅ Total descendants found: ${descendants.length}`);
      console.log(`   ${descendants.join(', ')}`);
    }

    return descendants;
  }

  /**
   * Demo hierarchical data patterns
   */
  async demo() {
    console.log('\n🌲 Hierarchical Data Demo');
    console.log('=========================');

    try {
      // Create the hierarchy
      await this.createCategoryHierarchy();

      // Demonstrate various queries
      console.log('\n📋 Querying Hierarchical Data:');
      
      // Get children of electronics
      await this.getCategoryChildren('electronics');
      
      // Get parent of laptops
      await this.getCategoryParent('laptops');
      
      // Get full path for headphones
      await this.getCategoryPath('headphones');
      
      // Get all descendants of electronics
      console.log('\n🔄 Getting all descendants recursively:');
      await this.getAllCategoryDescendants('electronics');

      console.log('\n💡 Hierarchical Data Benefits:');
      console.log('   • Efficient parent-child queries');
      console.log('   • Bidirectional relationship traversal');
      console.log('   • Support for nested structures');
      console.log('   • Scalable to deep hierarchies');

    } catch (error) {
      console.error('❌ Hierarchical demo failed:', error);
      throw error;
    }
  }
}
