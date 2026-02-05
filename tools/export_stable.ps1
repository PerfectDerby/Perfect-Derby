# Export Stable Version Script
# Copies the current project to a clean folder for public release.

$source = "$PSScriptRoot/.."
$dest = "$PSScriptRoot/../../baseball-game-public"

Write-Host "Creating clean export at: $dest" -ForegroundColor Cyan

# Create destination if not exists
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
}

# Use Robocopy for efficient mirroring with exclusions
# /MIR :: Mirror a directory tree
# /XD :: Exclude Directories
# /XF :: Exclude Files
$cmdArgs = @(
    $source,
    $dest,
    "/MIR",
    "/XD", ".git", ".gemini", "node_modules", "dist", ".vscode", "brain", ".agent", "android", "ios",
    "/XF", ".env", "*.tmp", "*.log", "npm-debug.log"
)

Write-Host "Copying files..." -ForegroundColor Yellow
& robocopy @cmdArgs

# Robocopy exit codes 0-7 are success
if ($LASTEXITCODE -lt 8) {
    Write-Host "`n✅ Export Complete!" -ForegroundColor Green
    Write-Host "Your clean version is available at: $dest"
    Write-Host "`nTo upload this to the new GitHub account:"
    Write-Host "1. cd $dest"
    Write-Host "2. git init"
    Write-Host "3. git add ."
    Write-Host "4. git commit -m 'Initial release'"
    Write-Host "5. git branch -M main"
    Write-Host "6. git remote add origin <NEW_GITHUB_URL>"
    Write-Host "7. git push -u origin main"
} else {
    Write-Host "❌ Error during copy. Robocopy Code: $LASTEXITCODE" -ForegroundColor Red
}
