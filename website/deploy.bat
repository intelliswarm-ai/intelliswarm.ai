@echo off
REM 🚀 IntelliSwarm.ai AWS Deployment Script for Windows
REM This script automates the deployment of your website to AWS

setlocal enabledelayedexpansion

REM Configuration
set STACK_NAME=intelliswarm-website
set REGION=us-east-1
set DOMAIN_NAME=intelliswarm.ai
set S3_BUCKET=intelliswarm-website

echo 🚀 IntelliSwarm.ai AWS Deployment Script
echo ==================================================

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ AWS CLI is not installed. Please install it first.
    echo Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
    pause
    exit /b 1
)

REM Check if AWS credentials are configured
aws sts get-caller-identity >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ AWS credentials not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

echo ✅ AWS CLI and credentials verified

REM Function to check if stack exists
aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% >nul 2>nul
if %errorlevel% equ 0 (
    echo 📝 Stack %STACK_NAME% already exists. Updating...
    aws cloudformation update-stack --stack-name %STACK_NAME% --template-body file://aws-infrastructure.yml --parameters ParameterKey=DomainName,ParameterValue=%DOMAIN_NAME% ParameterKey=S3BucketName,ParameterValue=%S3_BUCKET% --region %REGION% --capabilities CAPABILITY_NAMED_IAM
    
    echo ⏳ Waiting for stack update to complete...
    aws cloudformation wait stack-update-complete --stack-name %STACK_NAME% --region %REGION%
    echo ✅ Stack update completed!
) else (
    echo 🏗️  Creating new stack %STACK_NAME%...
    aws cloudformation create-stack --stack-name %STACK_NAME% --template-body file://aws-infrastructure.yml --parameters ParameterKey=DomainName,ParameterValue=%DOMAIN_NAME% ParameterKey=S3BucketName,ParameterValue=%S3_BUCKET% --region %REGION% --capabilities CAPABILITY_NAMED_IAM
    
    echo ⏳ Waiting for stack to complete...
    aws cloudformation wait stack-create-complete --stack-name %STACK_NAME% --region %REGION%
    echo ✅ Stack creation completed!
)

REM Get stack outputs
echo 📋 Getting stack outputs...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text') do set CLOUDFRONT_ID=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='HostedZoneId'].OutputValue" --output text') do set HOSTED_ZONE_ID=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='NameServers'].OutputValue" --output text') do set NAMESERVERS=%%i

echo ✅ Infrastructure deployed successfully!
echo.
echo 📊 Stack Outputs:
echo CloudFront Distribution ID: %CLOUDFRONT_ID%
echo Route 53 Hosted Zone ID: %HOSTED_ZONE_ID%
echo Nameservers: %NAMESERVERS%
echo.

REM Build and deploy the website
echo 🔨 Building the website...
call npm run build

echo 📤 Deploying to S3...
aws s3 sync dist/website s3://%S3_BUCKET% --delete --region %REGION%

echo 🔄 Invalidating CloudFront cache...
aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_ID% --paths "/*" --region %REGION%

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next Steps:
echo 1. Update your domain registrar's nameservers to:
echo    %NAMESERVERS%
echo.
echo 2. Wait 24-48 hours for DNS propagation
echo.
echo 3. Your website will be available at:
echo    https://%DOMAIN_NAME%
echo.
echo 4. Set up GitHub Actions with these secrets:
echo    AWS_ACCESS_KEY_ID: [Your AWS Access Key]
echo    AWS_SECRET_ACCESS_KEY: [Your AWS Secret Key]
echo    AWS_REGION: %REGION%
echo    S3_BUCKET: %S3_BUCKET%
echo    CLOUDFRONT_DISTRIBUTION_ID: %CLOUDFRONT_ID%
echo.
echo 🚀 Happy deploying!
pause
