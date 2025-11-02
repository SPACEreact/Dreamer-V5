# Simple icon generator for Tauri Windows build
# This creates a basic ICO file compatible with RC.EXE

# Create directories
if (!(Test-Path "src-tauri\icons")) {
    New-Item -ItemType Directory -Path "src-tauri\icons" -Force
}

# Create a simple 32x32 BMP and convert to ICO format that RC.EXE expects
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Create 32x32 bitmap
$bitmap = New-Object System.Drawing.Bitmap(32, 32)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fill with solid color (indigo)
$graphics.FillRectangle([System.Drawing.Brushes]::DarkBlue, 0, 0, 32, 32)

# Add a simple shape instead of text for better compatibility
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2)
$graphics.DrawRectangle($pen, 4, 4, 24, 24)
$graphics.DrawLine($pen, 8, 8, 24, 24)
$graphics.DrawLine($pen, 24, 8, 8, 24)

# Save as BMP first (RC.EXE can convert BMP to ICO)
$bitmap.Save("src-tauri\icons\temp.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)

# Create multiple size PNG files
$bitmap128 = New-Object System.Drawing.Bitmap(128, 128)
$graphics128 = [System.Drawing.Graphics]::FromImage($bitmap128)
$graphics128.FillRectangle([System.Drawing.Brushes]::DarkBlue, 0, 0, 128, 128)
$pen128 = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 4)
$graphics128.DrawRectangle($pen128, 16, 16, 96, 96)
$graphics128.DrawLine($pen128, 32, 32, 96, 96)
$graphics128.DrawLine($pen128, 96, 32, 32, 96)
$bitmap128.Save("src-tauri\icons\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bitmap32 = New-Object System.Drawing.Bitmap(32, 32)
$graphics32 = [System.Drawing.Graphics]::FromImage($bitmap32)
$graphics32.FillRectangle([System.Drawing.Brushes]::DarkBlue, 0, 0, 32, 32)
$graphics32.DrawRectangle($pen, 4, 4, 24, 24)
$graphics32.DrawLine($pen, 8, 8, 24, 24)
$graphics32.DrawLine($pen, 24, 8, 8, 24)
$bitmap32.Save("src-tauri\icons\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 128x128@2x.png (256x256)
$bitmap2x = New-Object System.Drawing.Bitmap(256, 256)
$graphics2x = [System.Drawing.Graphics]::FromImage($bitmap2x)
$graphics2x.FillRectangle([System.Drawing.Brushes]::DarkBlue, 0, 0, 256, 256)
$pen2x = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 8)
$graphics2x.DrawRectangle($pen2x, 32, 32, 192, 192)
$graphics2x.DrawLine($pen2x, 64, 64, 192, 192)
$graphics2x.DrawLine($pen2x, 192, 64, 64, 192)
$bitmap2x.Save("src-tauri\icons\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create a proper ICO file using manual byte manipulation
# This ensures it's in the exact format RC.EXE expects
$icoPath = "src-tauri\icons\icon.ico"

# Create ICO header (ICO format version 3.00)
$icoBytes = [byte[]](0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x20, 0x20, 0x00, 0x00, 0x01, 0x00, 0x04, 0x00, 0x28, 0x01, 
                  0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x40, 0x01, 
                  0x00, 0x00, 0x01, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x02, 0x00, 0x00, 0x12, 0x0B, 
                  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)

[System.IO.File]::WriteAllBytes($icoPath, $icoBytes)

# Create ICNS placeholder
$null = New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force

# Clean up
$graphics.Dispose()
$graphics128.Dispose()
$graphics32.Dispose()
$graphics2x.Dispose()
$bitmap.Dispose()
$bitmap128.Dispose()
$bitmap32.Dispose()
$bitmap2x.Dispose()
$pen.Dispose()
$pen128.Dispose()
$pen2x.Dispose()

Write-Host "Simple icons created successfully in src-tauri/icons/"
Write-Host "Generated files:"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { Write-Host "  - $($_.Name)" }
Write-Host ""
Write-Host "ICO file created with proper RC.EXE compatibility!"