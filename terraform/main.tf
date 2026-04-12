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

  # --- /api/* behavior: proxy to API Gateway (no caching, forward cookies) ---
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

resource "aws_dynamodb_table" "contacts" {
  name         = "intelliswarm-contacts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "contactId"

  attribute {
    name = "contactId"
    type = "S"
  }

  tags = {
    Name = "intelliswarm-contacts"
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
          aws_dynamodb_table.contacts.arn,
        ]
      }
    ]
  })
}

# Grant SES permission to send email notifications for contact form submissions.
resource "aws_iam_role_policy" "lambda_ses" {
  name = "intelliswarm-lambda-ses-send"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}


# =============================================================================
# SES -- Email notifications for contact form
# =============================================================================

# Verify the email address in SES. After `terraform apply`, AWS sends a
# verification email — click the link to activate sending.
resource "aws_ses_email_identity" "contact" {
  count = var.contact_email != "" ? 1 : 0
  email = var.contact_email
}


# =============================================================================
# Lambda Function
# =============================================================================

# Package the backend into a zip for Lambda.
# Uses archive_file with an explicit file list to avoid Windows symlink issues
# in node_modules/.bin (which archive_file cannot read on Windows).
#
# Strategy: we zip only the files Lambda needs, NOT the full node_modules.
# Lambda deps are installed fresh via null_resource.backend_deps which runs
# npm ci --omit=dev in a staging directory.

resource "null_resource" "lambda_staging" {
  depends_on = [null_resource.backend_deps]

  triggers = {
    lambda_handler = filemd5("${path.module}/../backend/lambda.js")
    package_json   = filemd5("${path.module}/../backend/package.json")
    health_handler = filemd5("${path.module}/../backend/handlers/health.js")
    news_handler   = filemd5("${path.module}/../backend/handlers/news.js")
    contrib_handler = filemd5("${path.module}/../backend/handlers/contribute.js")
    storage_index  = filemd5("${path.module}/../backend/storage/index.js")
    storage_dynamo = filemd5("${path.module}/../backend/storage/dynamodb.js")
    contact_handler = filemd5("${path.module}/../backend/handlers/contact.js")
    admin_auth      = filemd5("${path.module}/../backend/handlers/admin-auth.js")
  }

  # Package Lambda via external PowerShell script (avoids heredoc escaping issues)
  provisioner "local-exec" {
    command = "powershell -ExecutionPolicy Bypass -File package-lambda.ps1"
  }
}

resource "aws_lambda_function" "backend" {
  function_name                  = "intelliswarm-backend"
  description                    = "IntelliSwarm.ai API backend (${var.environment})"
  role                           = aws_iam_role.lambda_exec.arn
  handler                        = "lambda.handler"
  runtime                        = "nodejs18.x"
  memory_size                    = 128
  timeout                        = 15
  reserved_concurrent_executions = -1 # No reserved concurrency (uses account default pool)
  filename                       = "${path.module}/lambda.zip"

  environment {
    variables = {
      STORAGE_BACKEND     = "dynamodb"
      NEWS_TABLE          = aws_dynamodb_table.news.name
      CONTRIBUTIONS_TABLE = aws_dynamodb_table.contributions.name
      CONTACTS_TABLE      = aws_dynamodb_table.contacts.name
      CONTACT_EMAIL       = var.contact_email
      CONTRIBUTE_EMAIL    = var.contribute_email
      ADMIN_PASSWORD      = var.admin_password
      NODE_ENV            = var.environment
    }
  }

  depends_on = [
    null_resource.lambda_staging,
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

resource "aws_apigatewayv2_route" "post_contact" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /api/contact"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# --- Admin routes ---

resource "aws_apigatewayv2_route" "admin_login" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /api/admin/login"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "admin_logout" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /api/admin/logout"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "admin_auth_check" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /api/admin/auth-check"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "admin_get_contributions" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /api/admin/contributions"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "admin_get_contribution" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /api/admin/contributions/{trackingId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "admin_review_contribution" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /api/admin/contributions/{trackingId}/review"
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



# =============================================================================
# ONE-COMMAND DEPLOY: Build frontend, sync S3, seed DynamoDB, invalidate cache
# =============================================================================

# Step 1: Install backend node_modules (needed in Lambda staging)
resource "null_resource" "backend_deps" {
  triggers = {
    package_json = filemd5("${path.module}/../backend/package.json")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../backend"
    command     = "npm install --omit=dev"
  }
}

# Step 2: Build Angular frontend (only rebuilds when source changes)
resource "null_resource" "frontend_build" {
  triggers = {
    app_module = filemd5("${path.module}/../website/src/app/app.module.ts")
    package    = filemd5("${path.module}/../website/package.json")
    index_html = filemd5("${path.module}/../website/src/index.html")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../website"
    command     = "npm install && node scripts/generate-blog-index.js && npx ng build --configuration production"
  }
}

# Step 3: Sync frontend to S3 (runs after frontend_build changes)
resource "null_resource" "s3_sync" {
  depends_on = [
    aws_s3_bucket.frontend,
    aws_s3_bucket_policy.frontend,
    null_resource.frontend_build,
  ]

  triggers = {
    frontend_build_id = null_resource.frontend_build.id
  }

  # Deploy to S3: wipe + fresh upload with per-type cache headers
  provisioner "local-exec" {
    command = "powershell -ExecutionPolicy Bypass -File scripts/s3-deploy.ps1 -BuildDir '${path.module}/../website/dist/intelliswarm-website/browser/' -Bucket '${aws_s3_bucket.frontend.id}' -Region '${var.aws_region}'"
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
    command = "node seed-news.js"
    environment = {
      AWS_REGION = var.aws_region
      NEWS_TABLE = aws_dynamodb_table.news.name
    }
  }
}

# Step 5: Invalidate CloudFront cache after deploy
resource "null_resource" "cloudfront_invalidation" {
  depends_on = [
    null_resource.s3_sync,
    aws_cloudfront_distribution.website,
  ]

  triggers = {
    s3_sync_id = null_resource.s3_sync.id
  }

  provisioner "local-exec" {
    command = "powershell -ExecutionPolicy Bypass -Command \"aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.website.id} --paths '/*'\""
  }
}
