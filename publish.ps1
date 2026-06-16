# publish.ps1
# Usage : ./publish.ps1 [tag]
# Exemple : ./publish.ps1 v1.0  ou  ./publish.ps1 (utilise "latest" par défaut)

param(
  [string]$tag = "latest"
)

$username = "maxion78"  # ← remplace par ton username Docker Hub

Write-Host "Building and pushing thesis-backend:$tag..." -ForegroundColor Cyan
docker build -t ${username}/thesis-backend:${tag} ./backend
docker push ${username}/thesis-backend:${tag}

Write-Host "Building and pushing thesis-frontend:$tag..." -ForegroundColor Cyan
docker build -t ${username}/thesis-frontend:${tag} ./frontend
docker push ${username}/thesis-frontend:${tag}

Write-Host "Done ! Images published on Docker Hub as :" -ForegroundColor Green
Write-Host "  ${username}/thesis-backend:${tag}"
Write-Host "  ${username}/thesis-frontend:${tag}"