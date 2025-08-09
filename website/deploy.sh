#!/bin/bash

# 🚀 IntelliSwarm.ai AWS Deployment Script
# This script automates the deployment of your website to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="intelliswarm-website"
REGION="us-east-1"
DOMAIN_NAME="intelliswarm.ai"
S3_BUCKET="intelliswarm-website"

echo -e "${BLUE}🚀 IntelliSwarm.ai AWS Deployment Script${NC}"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI and credentials verified${NC}"

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null
}

# Function to wait for stack completion
wait_for_stack() {
    echo -e "${YELLOW}⏳ Waiting for stack to complete...${NC}"
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION
    echo -e "${GREEN}✅ Stack creation completed!${NC}"
}

# Function to wait for stack update
wait_for_stack_update() {
    echo -e "${YELLOW}⏳ Waiting for stack update to complete...${NC}"
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION
    echo -e "${GREEN}✅ Stack update completed!${NC}"
}

# Deploy or update CloudFormation stack
if stack_exists; then
    echo -e "${YELLOW}📝 Stack $STACK_NAME already exists. Updating...${NC}"
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws-infrastructure.yml \
        --parameters ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME ParameterKey=S3BucketName,ParameterValue=$S3_BUCKET \
        --region $REGION \
        --capabilities CAPABILITY_NAMED_IAM
    
    wait_for_stack_update
else
    echo -e "${YELLOW}🏗️  Creating new stack $STACK_NAME...${NC}"
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws-infrastructure.yml \
        --parameters ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME ParameterKey=S3BucketName,ParameterValue=$S3_BUCKET \
        --region $REGION \
        --capabilities CAPABILITY_NAMED_IAM
    
    wait_for_stack
fi

# Get stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"
CLOUDFRONT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)
HOSTED_ZONE_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`HostedZoneId`].OutputValue' --output text)
NAMESERVERS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`NameServers`].OutputValue' --output text)

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Stack Outputs:${NC}"
echo "CloudFront Distribution ID: $CLOUDFRONT_ID"
echo "Route 53 Hosted Zone ID: $HOSTED_ZONE_ID"
echo "Nameservers: $NAMESERVERS"
echo ""

# Build and deploy the website
echo -e "${YELLOW}🔨 Building the website...${NC}"
npm run build

echo -e "${YELLOW}📤 Deploying to S3...${NC}"
aws s3 sync dist/website s3://$S3_BUCKET --delete --region $REGION

echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --region $REGION

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Update your domain registrar's nameservers to:"
echo "   $NAMESERVERS"
echo ""
echo "2. Wait 24-48 hours for DNS propagation"
echo ""
echo "3. Your website will be available at:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "4. Set up GitHub Actions with these secrets:"
echo "   AWS_ACCESS_KEY_ID: [Your AWS Access Key]"
echo "   AWS_SECRET_ACCESS_KEY: [Your AWS Secret Key]"
echo "   AWS_REGION: $REGION"
echo "   S3_BUCKET: $S3_BUCKET"
echo "   CLOUDFRONT_DISTRIBUTION_ID: $CLOUDFRONT_ID"
echo ""
echo -e "${GREEN}🚀 Happy deploying!${NC}"
