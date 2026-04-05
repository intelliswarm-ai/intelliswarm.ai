#!/usr/bin/env bash
# =============================================================================
# IntelliSwarm.ai -- Full-Stack Deployment Script
# =============================================================================
# This script:
#   1. Provisions/updates AWS infrastructure via Terraform
#   2. Builds the Angular 17 frontend
#   3. Syncs static files to S3 with appropriate cache headers
#   4. Packages & deploys the Lambda backend
#   5. Invalidates the CloudFront cache
#   6. Prints Route 53 nameservers for GoDaddy configuration
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh              # full deployment
#   ./deploy.sh --skip-infra # skip Terraform, only deploy code
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEBSITE_DIR="$PROJECT_ROOT/website"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# -----------------------------------------------------------------------------
# Pre-flight checks
# -----------------------------------------------------------------------------
check_tool() {
  if ! command -v "$1" &>/dev/null; then
    log_error "Required tool '$1' is not installed."
    exit 1
  fi
}

check_tool terraform
check_tool aws
check_tool node
check_tool npm
check_tool zip

log_info "All required tools are available."

SKIP_INFRA=false
if [[ "${1:-}" == "--skip-infra" ]]; then
  SKIP_INFRA=true
  log_warn "Skipping Terraform infrastructure provisioning (--skip-infra)."
fi

# -----------------------------------------------------------------------------
# Step 1: Terraform -- Infrastructure
# -----------------------------------------------------------------------------
if [[ "$SKIP_INFRA" == false ]]; then
  log_info "=== Step 1: Terraform Infrastructure ==="

  cd "$SCRIPT_DIR"

  log_info "Running terraform init..."
  terraform init -input=false

  log_info "Running terraform plan..."
  terraform plan -out=tfplan

  echo ""
  echo -e "${YELLOW}Review the plan above. Do you want to apply these changes?${NC}"
  read -rp "Type 'yes' to continue: " CONFIRM

  if [[ "$CONFIRM" != "yes" ]]; then
    log_warn "Deployment cancelled by user."
    rm -f tfplan
    exit 0
  fi

  log_info "Applying Terraform changes..."
  terraform apply tfplan
  rm -f tfplan

  log_ok "Infrastructure provisioned successfully."
else
  cd "$SCRIPT_DIR"
fi

# Fetch Terraform outputs for later steps.
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='IntelliSwarm.ai (production)'].Id | [0]" \
  --output text 2>/dev/null || echo "")
LAMBDA_NAME=$(terraform output -raw lambda_function_name)

if [[ -z "$S3_BUCKET" || -z "$LAMBDA_NAME" ]]; then
  log_error "Failed to read Terraform outputs. Ensure terraform apply has run."
  exit 1
fi

# Try to get CloudFront distribution ID from AWS CLI if the comment-based query failed.
if [[ -z "$CLOUDFRONT_DIST_ID" || "$CLOUDFRONT_DIST_ID" == "None" ]]; then
  CF_DOMAIN=$(terraform output -raw cloudfront_domain)
  CLOUDFRONT_DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='${CF_DOMAIN}'].Id | [0]" \
    --output text 2>/dev/null || echo "")
fi

log_info "S3 Bucket:      $S3_BUCKET"
log_info "Lambda:         $LAMBDA_NAME"
log_info "CloudFront ID:  $CLOUDFRONT_DIST_ID"

# -----------------------------------------------------------------------------
# Step 2: Build Angular Frontend
# -----------------------------------------------------------------------------
log_info "=== Step 2: Build Angular Frontend ==="

cd "$WEBSITE_DIR"

log_info "Installing dependencies..."
npm ci --prefer-offline

log_info "Building production bundle..."
npm run build -- --configuration production

# Angular 17 with application builder outputs to dist/<project>/browser
BUILD_DIR="$WEBSITE_DIR/dist/intelliswarm-website/browser"

if [[ ! -d "$BUILD_DIR" ]]; then
  # Fallback for older output structure
  BUILD_DIR="$WEBSITE_DIR/dist/intelliswarm-website"
fi

if [[ ! -d "$BUILD_DIR" ]]; then
  log_error "Build output not found. Expected: $BUILD_DIR"
  exit 1
