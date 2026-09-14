# publish.ps1
# Usage : ./publish.ps1 [tag]
# Exemple : ./publish.ps1 v1.0  ou  ./publish.ps1 (utilise "latest" par défaut)

param(
  [string]$tag = "latest"
)

$ErrorActionPreference = "Stop"

$username = "maxion78"  # ← remplace par ton username Docker Hub

function Invoke-Checked {
  param([string[]]$CommandArgs)
  & $CommandArgs[0] $CommandArgs[1..($CommandArgs.Length - 1)]
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Command failed (exit $LASTEXITCODE): $($CommandArgs -join ' ')" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "Building and pushing thesis-backend:$tag..." -ForegroundColor Cyan
Invoke-Checked @("docker", "build", "-t", "${username}/thesis-backend:${tag}", "./backend")
Invoke-Checked @("docker", "push", "${username}/thesis-backend:${tag}")

Write-Host "Building and pushing thesis-frontend:$tag..." -ForegroundColor Cyan
Invoke-Checked @("docker", "build", "-t", "${username}/thesis-frontend:${tag}", "./frontend")
Invoke-Checked @("docker", "push", "${username}/thesis-frontend:${tag}")

Write-Host "Done ! Images published on Docker Hub as :" -ForegroundColor Green
Write-Host "  ${username}/thesis-backend:${tag}"
Write-Host "  ${username}/thesis-frontend:${tag}"