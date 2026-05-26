# Run WorkBee backend + frontend (two windows)
$root = $PSScriptRoot

Write-Host "Starting WorkBee..." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000"
Write-Host "  Frontend: http://localhost:3000"
Write-Host ""

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\backend'; npm run dev"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\frontend'; npm run dev"
)

Write-Host "Opened 2 terminals. Close them to stop the servers." -ForegroundColor Green
