Add-Type -AssemblyName System.Drawing

# Create a simple but valid ICO file manually  
Remove-Item -Path "src-tauri\icons\icon.ico" -Force -ErrorAction SilentlyContinue

# Create multiple bitmap sizes for a proper multi-resolution ICO
$bitmaps = @()

# 32x32 - main size for ICO
$bmp32 = New-Object System.Drawing.Bitmap(32, 32)
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.Clear([System.Drawing.Color]::Navy)
$g32.DrawLine([System.Drawing.Pen]::White, 4, 4, 28, 28)
$g32.DrawLine([System.Drawing.Pen]::White, 28, 4, 4, 28)
$bitmaps += $bmp32

# Save PNG files
$bmp32.Save("src-tauri\icons\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 128x128
$bmp128 = New-Object System.Drawing.Bitmap(128, 128)
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.Clear([System.Drawing.Color]::Navy)
$g128.DrawLine([System.Drawing.Pen]::White, 16, 16, 112, 112)
$g128.DrawLine([System.Drawing.Pen]::White, 112, 16, 16, 112)
$bmp128.Save("src-tauri\icons\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps += $bmp128

# Create 128x128@2x (256x256)
$bmp256 = New-Object System.Drawing.Bitmap(256, 256)
$g256 = [System.Drawing.Graphics]::FromImage($bmp256)
$g256.Clear([System.Drawing.Color]::Navy)
$g256.DrawLine([System.Drawing.Pen]::White, 32, 32, 224, 224)
$g256.DrawLine([System.Drawing.Pen]::White, 224, 32, 32, 224)
$bmp256.Save("src-tauri\icons\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps += $bmp256

# Create a proper ICO file using Icon.FromHandle
# This creates a proper Windows ICO that Tauri can parse
$icon = [System.Drawing.Icon]::FromHandle($bmp32.GetHicon())
$icon.Save("src-tauri\icons\icon.ico")

# Create ICNS placeholder
New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force

# Cleanup
foreach ($bmp in $bitmaps) { $bmp.Dispose() }
$g32.Dispose(); $g128.Dispose(); $g256.Dispose()
$icon.Dispose()

Write-Host "Fixed ICO file created successfully!"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { 
    $size = if ($_.Length -gt 0) { " ($([math]::Round($_.Length/1024, 1)) KB)" } else { " (empty)" }
    Write-Host "  - $($_.Name)$size"
}