#!/bin/bash

# Delete the DynamoDB table
TABLE_NAME="EcommerceData"
REGION="${AWS_DEFAULT_REGION:-eu-west-1}"

echo "Deleting DynamoDB table: $TABLE_NAME in region: $REGION"

aws dynamodb delete-table \
    --region "$REGION" \
    --table-name "$TABLE_NAME"

if [ $? -eq 0 ]; then
    echo "Table deletion initiated successfully!"
    echo "Waiting for table to be deleted..."
    
    # Wait for table to be deleted
    aws dynamodb wait table-not-exists --region "$REGION" --table-name "$TABLE_NAME"
    
    echo "Table $TABLE_NAME has been deleted!"
else
    echo "Error deleting table or table does not exist."
fi
