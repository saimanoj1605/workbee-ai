<#
  backend/setup-backend.ps1

  Automates local backend setup for the WorkBee backend.
  Usage:
    .\setup-backend.ps1           # install deps and generate Prisma client
    .\setup-backend.ps1 -RunDev   # install deps, generate client, then start dev server
#>

param(
    [switch]$RunDev
)

Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

Write-Host "==> WorkBee backend setup started" -ForegroundColor Cyan

Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Applying Prisma schema to the database..." -ForegroundColor Yellow
npx prisma db push

if ($RunDev) {
    Write-Host "Starting dev server..." -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host "Setup complete." -ForegroundColor Green
    Write-Host "Run `npm run dev` to start the backend." -ForegroundColor Green
}

Pop-Location
