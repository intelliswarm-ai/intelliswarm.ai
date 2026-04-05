# =============================================================================
# Outputs
# =============================================================================
# After `terraform apply`, these values are printed and can be queried with
# `terraform output <name>`. The nameservers must be entered in GoDaddy's
# DNS management panel to delegate the domain to Route 53.
# =============================================================================

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "api_gateway_url" {
  description = "API Gateway HTTP API invoke URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "route53_nameservers" {
  description = "Route 53 nameservers -- configure these in GoDaddy"
  value       = aws_route53_zone.main.name_servers
}

output "s3_bucket_name" {
  description = "S3 bucket holding the Angular frontend static files"
  value       = aws_s3_bucket.frontend.id
}

output "lambda_function_name" {
  description = "Name of the deployed Lambda function"
  value       = aws_lambda_function.backend.function_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.website.id
}

output "godaddy_instructions" {
  description = "What to do in GoDaddy after deploy"
  value       = <<-EOT

    ╔══════════════════════════════════════════════════════════════╗
    ║  DEPLOY COMPLETE — One manual step remaining:               ║
    ║                                                              ║
    ║  Go to GoDaddy → intelliswarm.ai → DNS → Nameservers       ║
    ║  Change to CUSTOM and enter these 4 nameservers:            ║
    ║                                                              ║
    ║    ${join("\n    ║    ", aws_route53_zone.main.name_servers)}
    ║                                                              ║
    ║  DNS propagation takes 15 min to 48 hours.                  ║
    ║  Budget alert set at $${var.monthly_budget_usd}/mo → ${var.alert_email}
    ╚══════════════════════════════════════════════════════════════╝
  EOT
}
