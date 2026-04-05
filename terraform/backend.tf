# =============================================================================
# Remote State Backend (S3 + DynamoDB Locking)
# =============================================================================
# Uncomment the block below after you have manually created the state bucket
# and lock table. This keeps Terraform state in S3 (encrypted, versioned) and
# uses DynamoDB for state locking so that concurrent runs do not corrupt state.
#
# Prerequisites (run once, manually or via a bootstrap script):
#
#   aws s3api create-bucket \
#     --bucket intelliswarm-terraform-state \
#     --region eu-central-2 \
#     --create-bucket-configuration LocationConstraint=eu-central-2
#
#   aws s3api put-bucket-versioning \
#     --bucket intelliswarm-terraform-state \
#     --versioning-configuration Status=Enabled
#
#   aws s3api put-bucket-encryption \
#     --bucket intelliswarm-terraform-state \
#     --server-side-encryption-configuration \
#       '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
#
#   aws s3api put-public-access-block \
#     --bucket intelliswarm-terraform-state \
#     --public-access-block-configuration \
#       BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
#
#   aws dynamodb create-table \
#     --table-name intelliswarm-terraform-locks \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST \
#     --region eu-central-2
#
# Then uncomment the following block and run `terraform init -migrate-state`.
# =============================================================================

# terraform {
#   backend "s3" {
#     bucket         = "intelliswarm-terraform-state"
#     key            = "production/terraform.tfstate"
#     region         = "eu-central-2"
#     encrypt        = true
#     dynamodb_table = "intelliswarm-terraform-locks"
#   }
# }
