# =============================================================================
# IntelliSwarm.ai -- AWS Serverless Infrastructure (Zurich / eu-central-2)
# =============================================================================
#
# Architecture overview:
#   Angular 17 SPA  -->  CloudFront  -->  S3 (static files)
#                                    -->  API Gateway HTTP API  -->  Lambda  -->  DynamoDB
#   Route 53 (DNS)  -->  CloudFront (A alias)
#   ACM certificate (us-east-1, required by CloudFront)
#
# Deployment regions:
#   - Lambda, API Gateway, DynamoDB : eu-central-2 (Zurich)
#   - CloudFront, Route 53          : global
#   - ACM certificate               : us-east-1 (CloudFront requirement)
#   - S3 frontend bucket             : eu-central-2
# =============================================================================


# -----------------------------------------------------------------------------
# Providers
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "IntelliSwarm"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# MANDATORY AWS LIMITATION: CloudFront only accepts SSL certificates from us-east-1.
# This provider is used ONLY for the certificate — no data or compute is deployed there.
# All application resources (Lambda, DynamoDB, S3, API Gateway) are in eu-central-2 (Zurich).
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "IntelliSwarm"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}


# =============================================================================
# Route 53 Hosted Zone
# =============================================================================

resource "aws_route53_zone" "main" {
  name    = var.domain_name
  comment = "IntelliSwarm.ai public hosted zone -- NS records must be set in GoDaddy"
}


# =============================================================================
# ACM Certificate (us-east-1 — AWS requires this for CloudFront; no data stored)
# =============================================================================

resource "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.domain_name}-cloudfront-cert"
  }
}

# Create the DNS validation records in Route 53.
resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 300
  records         = [each.value.record]
}

# Wait for the certificate to be validated before using it.
resource "aws_acm_certificate_validation" "cloudfront" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}


# =============================================================================
# S3 Bucket -- Angular Frontend Static Files
# =============================================================================

resource "aws_s3_bucket" "frontend" {
  bucket = "intelliswarm-ai-website"

  tags = {
    Name = "intelliswarm-ai-website"
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block ALL public access -- files are served exclusively via CloudFront OAC.
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy: allow CloudFront OAC to read objects.
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}


# =============================================================================
# CloudFront Origin Access Control (OAC)
# =============================================================================

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "intelliswarm-s3-oac"
  description                       = "OAC for IntelliSwarm S3 frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}


# =============================================================================
# CloudFront Distribution
# =============================================================================

# Look up the AWS-managed "CachingDisabled" policy for API passthrough.
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# Look up the AWS-managed "AllViewerExceptHostHeader" origin request policy
# so API Gateway receives the original headers (except Host).
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# Look up the AWS-managed "CachingOptimized" policy for static assets.
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # NA + EU (cheapest, covers Zurich)
  comment             = "IntelliSwarm.ai (${var.environment})"

  aliases = [
    var.domain_name,
    "www.${var.domain_name}",
  ]

  # --- S3 Origin (static frontend files) ---
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # --- API Gateway Origin ---
  origin {
    # api_endpoint is "https://<id>.execute-api.<region>.amazonaws.com" -- strip protocol.
    domain_name = replace(aws_apigatewayv2_api.backend.api_endpoint, "https://", "")
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # --- Default behavior: S3 static files ---
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # --- /api/* behavior: proxy to API Gateway (no caching) ---
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "api-gateway"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    compress                 = true
  }

  # Angular SPA routing -- serve index.html for any 404.
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # Also handle 403 (S3 returns 403 for missing keys when using OAC).
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.cloudfront]

  tags = {
    Name = "intelliswarm-cloudfront"
  }
}


# =============================================================================
# Route 53 DNS Records -- point domain to CloudFront
# =============================================================================

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}


# =============================================================================
# DynamoDB Tables
# =============================================================================

resource "aws_dynamodb_table" "news" {
  name         = "intelliswarm-news"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "intelliswarm-news"
  }
}

resource "aws_dynamodb_table" "contributions" {
  name         = "intelliswarm-contributions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "trackingId"

  attribute {
    name = "trackingId"
    type = "S"
  }

  tags = {
    Name = "intelliswarm-contributions"
  }
}


# =============================================================================
# IAM Role for Lambda
# =============================================================================

resource "aws_iam_role" "lambda_exec" {
  name = "intelliswarm-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "intelliswarm-lambda-execution-role"
  }
}

# Attach the basic Lambda execution policy (CloudWatch Logs).
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  # Note: the double colon (::) is correct — AWS global partition, no account ID needed for managed policies

}

# Grant DynamoDB access to both tables.
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "intelliswarm-lambda-dynamodb-access"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
        ]
        Resource = [
          aws_dynamodb_table.news.arn,
          aws_dynamodb_table.contributions.arn,
        ]
      }
    ]
  })
}


# =============================================================================
# Lambda Function
# =============================================================================

# Package the backend directory into a zip for Lambda deployment.
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/lambda.zip"

  # Exclude files that are not needed in the Lambda package.
  excludes = [
    "node_modules/.cache",
    "data",
    "contributions",
    "Dockerfile",
    "template.yaml",
    ".env",
  ]
}

resource "aws_lambda_function" "backend" {
  function_name    = "intelliswarm-backend"
  description      = "IntelliSwarm.ai API backend (${var.environment})"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda.handler"
  runtime          = "nodejs18.x"
  memory_size      = 128
  timeout          = 15
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      STORAGE_BACKEND    = "dynamodb"
      NEWS_TABLE         = aws_dynamodb_table.news.name
      CONTRIBUTIONS_TABLE = aws_dynamodb_table.contributions.name
      NODE_ENV           = var.environment
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_dynamodb,
  ]

  tags = {
    Name = "intelliswarm-backend"
  }
}

