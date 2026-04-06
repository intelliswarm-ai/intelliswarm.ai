## IntelliSwarm.ai - Deploy Script (Windows PowerShell)
## Usage: powershell -ExecutionPolicy Bypass -File deploy.ps1
## Options: -SkipBuild to only sync/invalidate without rebuilding

param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$WEBSITE = Join-Path $ROOT "website"
$TERRAFORM = Join-Path $ROOT "terraform"
$DIST = Join-Path (Join-Path (Join-Path $WEBSITE "dist") "intelliswarm-website") "browser"
$S3_BUCKET = "intelliswarm-ai-website"
$CF_DISTRIBUTION = "E739NC8EGUCFR"
$REGION = "eu-central-2"

Write-Host ""
Write-Host "=== IntelliSwarm.ai Deploy ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build frontend
if (-not $SkipBuild) {
    Write-Host "[1/5] Building Angular frontend..." -ForegroundColor Yellow
    Push-Location $WEBSITE
    npm install 2>&1 | Out-Null
    npx ng build --configuration production
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Frontend build failed" }
    Pop-Location
    Write-Host "      Frontend built." -ForegroundColor Green
} else {
    Write-Host "[1/5] Skipping build (-SkipBuild)" -ForegroundColor DarkGray
}

# Step 2: Sync static assets to S3 (long cache)
Write-Host "[2/5] Uploading assets to S3..." -ForegroundColor Yellow
aws s3 sync "$DIST" "s3://$S3_BUCKET/" --delete --cache-control "public,max-age=31536000,immutable" --exclude "index.html" --exclude "*.json" --region $REGION
if ($LASTEXITCODE -ne 0) { throw "S3 asset sync failed" }
Write-Host "      Assets uploaded." -ForegroundColor Green

# Step 3: Upload index.html (short cache)
Write-Host "[3/5] Uploading index.html..." -ForegroundColor Yellow
aws s3 cp "$DIST\index.html" "s3://$S3_BUCKET/index.html" --cache-control "public,max-age=60" --region $REGION
if ($LASTEXITCODE -ne 0) { throw "index.html upload failed" }

# Upload JSON files (i18n, medium cache)
aws s3 sync "$DIST" "s3://$S3_BUCKET/" --exclude "*" --include "*.json" --cache-control "public,max-age=3600" --region $REGION
if ($LASTEXITCODE -ne 0) { throw "JSON sync failed" }
Write-Host "      index.html + JSON uploaded." -ForegroundColor Green

# Step 4: Invalidate CloudFront cache
Write-Host "[4/5] Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $CF_DISTRIBUTION --paths "/*" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "CloudFront invalidation failed" }
Write-Host "      Cache invalidated (takes ~60s to propagate)." -ForegroundColor Green

# Step 5: Update Lambda (only if backend changed)
if (-not $SkipBuild) {
    Write-Host "[5/5] Packaging and updating Lambda..." -ForegroundColor Yellow
    Push-Location $TERRAFORM
    powershell -ExecutionPolicy Bypass -File package-lambda.ps1
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Lambda packaging failed" }

    aws lambda update-function-code --function-name intelliswarm-backend --zip-file "fileb://lambda.zip" --region $REGION | Out-Null
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Lambda update failed" }
    Pop-Location
    Write-Host "      Lambda updated." -ForegroundColor Green
} else {
    Write-Host "[5/5] Skipping Lambda (-SkipBuild)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== Deploy complete! ===" -ForegroundColor Green
Write-Host "Site: https://intelliswarm.ai" -ForegroundColor Cyan
Write-Host "API:  https://intelliswarm.ai/api/health" -ForegroundColor Cyan
Write-Host ""
