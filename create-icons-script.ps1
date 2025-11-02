# Create proper Windows-compatible icons for Tauri build
Add-Type -AssemblyName System.Drawing

# Create directories
if (!(Test-Path "src-tauri\icons")) {
    New-Item -ItemType Directory -Path "src-tauri\icons" -Force
}

# Create base PNG (128x128) with indigo gradient background and "D" letter
$width = 128
$height = 128
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Create indigo gradient background
$gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($width, $height)),
    [System.Drawing.Color]::FromArgb(255, 75, 0, 130),    # Indigo
    [System.Drawing.Color]::FromArgb(255, 106, 90, 205)   # SlateBlue
)
$graphics.FillRectangle($gradientBrush, 0, 0, $width, $height)
$gradientBrush.Dispose()

# Add "D" letter in white
$font = New-Object System.Drawing.Font("Arial", 60, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::White
$text = "D"
$textSize = $graphics.MeasureString($text, $font)

# Center the text
$x = ($width - $textSize.Width) / 2
$y = ($height - $textSize.Height) / 2
$graphics.DrawString($text, $font, $brush, $x, $y)
$font.Dispose()
$graphics.Dispose()

# Save base PNG
$bitmap.Save("src-tauri\icons\base-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 128x128@2x.png (256x256)
$bitmap2x = New-Object System.Drawing.Bitmap(256, 256)
$graphics2x = [System.Drawing.Graphics]::FromImage($bitmap2x)

# Create gradient background for 2x version
$gradientBrush2x = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(256, 256)),
    [System.Drawing.Color]::FromArgb(255, 75, 0, 130),    # Indigo
    [System.Drawing.Color]::FromArgb(255, 106, 90, 205)   # SlateBlue
)
$graphics2x.FillRectangle($gradientBrush2x, 0, 0, 256, 256)
$gradientBrush2x.Dispose()

# Add larger "D" letter
$font2x = New-Object System.Drawing.Font("Arial", 120, [System.Drawing.FontStyle]::Bold)
$textSize2x = $graphics2x.MeasureString($text, $font2x)
$x2x = (256 - $textSize2x.Width) / 2
$y2x = (256 - $textSize2x.Height) / 2
$graphics2x.DrawString($text, $font2x, $brush, $x2x, $y2x)

# Save 128x128@2x.png by downscaling to maintain compatibility
$bitmap2x.Save("src-tauri\icons\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create proper ICO file using a simpler approach for RC.EXE compatibility
# Create multiple bitmap sizes for a proper ICO
$ico = New-Object System.Drawing.Icon($bitmap, 128, 128)
$ico.Save("src-tauri\icons\icon.ico")

# Create 32x32 icon
$bitmap32 = New-Object System.Drawing.Bitmap(32, 32)
$graphics32 = [System.Drawing.Graphics]::FromImage($bitmap32)
$graphics32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics32.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Draw scaled background
$graphics32.FillRectangle($gradientBrush, 0, 0, 32, 32)

# Draw scaled "D" 
$font32 = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$textSize32 = $graphics32.MeasureString($text, $font32)
$x32 = (32 - $textSize32.Width) / 2
$y32 = (32 - $textSize32.Height) / 2
$graphics32.DrawString($text, $font32, $brush, $x32, $y32)

$bitmap32.Save("src-tauri\icons\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create ICNS file placeholder (for macOS compatibility)
$null = New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force

# Clean up
$bitmap.Dispose()
$bitmap2x.Dispose() 
$bitmap32.Dispose()
$graphics.Dispose()
$graphics2x.Dispose()
$graphics32.Dispose()

Write-Host "Icons created successfully in src-tauri/icons/"
Write-Host "Generated files:"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { Write-Host "  - $($_.Name)" }