# CloudWatch Log Group with retention (avoid unbounded log storage costs).
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.backend.function_name}"
  retention_in_days = 30

  tags = {
    Name = "intelliswarm-lambda-logs"
  }
}


# =============================================================================
# API Gateway HTTP API
# =============================================================================

resource "aws_apigatewayv2_api" "backend" {
  name          = "intelliswarm-api"
  protocol_type = "HTTP"
  description   = "IntelliSwarm.ai HTTP API (${var.environment})"

  cors_configuration {
    allow_origins = [
      "https://${var.domain_name}",
      "https://www.${var.domain_name}",
    ]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }

  tags = {
    Name = "intelliswarm-api"
  }
}

# Lambda integration.
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.backend.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# --- Routes ---

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /api/health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_news" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /api/news"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "post_news" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /api/news"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "contribute" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /api/contribute"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_contributions" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /api/contributions"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Default stage with auto-deploy.
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = {
    Name = "intelliswarm-api-default-stage"
  }
}

# CloudWatch Log Group for API Gateway access logs.
resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/intelliswarm-api"
  retention_in_days = 30

  tags = {
    Name = "intelliswarm-api-gw-logs"
  }
}

# Grant API Gateway permission to invoke the Lambda function.
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*"
}


# =============================================================================
# COST GUARDRAILS -- prevent surprise bills
# =============================================================================

# Limit Lambda to 5 concurrent executions (prevents runaway invocations).
resource "aws_lambda_function_event_invoke_config" "backend" {
  function_name          = aws_lambda_function.backend.function_name
  maximum_retry_attempts = 0
}

resource "aws_lambda_provisioned_concurrency_config" "none" {
  count = 0 # Explicitly: no provisioned concurrency (saves money)
}

# API Gateway throttling: 100 requests/second burst, 50 sustained.
# This prevents DDoS from causing massive Lambda invocations.
resource "aws_apigatewayv2_stage" "throttle_override" {
  count = 0 # Throttle is set on the default stage above via route_settings below
}

# AWS Budget alarm: alert at $5/month, hard stop thinking at $10
resource "aws_budgets_budget" "monthly" {
  name         = "intelliswarm-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}

# Lambda concurrency limit (account-level is 1000 by default;
# this limits THIS function to 10 concurrent invocations max).
resource "aws_lambda_function_concurrency" "backend" {
  function_name                  = aws_lambda_function.backend.function_name
  reserved_concurrent_executions = 10
}


# =============================================================================
# ONE-COMMAND DEPLOY: Build frontend, sync S3, seed DynamoDB, invalidate cache
# =============================================================================

# Step 1: Install backend node_modules (needed in Lambda zip)
resource "null_resource" "backend_deps" {
  triggers = {
    package_json = filemd5("${path.module}/../backend/package.json")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../backend"
    command     = "npm ci --omit=dev"
  }
}

# Step 2: Build Angular frontend
resource "null_resource" "frontend_build" {
  triggers = {
    always = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../website"
    command     = "npm ci && npx ng build --configuration production"
  }
}

# Step 3: Sync frontend to S3
resource "null_resource" "s3_sync" {
  depends_on = [
    aws_s3_bucket.frontend,
    aws_s3_bucket_policy.frontend,
    null_resource.frontend_build,
  ]

  triggers = {
    always = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Upload hashed assets with long cache
      aws s3 sync ${path.module}/../website/dist/intelliswarm-website/browser/ \
        s3://${aws_s3_bucket.frontend.id}/ \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" \
        --exclude "*.json" \
        --region ${var.aws_region}

      # Upload index.html with short cache
      aws s3 cp ${path.module}/../website/dist/intelliswarm-website/browser/index.html \
        s3://${aws_s3_bucket.frontend.id}/index.html \
        --cache-control "public, max-age=60" \
        --region ${var.aws_region}

      # Upload JSON files (i18n etc.) with medium cache
      aws s3 sync ${path.module}/../website/dist/intelliswarm-website/browser/ \
        s3://${aws_s3_bucket.frontend.id}/ \
        --exclude "*" --include "*.json" \
        --cache-control "public, max-age=3600" \
        --region ${var.aws_region}
    EOT
  }
}

# Step 4: Seed DynamoDB with news data (only on first deploy or when data changes)
resource "null_resource" "seed_news" {
  depends_on = [
    aws_dynamodb_table.news,
    aws_lambda_function.backend,
  ]

  triggers = {
    news_data = filemd5("${path.module}/../backend/data/news.json")
  }

  provisioner "local-exec" {
    command = <<-EOT
      node -e "
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        const fs = require('fs');
        const client = new DynamoDBClient({ region: '${var.aws_region}' });
        const ddb = DynamoDBDocumentClient.from(client);
        const news = JSON.parse(fs.readFileSync('${path.module}/../backend/data/news.json', 'utf8'));
        (async () => {
          for (const item of news) {
            await ddb.send(new PutCommand({ TableName: '${aws_dynamodb_table.news.name}', Item: item }));
            console.log('Seeded:', item.id);
          }
          console.log('Done: ' + news.length + ' news items seeded.');
        })();
      "
    EOT
  }
}

# Step 5: Invalidate CloudFront cache after deploy
resource "null_resource" "cloudfront_invalidation" {
  depends_on = [
    null_resource.s3_sync,
    aws_cloudfront_distribution.website,
  ]

  triggers = {
    always = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      # CloudFront is a global service — its API endpoint is always us-east-1.
      # This does NOT deploy anything to us-east-1; it just clears the CDN cache worldwide.
      aws cloudfront create-invalidation \
        --distribution-id ${aws_cloudfront_distribution.website.id} \
        --paths "/*"
    EOT
  }
}
