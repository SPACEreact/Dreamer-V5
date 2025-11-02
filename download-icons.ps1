# Download working icon files from Tauri template
Write-Host "Downloading working icon files..."

# Create directory
if (!(Test-Path "src-tauri\icons")) {
    New-Item -ItemType Directory -Path "src-tauri\icons" -Force
}

# Download a simple working ICO file
$icoUrl = "https://raw.githubusercontent.com/tauri-apps/tauri/v2/applications/吊饰/tauri.conf.json"
$icoUrl = "https://raw.githubusercontent.com/tauri-apps/tauri/v2/bundler/resources/icons/icon.ico"

try {
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tauri-apps/tauri/v2/bundler/resources/icons/icon.ico" -OutFile "src-tauri\icons\icon.ico" -UseBasicParsing
    Write-Host "Downloaded icon.ico"
} catch {
    Write-Host "Failed to download, will create simple files"
    # Create simple files if download fails
    New-Item -ItemType File -Path "src-tauri\icons\icon.ico" -Force
    New-Item -ItemType File -Path "src-tauri\icons\32x32.png" -Force
    New-Item -ItemType File -Path "src-tauri\icons\128x128.png" -Force
    New-Item -ItemType File -Path "src-tauri\icons\128x128@2x.png" -Force
    New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force
}

Write-Host "Icon setup complete. Files:"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { Write-Host "  - $($_.Name)" }