# Quick Release Helper Commands
# Copy and paste these commands to prepare your release

# 1. Create release directory and copy files
$version = "1.0.0"
$releaseDir = "releases\v$version"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# Copy EXE
$exePath = "src-tauri\target\release\dreamer-cinematic-prompt-builder.exe"
if (Test-Path $exePath) {
    Copy-Item $exePath "$releaseDir\"
    Write-Host "✅ Copied EXE" -ForegroundColor Green
} else {
    Write-Host "❌ EXE not found. Run 'pnpm tauri build' first." -ForegroundColor Red
    exit 1
}

# Copy MSI installer
$msiPath = "src-tauri\target\release\bundle\msi\Dreamer Cinematic Prompt Builder.msi"
if (Test-Path $msiPath) {
    Copy-Item $msiPath "$releaseDir\"
    Write-Host "✅ Copied MSI installer" -ForegroundColor Green
} else {
    Write-Host "⚠️ MSI installer not found" -ForegroundColor Yellow
}

# 2. Create release notes
$releaseNotes = @"
# Release v$version

## Installation

### Windows Installer (Recommended)
Download and run the MSI installer for automatic installation.

### Portable Version  
Download and run the EXE file directly (no installation required).

## What's New
First release of Dreamer Cinematic Prompt Builder
- Complete Tauri desktop application
- Cinematic prompt generation capabilities
- Windows installer and portable version

## System Requirements
- Windows 10/11 (64-bit)
- No additional software required

---
Built with Tauri v2
"@

$releaseNotes | Out-File -FilePath "$releaseDir\RELEASE_NOTES.md" -Encoding UTF8
Write-Host "✅ Created release notes" -ForegroundColor Green

# 3. Create ZIP file for sharing
$zipName = "Dreamer-Cinematic-Prompt-Builder-v$version.zip"
Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipName -Force
Write-Host "✅ Created $zipName" -ForegroundColor Green

# 4. Summary
Write-Host ""
Write-Host "🎉 Release v$version is ready!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor White
Write-Host "  📁 $releaseDir\" -ForegroundColor Cyan
Write-Host "  📦 $zipName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the installer on a clean Windows machine" -ForegroundColor White
Write-Host "  2. Upload to GitHub Releases or share via cloud storage" -ForegroundColor White
Write-Host "  3. Update your website/documentation" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to distribute!" -ForegroundColor Green