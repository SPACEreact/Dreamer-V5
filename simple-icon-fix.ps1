# Simple ICO creation without complex graphics operations
Write-Host "Creating simple working icons..."

# Create directory if it doesn't exist
if (!(Test-Path "src-tauri\icons")) {
    New-Item -ItemType Directory -Path "src-tauri\icons" -Force
}

# Method 1: Create ICO from existing Windows icon
try {
    # Try to use a system icon as base
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace($env:SystemRoot + '\System32\shell32.dll')
    if ($folder) {
        $iconItem = $folder.ParseName('shell32.dll')
        if ($iconItem) {
            Write-Host "Found system icon to use as base"
        }
    }
} catch {
    Write-Host "System icon method failed, using backup method"
}

# Method 2: Simple file-based approach
# Create ICO by copying a working PNG and renaming (common workaround)
# First, create minimal PNG files using a different approach

# Use PowerShell's built-in image creation if available
Add-Type -AssemblyName System.Drawing

# Create a simple solid color bitmap
Create-SimpleIcon -Size 32 -Color "Navy" -OutputPath "src-tauri\icons\icon.ico"

# Create PNG versions
Create-SimpleIcon -Size 32 -Color "Navy" -OutputPath "src-tauri\icons\32x32.png" -Format "PNG"
Create-SimpleIcon -Size 128 -Color "Navy" -OutputPath "src-tauri\icons\128x128.png" -Format "PNG"
Create-SimpleIcon -Size 256 -Color "Navy" -OutputPath "src-tauri\icons\128x128@2x.png" -Format "PNG"

# Create ICNS placeholder
$null = New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force

Write-Host "Simple icons created!"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { 
    $size = if ($_.Length -gt 0) { " ($([math]::Round($_.Length/1024, 1)) KB)" } else { " (empty)" }
    Write-Host "  - $($_.Name)$size"
}

function Create-SimpleIcon {
    param(
        [int]$Size,
        [string]$Color,
        [string]$OutputPath,
        [string]$Format = "ICO"
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill with solid color
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::$Color)
    $graphics.FillRectangle($brush, 0, 0, $Size, $Size)
    
    # Save the file
    if ($Format -eq "ICO") {
        $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
        $stream = New-Object System.IO.MemoryStream
        $icon.Save($stream)
        $bytes = $stream.ToArray()
        [System.IO.File]::WriteAllBytes($OutputPath, $bytes)
        $stream.Dispose()
        $icon.Dispose()
    } else {
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    
    $graphics.Dispose()
    $brush.Dispose()
    $bitmap.Dispose()
}