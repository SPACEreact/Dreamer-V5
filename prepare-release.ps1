# Version Update & Release Helper
# Run this script after building to prepare for distribution

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateZip = $true
)

Write-Host "🚀 Preparing Release v$Version" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$projectPath = "C:\Users\lenovo\package\dreamer-app"
Set-Location $projectPath

# Check if build exists
$exePath = "src-tauri\target\release\dreamer-cinematic-prompt-builder.exe"
$msiPath = "src-tauri\target\release\bundle\msi\Dreamer Cinematic Prompt Builder.msi"

if (-not (Test-Path $exePath)) {
    Write-Host "❌ EXE not found. Please run 'pnpm tauri build' first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found build artifacts" -ForegroundColor Green

# Create release directory
$releaseDir = "releases\v$Version"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# Copy files to release directory
Write-Host "📦 Copying files to release directory..." -ForegroundColor Yellow

Copy-Item $exePath "$releaseDir\"
Write-Host "  ✅ Copied EXE" -ForegroundColor Green

if (Test-Path $msiPath) {
    Copy-Item $msiPath "$releaseDir\"
    Write-Host "  ✅ Copied MSI installer" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  MSI installer not found" -ForegroundColor Yellow
}

# Update package.json version
Write-Host "📝 Updating package.json version..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "  ✅ Updated to v$Version" -ForegroundColor Green

# Create ZIP file for easy sharing
if ($CreateZip) {
    Write-Host "🗜️  Creating ZIP archive..." -ForegroundColor Yellow
    $zipName = "Dreamer-Cinematic-Prompt-Builder-v$Version.zip"
    Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipName -Force
    Write-Host "  ✅ Created $zipName" -ForegroundColor Green
}

# Create release notes
Write-Host "📋 Creating release notes..." -ForegroundColor Yellow
$releaseNotes = @"
# Release v$Version

## Installation

### Windows Installer (Recommended)
Download and run the MSI installer for automatic installation.

### Portable Version
Download and run the EXE file directly (no installation required).

## What's New
$Notes

## System Requirements
- Windows 10/11 (64-bit)
- No additional software required

---
Built with Tauri v2
"@

$releaseNotes | Out-File -FilePath "releases\v$Version\RELEASE_NOTES.md" -Encoding UTF8
Write-Host "  ✅ Created release notes" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "🎉 Release v$Version is ready!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor White
Write-Host "  📁 $releaseDir\" -ForegroundColor Cyan
if (Test-Path $zipName) {
    Write-Host "  📦 $zipName" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the installer on a clean Windows machine" -ForegroundColor White
Write-Host "  2. Upload to GitHub Releases or share via cloud storage" -ForegroundColor White
Write-Host "  3. Update your website/documentation" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to distribute!" -ForegroundColor Green