# Dreamer Cinematic Prompt Builder - Final Build Solution
# This script completes the icon creation and build process

Write-Host "🚀 Dreamer Cinematic Prompt Builder - Final Build Solution" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# Navigate to project directory
$projectPath = "C:\Users\lenovo\package\dreamer-app"
Write-Host "📁 Navigating to project directory: $projectPath" -ForegroundColor Yellow
Set-Location $projectPath

# Check if we're in the right place
if (-not (Test-Path "src-tauri\tauri.conf.json")) {
    Write-Host "❌ ERROR: Could not find tauri.conf.json. Are you in the right directory?" -ForegroundColor Red
    Write-Host "   Please run this script from the dreamer-app directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found project directory" -ForegroundColor Green

# Create icon files if they don't exist or are empty
$iconDir = "src-tauri\icons"
Write-Host "🔧 Creating icon files..." -ForegroundColor Yellow

# Use the download method that should work
$webClient = New-Object System.Net.WebClient

# Download the base icon
Write-Host "  📥 Downloading base icon from GitHub..." -ForegroundColor Cyan
try {
    $webClient.DownloadFile("https://raw.githubusercontent.com/tauri-apps/tauri/v2/bundler/resources/icons/icon.ico", "$iconDir\icon.ico")
    Write-Host "    ✅ Downloaded icon.ico" -ForegroundColor Green
} catch {
    Write-Host "    ❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    🔄 Creating minimal icon manually..." -ForegroundColor Yellow
    
    # Fallback: Create a minimal valid ICO
    $icoData = [System.Byte[]]@(
        0x00,0x00, # Reserved
        0x01,0x00, # ICO format
        0x01,      # One image
        0x20,      # 32x32 pixels
        0x00,      # Color palette
        0x00,      # Reserved
        0x01,0x00, # Color planes
        0x20,0x00,0x00,0x00, # Bits per pixel
        0x00,0x00,0x00,0x00, # Image size (will be updated)
        0x00,0x00,0x00,0x00  # Image data offset
    )
    
    # Simple 32x32 icon with a blue square
    $iconBytes = New-Object System.Collections.Generic.List[byte]
    $iconBytes.AddRange($icoData)
    
    # Add minimal icon data (32x32 pixels, 32bpp)
    for ($y = 0; $y -lt 32; $y++) {
        for ($x = 0; $x -lt 32; $x++) {
            if ($x -ge 8 -and $x -lt 24 -and $y -ge 8 -and $y -lt 24) {
                # Blue square in center
                $iconBytes.Add(0x00)  # Alpha
                $iconBytes.Add(0x00)  # Blue
                $iconBytes.Add(0x00)  # Green  
                $iconBytes.Add(0xFF)  # Red
            } else {
                # Transparent
                $iconBytes.Add(0x00)
                $iconBytes.Add(0x00)
                $iconBytes.Add(0x00)
                $iconBytes.Add(0x00)
            }
        }
    }
    
    [System.IO.File]::WriteAllBytes("$iconDir\icon.ico", $iconBytes.ToArray())
    Write-Host "    ✅ Created minimal icon.ico" -ForegroundColor Green
}

# Create PNG versions using System.Drawing
Write-Host "  🎨 Creating PNG versions..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Drawing

try {
    # Load the ICO and create different size PNGs
    $baseIcon = New-Object System.Drawing.Bitmap("$iconDir\icon.ico")
    
    # 32x32 PNG
    $png32 = New-Object System.Drawing.Bitmap(32, 32)
    $g32 = [System.Drawing.Graphics]::FromImage($png32)
    $g32.DrawImage($baseIcon, 0, 0, 32, 32)
    $png32.Save("$iconDir\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g32.Dispose()
    $png32.Dispose()
    Write-Host "    ✅ Created 32x32.png" -ForegroundColor Green
    
    # 128x128 PNG
    $png128 = New-Object System.Drawing.Bitmap(128, 128)
    $g128 = [System.Drawing.Graphics]::FromImage($png128)
    $g128.DrawImage($baseIcon, 0, 0, 128, 128)
    $png128.Save("$iconDir\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g128.Dispose()
    $png128.Dispose()
    Write-Host "    ✅ Created 128x128.png" -ForegroundColor Green
    
    # 128x128@2x PNG (256x256)
    $png2x = New-Object System.Drawing.Bitmap(256, 256)
    $g2x = [System.Drawing.Graphics]::FromImage($png2x)
    $g2x.DrawImage($baseIcon, 0, 0, 256, 256)
    $png2x.Save("$iconDir\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g2x.Dispose()
    $png2x.Dispose()
    Write-Host "    ✅ Created 128x128@2x.png" -ForegroundColor Green
    
    # Create macOS icon (icon.icns)
    $baseIcon.Save("$iconDir\icon.icns", [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "    ✅ Created icon.icns" -ForegroundColor Green
    
    $baseIcon.Dispose()
    
} catch {
    Write-Host "    ❌ PNG creation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    🔄 Creating fallback PNG files..." -ForegroundColor Yellow
    
    # Fallback: Create simple PNG files using System.Drawing
    $bitmap32 = New-Object System.Drawing.Bitmap(32, 32)
    $graphics32 = [System.Drawing.Graphics]::FromImage($bitmap32)
    $graphics32.Clear([System.Drawing.Color]::Blue)
    $graphics32.Dispose()
    $bitmap32.Save("$iconDir\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap32.Dispose()
    
    $bitmap128 = New-Object System.Drawing.Bitmap(128, 128)
    $graphics128 = [System.Drawing.Graphics]::FromImage($bitmap128)
    $graphics128.Clear([System.Drawing.Color]::Blue)
    $graphics128.Dispose()
    $bitmap128.Save("$iconDir\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap128.Dispose()
    
    $bitmap2x = New-Object System.Drawing.Bitmap(256, 256)
    $graphics2x = [System.Drawing.Graphics]::FromImage($bitmap2x)
    $graphics2x.Clear([System.Drawing.Color]::Blue)
    $graphics2x.Dispose()
    $bitmap2x.Save("$iconDir\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap2x.Dispose()
    
    # Create minimal .icns file
    [System.IO.File]::WriteAllBytes("$iconDir\icon.icns", (New-Object System.Drawing.Bitmap(128, 128)).ToByteArray([System.Drawing.Imaging.ImageFormat]::Png))
    
    Write-Host "    ✅ Created fallback icon files" -ForegroundColor Green
}

# Verify all files exist and have content
Write-Host "🔍 Verifying icon files..." -ForegroundColor Yellow
$requiredIcons = @("32x32.png", "128x128.png", "128x128@2x.png", "icon.ico", "icon.icns")
$allValid = $true

foreach ($icon in $requiredIcons) {
    $iconPath = "$iconDir\$icon"
    if (Test-Path $iconPath) {
        $size = (Get-Item $iconPath).Length
        if ($size -gt 0) {
            Write-Host "  ✅ $icon ($([math]::Round($size/1024,1)) KB)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $icon (empty file)" -ForegroundColor Red
            $allValid = $false
        }
    } else {
        Write-Host "  ❌ $icon (missing)" -ForegroundColor Red
        $allValid = $false
    }
}

if (-not $allValid) {
    Write-Host "❌ Some icon files are missing or empty. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All icon files created successfully!" -ForegroundColor Green

# Check if dependencies are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  📥 Installing dependencies..." -ForegroundColor Cyan
    & pnpm install --no-frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✅ Dependencies already installed" -ForegroundColor Green
}

# Now try the build
Write-Host "🏗️  Starting Tauri build..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan

& pnpm tauri build

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "Your Windows executable should be in:" -ForegroundColor White
    Write-Host "  src-tauri\target\release\bundle\msi\" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor White
    Write-Host "Look for the .msi installer file." -ForegroundColor Cyan
} else {
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host "=============================================================" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "  1. Make sure Rust is installed: rustup default stable" -ForegroundColor White
    Write-Host "  2. Update Rust: rustup update" -ForegroundColor White
    Write-Host "  3. Reinstall Tauri CLI: npm install -g @tauri-apps/cli@latest" -ForegroundColor White
    Write-Host "  4. Clean build: pnpm tauri build --debug" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")