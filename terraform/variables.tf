# =============================================================================
# Input Variables
# =============================================================================

variable "aws_region" {
  description = "Primary AWS region for Lambda, DynamoDB, and API Gateway"
  type        = string
  default     = "eu-central-2"
}

variable "domain_name" {
  description = "Root domain name (must match Route 53 hosted zone)"
  type        = string
  default     = "intelliswarm.ai"
}

variable "github_token" {
  description = "GitHub personal access token (for CI/CD integrations, if needed)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "environment" {
  description = "Deployment environment label (e.g. production, staging)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "alert_email" {
  description = "Email address for billing alerts and budget notifications"
  type        = string
}

variable "monthly_budget_usd" {
  description = "Monthly AWS budget limit in USD (alerts at 50%, 80%, 100%)"
  type        = number
  default     = 10
}

variable "contact_email" {
  description = "Email address to receive contact form submissions (must be verified in SES)"
  type        = string
  default     = ""
}

variable "contribute_email" {
  description = "Email address to receive self-improvement contributions (default: contribute@intelliswarm.ai)"
  type        = string
  default     = "contribute@intelliswarm.ai"
}

variable "admin_password" {
  description = "Password for the admin panel at /admin/contributions"
  type        = string
  sensitive   = true
  default     = ""
}
