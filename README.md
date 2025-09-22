# DynamoDB Adjacency List Pattern Example

This project contains practical examples demonstrating the power and flexibility of the Adjacency List pattern for modeling relational data in DynamoDB using an e-commerce platform example.

This comprehensive example covers:

**Basic E-commerce Relationships**

- **Users**: Customers and sellers with different profiles
- **Products**: Items with categories and seller relationships  
- **Orders**: Customer orders with multiple order items
- **Reviews**: Product reviews with user and product relationships
- **Categories**: Product categorisation with flexible assignment

**Query Patterns Demonstrated**

- Single item retrieval by exact key
- One-to-many relationships (user's orders, product reviews)
- Many-to-many relationships (products in categories)  
- Complex entity relationships in single queries
- Hierarchical traversal (parent/child navigation)
- Cross-entity analytics (orders for specific products)

**Advanced Pattern Implementations**

- **Write Sharding**: Distribute high-traffic entity writes across multiple partitions
- **Hierarchical Data**: Nested category structures with efficient navigation
- **Bidirectional Relationships**: Query relationships from either direction using GSI
- **Time-Series Patterns**: Time-based sorting and filtering

## Project Structure

- `deploy/` - AWS CLI deployment scripts
- `data/` - Sample data files
- `src/` - TypeScript application demonstrating queries
- `scripts/` - Utility scripts for setup and data loading

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- DynamoDB permissions (CreateTable, PutItem, Query, etc.)

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
npm run setup
```

This single command will:
- Check all prerequisites (AWS CLI, Node.js, credentials)
- Install dependencies
- Deploy the DynamoDB table
- Build the TypeScript code
- Load sample data
- Confirm everything is ready

### Option 2: Manual Setup

1. **Deploy the DynamoDB table:**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

2. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

3. **Load sample data:**
   ```bash
   npm run load-data
   ```

4. **Run the demo application:**
   ```bash
   npm start
   ```

## Available Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode with auto-reload
- `npm run load-data` - Load sample data into DynamoDB
- `npm run clean-table` - Remove all data from the table
- `npm start` - Run the demo application

## AWS Configuration

Make sure your AWS CLI is configured with a region and credentials:

```bash
aws configure
```

The scripts will use your default AWS profile and region.
