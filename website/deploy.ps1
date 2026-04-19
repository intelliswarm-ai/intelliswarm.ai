# =============================================================================
# IntelliSwarm.ai -- Website Deployment Script (PowerShell)
# =============================================================================
# PowerShell equivalent of terraform/deploy.sh (website portion only).
# Infrastructure must be deployed via Terraform first:
#   cd ..\terraform; terraform init; terraform apply
#
# Usage:
#   ./deploy.ps1              # build + deploy
#   ./deploy.ps1 -SkipBuild   # deploy existing build only
# =============================================================================

param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"

$TF_DIR    = Join-Path (Split-Path $PSScriptRoot) "terraform"
$BUILD_DIR = "dist/intelliswarm-website/browser"
$REGION    = "eu-central-2"

Write-Host "`nIntelliSwarm.ai Website Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# --- Pre-flight checks ---
foreach ($tool in @("aws", "terraform", "node", "npm")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "Required tool '$tool' is not installed." -ForegroundColor Red
        exit 1
    }
}

aws sts get-caller-identity 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}
Write-Host "Pre-flight checks passed." -ForegroundColor Green

# --- Read Terraform outputs ---
if (-not (Test-Path $TF_DIR)) {
    Write-Host "Terraform directory not found at $TF_DIR" -ForegroundColor Red
    exit 1
}

Push-Location $TF_DIR
$S3_BUCKET     = (terraform output -raw s3_bucket_name 2>$null)
$CLOUDFRONT_ID = (terraform output -raw cloudfront_distribution_id 2>$null)
Pop-Location

if (-not $S3_BUCKET) {
    Write-Host "Could not read Terraform outputs. Run 'cd ..\terraform; terraform apply' first." -ForegroundColor Red
    exit 1
}

Write-Host "S3 Bucket:     $S3_BUCKET" -ForegroundColor DarkGray
Write-Host "CloudFront ID: $CLOUDFRONT_ID" -ForegroundColor DarkGray

# --- Build ---
if (-not $SkipBuild) {
    Write-Host "`n--- Building ---" -ForegroundColor Cyan

    Write-Host "Generating blog index..." -ForegroundColor Yellow
    node scripts/generate-blog-index.js
    if ($LASTEXITCODE -ne 0) { Write-Host "Blog index generation failed!" -ForegroundColor Red; exit 1 }

    Write-Host "Generating prerender routes..." -ForegroundColor Yellow
    node scripts/generate-prerender-routes.js
    if ($LASTEXITCODE -ne 0) { Write-Host "Prerender routes generation failed!" -ForegroundColor Red; exit 1 }

    Write-Host "Building Angular production bundle..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

    Write-Host "Build completed." -ForegroundColor Green
}

if (-not (Test-Path $BUILD_DIR)) {
    Write-Host "Build output not found at $BUILD_DIR" -ForegroundColor Red
    exit 1
}

# --- Deploy to S3 (clean slate) ---
Write-Host "`n--- Deploying to S3 ---" -ForegroundColor Cyan

Write-Host "Wiping S3 bucket..." -ForegroundColor Yellow
aws s3 rm "s3://$S3_BUCKET/" --recursive --region $REGION

Write-Host "Uploading hashed assets (1yr cache)..." -ForegroundColor Yellow
aws s3 cp $BUILD_DIR "s3://$S3_BUCKET/" `
    --recursive --exclude "*.html" --exclude "*.json" `
    --cache-control "public,max-age=31536000,immutable" `
    --region $REGION

Write-Host "Uploading HTML pages (no-cache)..." -ForegroundColor Yellow
aws s3 cp $BUILD_DIR "s3://$S3_BUCKET/" `
    --recursive --exclude "*" --include "*.html" `
    --cache-control "no-cache,no-store,must-revalidate" `
    --content-type "text/html" `
    --region $REGION

Write-Host "Uploading JSON files (1hr cache)..." -ForegroundColor Yellow
aws s3 cp $BUILD_DIR "s3://$S3_BUCKET/" `
    --recursive --exclude "*" --include "*.json" `
    --cache-control "public,max-age=3600" `
    --region $REGION

Write-Host "S3 deploy completed." -ForegroundColor Green

# --- Invalidate CloudFront ---
if ($CLOUDFRONT_ID -and $CLOUDFRONT_ID -ne "None") {
    Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*" 2>&1 | Out-Null
    Write-Host "CloudFront invalidation created." -ForegroundColor Green
} else {
    Write-Host "CloudFront ID not found. Skipping invalidation." -ForegroundColor Yellow
}

# --- Done ---
Write-Host "`nDeployment completed!" -ForegroundColor Green
Write-Host "Website: https://intelliswarm.ai" -ForegroundColor Cyan
