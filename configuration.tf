provider "aws" {
  region = var.aws_region
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# S3 Bucket for Angular Frontend (AWS)
resource "aws_s3_bucket" "frontend" {
  bucket = var.s3_bucket_name
  acl    = "public-read"
}

# Cloud Storage for Angular Frontend (GCP)
resource "google_storage_bucket" "frontend" {
  name     = var.gcp_bucket_name
  location = var.gcp_region
}

# AWS Lambda for FastAPI Backend
resource "aws_lambda_function" "backend" {
  function_name    = "intelliswarm-backend"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "main.lambda_handler"
  runtime         = "python3.9"
  filename        = "backend.zip"
  source_code_hash = filebase64sha256("backend.zip")
}

# Google Cloud Run for FastAPI Backend
resource "google_cloud_run_service" "backend" {
  name     = "intelliswarm-backend"
  location = var.gcp_region
  template {
    spec {
      containers {
        image = var.gcp_backend_image
      }
    }
  }
}

# AWS DynamoDB for Database
resource "aws_dynamodb_table" "database" {
  name         = "intelliswarm"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
}

# GCP Firestore Database
resource "google_firestore_database" "database" {
  name          = "intelliswarm"
  location_id   = var.gcp_region
  type          = "FIRESTORE_NATIVE"
}

# AWS Cognito Authentication
resource "aws_cognito_user_pool" "users" {
  name = "intelliswarm-users"
}

# Firebase Authentication (GCP)
resource "google_identity_platform_config" "firebase_auth" {
  project = var.gcp_project_id
}

# Route 53 Domain Configuration
resource "aws_route53_zone" "domain" {
  name = var.domain_name
}

# Google Cloud Domains
resource "google_domains_registration" "domain" {
  domain_name = var.domain_name
}
