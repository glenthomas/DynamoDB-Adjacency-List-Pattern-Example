#!/bin/bash

# Setup script for DynamoDB Adjacency List Pattern Demo
set -e

echo "🚀 DynamoDB Adjacency List Pattern Setup"
echo "========================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    echo "   or set up IAM roles/environment variables"
    exit 1
fi

echo "✅ AWS credentials configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy DynamoDB table
echo "🏗️  Deploying DynamoDB table..."
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Load sample data
echo "📥 Loading sample data..."
npm run load-data

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "You can now run the demo with:"
echo "   npm start"
echo ""
echo "Other available commands:"
echo "   npm run clean-table  # Remove all data"
echo "   make help           # Show all available commands"
