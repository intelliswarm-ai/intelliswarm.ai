# =============================================================================
# Terraform and Provider Version Constraints
# =============================================================================
# Pinned to AWS provider ~> 5.0 for stability. Terraform >= 1.5 required
# for the `check` block and other modern HCL features.
# =============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}
