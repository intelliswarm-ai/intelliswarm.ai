param(
    [Parameter(Mandatory)][string]$BuildDir,
    [Parameter(Mandatory)][string]$Bucket,
    [Parameter(Mandatory)][string]$Region
)

$ErrorActionPreference = "Stop"

# Strip stray quotes that Terraform+cmd double-layering may leave behind
$BuildDir = $BuildDir.Trim("'").Trim('"')
$Bucket   = $Bucket.Trim("'").Trim('"')
$Region   = $Region.Trim("'").Trim('"')

Write-Host "Wiping S3 bucket $Bucket..."
aws s3 rm "s3://$Bucket/" --recursive --region $Region

Write-Host "Uploading hashed assets (1yr cache)..."
aws s3 cp $BuildDir "s3://$Bucket/" --recursive --exclude "*.html" --exclude "*.json" --cache-control "public,max-age=31536000,immutable" --region $Region

Write-Host "Uploading HTML files (no-cache)..."
aws s3 cp $BuildDir "s3://$Bucket/" --recursive --exclude "*" --include "*.html" --cache-control "no-cache,no-store,must-revalidate" --content-type "text/html" --region $Region

Write-Host "Uploading JSON files (1hr cache)..."
aws s3 cp $BuildDir "s3://$Bucket/" --recursive --exclude "*" --include "*.json" --cache-control "public,max-age=3600" --region $Region

Write-Host "S3 deploy complete."
