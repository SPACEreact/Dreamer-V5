# Create directories
if (!(Test-Path "src-tauri\icons")) {
    New-Item -ItemType Directory -Path "src-tauri\icons" -Force
    Write-Host "Created src-tauri\icons directory"
} else {
    Write-Host "src-tauri\icons directory already exists"
}

# Clean up any existing icon files
Remove-Item -Path "src-tauri\icons\*.png" -ErrorAction SilentlyContinue
Remove-Item -Path "src-tauri\icons\*.ico" -ErrorAction SilentlyContinue
Remove-Item -Path "src-tauri\icons\*.icns" -ErrorAction SilentlyContinue

Write-Host "Creating icon files..."

# Create a simple 16x16 BMP as a base for all icons
Add-Type -AssemblyName System.Drawing

# Create 16x16 icon base
$baseBitmap = New-Object System.Drawing.Bitmap(16, 16)
$baseGraphics = [System.Drawing.Graphics]::FromImage($baseBitmap)

# Fill with dark blue
$baseGraphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 0, 0, 16, 16)

# Add simple X pattern
$baseGraphics.DrawLine([System.Drawing.Pen]::White, 2, 2, 14, 14)
$baseGraphics.DrawLine([System.Drawing.Pen]::White, 14, 2, 2, 14)

# Save base
$baseBitmap.Save("src-tauri\icons\base.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 32x32 from base
$icon32 = New-Object System.Drawing.Bitmap(32, 32)
$graphics32 = [System.Drawing.Graphics]::FromImage($icon32)
$graphics32.DrawImage($baseBitmap, 0, 0, 32, 32)
$icon32.Save("src-tauri\icons\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 128x128 from base
$icon128 = New-Object System.Drawing.Bitmap(128, 128)
$graphics128 = [System.Drawing.Graphics]::FromImage($icon128)
$graphics128.DrawImage($baseBitmap, 0, 0, 128, 128)
$icon128.Save("src-tauri\icons\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 128x128@2x from base (256x256)
$icon2x = New-Object System.Drawing.Bitmap(256, 256)
$graphics2x = [System.Drawing.Graphics]::FromImage($icon2x)
$graphics2x.DrawImage($baseBitmap, 0, 0, 256, 256)
$icon2x.Save("src-tauri\icons\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create a simple ICO file by copying the 32x32 PNG and renaming
# This often works when other methods fail
Copy-Item "src-tauri\icons\32x32.png" "src-tauri\icons\icon.ico"
Write-Host "ICO file created by copying 32x32 PNG"

# Create ICNS placeholder
$null = New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force
Write-Host "ICNS placeholder created"

# Cleanup
$baseGraphics.Dispose()
$graphics32.Dispose()
$graphics128.Dispose()
$graphics2x.Dispose()
$baseBitmap.Dispose()
$icon32.Dispose()
$icon128.Dispose()
$icon2x.Dispose()

Write-Host ""
Write-Host "Icon creation completed!"
Write-Host "Files created in src-tauri\icons\:"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { Write-Host "  - $($_.Name)" }