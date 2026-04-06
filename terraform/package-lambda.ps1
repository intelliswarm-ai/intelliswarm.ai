# Treat npm warnings on stderr as non-fatal
$ErrorActionPreference = "Stop"
$WarningPreference = "SilentlyContinue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$staging = Join-Path $scriptDir "lambda-staging"
$backend = Join-Path (Join-Path $scriptDir "..") "backend"
$zipPath = Join-Path $scriptDir "lambda.zip"

# Clean staging
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging -Force | Out-Null

# Copy source files
Copy-Item (Join-Path $backend "lambda.js") $staging
Copy-Item (Join-Path $backend "package.json") $staging
Copy-Item (Join-Path $backend "package-lock.json") $staging -ErrorAction SilentlyContinue
Copy-Item (Join-Path $backend "handlers") (Join-Path $staging "handlers") -Recurse
Copy-Item (Join-Path $backend "storage") (Join-Path $staging "storage") -Recurse

# Install production deps fresh (redirect stderr to avoid PowerShell treating warnings as errors)
Push-Location $staging
$env:npm_config_loglevel = "error"
cmd /c "npm install --omit=dev 2>&1"
Pop-Location

# Remove .bin symlinks that cause zip issues
$binDir = Join-Path (Join-Path $staging "node_modules") ".bin"
if (Test-Path $binDir) { Remove-Item $binDir -Recurse -Force }

# Create zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force

# Clean up staging
Remove-Item $staging -Recurse -Force

Write-Host "Lambda package created: $zipPath"
