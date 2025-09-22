#!/bin/bash

# Deploy DynamoDB table for Adjacency List pattern example
# This script creates a DynamoDB table with GSI for the e-commerce example

TABLE_NAME="EcommerceData"
REGION="${AWS_DEFAULT_REGION:-eu-west-1}"

echo "Creating DynamoDB table: $TABLE_NAME in region: $REGION"

# Create the main table
aws dynamodb create-table \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        'IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=10 \
    --billing-mode PROVISIONED

if [ $? -eq 0 ]; then
    echo "Table creation initiated successfully!"
    echo "Waiting for table to become ACTIVE..."
    
    # Wait for table to be active
    aws dynamodb wait table-exists --region "$REGION" --table-name "$TABLE_NAME"
    
    echo "Table $TABLE_NAME is now ACTIVE and ready to use!"
    echo ""
    echo "Table details:"
    aws dynamodb describe-table --region "$REGION" --table-name "$TABLE_NAME" --query 'Table.{TableName:TableName,Status:TableStatus,ItemCount:ItemCount}' --output table
else
    echo "Error creating table. Please check your AWS credentials and permissions."
    exit 1
fi