fi

log_ok "Frontend built at: $BUILD_DIR"

# -----------------------------------------------------------------------------
# Step 3: Sync Frontend to S3
# -----------------------------------------------------------------------------
log_info "=== Step 3: Sync to S3 ==="

# HTML files: short cache, must revalidate (for Angular routing).
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" \
  --delete \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Hashed JS/CSS bundles: long-lived immutable cache.
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" \
  --exclude "*.html" \
  --include "*.js" --include "*.css" \
  --cache-control "public, max-age=31536000, immutable"

# Everything else (images, fonts, favicon, manifest, etc.): moderate cache.
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" \
  --exclude "*.html" \
  --exclude "*.js" \
  --exclude "*.css" \
  --cache-control "public, max-age=86400"

log_ok "Frontend synced to s3://$S3_BUCKET"

# -----------------------------------------------------------------------------
# Step 4: Deploy Lambda Backend
# -----------------------------------------------------------------------------
log_info "=== Step 4: Deploy Lambda ==="

cd "$BACKEND_DIR"

# Install production dependencies only.
log_info "Installing Lambda production dependencies..."
npm ci --prefer-offline --omit=dev

# Create a clean zip for Lambda.
LAMBDA_ZIP="$SCRIPT_DIR/lambda-deploy.zip"
rm -f "$LAMBDA_ZIP"

log_info "Packaging Lambda function..."
zip -r "$LAMBDA_ZIP" \
  lambda.js \
  server.js \
  handlers/ \
  storage/ \
  node_modules/ \
  package.json \
  -x "node_modules/.cache/*" \
  -x "node_modules/.package-lock.json" \
  >/dev/null

LAMBDA_SIZE=$(du -h "$LAMBDA_ZIP" | cut -f1)
log_info "Lambda package size: $LAMBDA_SIZE"

log_info "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file "fileb://$LAMBDA_ZIP" \
  --region "$(terraform -chdir="$SCRIPT_DIR" output -raw 2>/dev/null || echo 'eu-central-2')" \
  --output text --query 'FunctionName'

# Wait for the update to complete.
log_info "Waiting for Lambda update to stabilize..."
aws lambda wait function-updated \
  --function-name "$LAMBDA_NAME" \
  --region "eu-central-2" 2>/dev/null || true

rm -f "$LAMBDA_ZIP"

log_ok "Lambda function updated."

# -----------------------------------------------------------------------------
# Step 5: Invalidate CloudFront Cache
# -----------------------------------------------------------------------------
log_info "=== Step 5: Invalidate CloudFront Cache ==="

if [[ -n "$CLOUDFRONT_DIST_ID" && "$CLOUDFRONT_DIST_ID" != "None" ]]; then
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)
  log_ok "CloudFront invalidation created: $INVALIDATION_ID"
else
  log_warn "Could not determine CloudFront distribution ID. Skipping invalidation."
  log_warn "You can manually invalidate via: aws cloudfront create-invalidation --distribution-id <ID> --paths '/*'"
fi

# -----------------------------------------------------------------------------
# Step 6: Print Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "============================================================================="
echo ""

cd "$SCRIPT_DIR"

CF_DOMAIN=$(terraform output -raw cloudfront_domain 2>/dev/null || echo "N/A")
API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "N/A")

echo -e "  CloudFront:   ${CYAN}https://$CF_DOMAIN${NC}"
echo -e "  API Gateway:  ${CYAN}$API_URL${NC}"
echo -e "  Website:      ${CYAN}https://intelliswarm.ai${NC}"
echo ""

echo "============================================================================="
echo -e "${YELLOW}  Route 53 Nameservers (configure these in GoDaddy):${NC}"
echo "============================================================================="
terraform output -json route53_nameservers 2>/dev/null | \
  python3 -c "import sys, json; [print(f'  {ns}') for ns in json.load(sys.stdin)]" 2>/dev/null || \
  terraform output route53_nameservers 2>/dev/null || \
  echo "  (Run 'terraform output route53_nameservers' to see them)"
echo ""
echo "  In GoDaddy DNS Management, set the nameservers to the values above."
echo "  DNS propagation may take up to 48 hours."
echo "============================================================================="
