param(
    [string]$RepoName = "",
    [switch]$Private
)

function Write-ErrorAndExit {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
    exit 1
}

$repoName = if ($RepoName) { $RepoName } else { Split-Path -Leaf (Get-Location) }
$visibility = if ($Private) { "--private" } else { "--public" }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-ErrorAndExit "GitHub CLI 'gh' is not installed. Install it from https://cli.github.com/ and run 'gh auth login' first."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-ErrorAndExit "Git is not installed. Install Git before running this script."
}

Write-Host "Using repository name: $repoName" -ForegroundColor Cyan

if (-not (Test-Path .git)) {
    Write-Host "Initializing a local git repository..." -ForegroundColor Yellow
    git init | Out-Null
}

$hasRemote = $false
try {
    git remote get-url origin | Out-Null
    $hasRemote = $true
} catch {
    $hasRemote = $false
}

$hasHead = $false
try {
    git rev-parse --verify HEAD | Out-Null
    $hasHead = $true
} catch {
    $hasHead = $false
}

$status = git status --porcelain
if ($status -or -not $hasHead) {
    Write-Host "Staging changes and creating an initial commit..." -ForegroundColor Yellow
    git add -A
    if ($hasHead) {
        git commit -m "chore: update repository" | Out-Null
    } else {
        git commit -m "chore: initial commit" | Out-Null
    }
} else {
    Write-Host "No local changes to commit." -ForegroundColor Green
}

if ($hasRemote) {
    Write-Host "Remote 'origin' already exists. Skipping repo creation and pushing to existing remote..." -ForegroundColor Yellow
    git push -u origin HEAD
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "Failed to push to existing remote origin." }
    Write-Host "Pushed changes to existing origin." -ForegroundColor Green
    exit 0
}

Write-Host "Creating GitHub repository '$repoName'..." -ForegroundColor Yellow
$createArgs = @("repo", "create", $repoName, $visibility, "--source=.", "--remote=origin", "--push", "--confirm")
$createResult = gh @createArgs
if ($LASTEXITCODE -ne 0) {
    Write-ErrorAndExit "Failed to create the GitHub repository. Ensure you are authenticated and try again."
}

Write-Host "Repository created and pushed to GitHub." -ForegroundColor Green
$remoteUrl = git remote get-url origin
Write-Host "Remote origin: $remoteUrl" -ForegroundColor Cyan
