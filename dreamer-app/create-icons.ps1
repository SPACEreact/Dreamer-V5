# Dreamer Application Icon Generator
# Run this script in your C:\Users\lenovo\package\dreamer-app directory

# Create icons directory
$iconDir = "src-tauri\icons"
if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir
    Write-Host "Created icons directory: $iconDir"
}

# Function to create PNG from base64 data
function Create-PngFromBase64 {
    param($filename, $base64Data)
    try {
        $bytes = [System.Convert]::FromBase64String($base64Data)
        [System.IO.File]::WriteAllBytes($filename, $bytes)
        Write-Host "Created $filename"
        return $true
    } catch {
        Write-Host "Error creating $filename : $_"
        return $false
    }
}

# Test if we can run ImageMagick (if not available, we'll create simple colored squares)
function Create-SimpleIcons {
    Write-Host "Creating simple colored square icons (ImageMagick not available)"
    
    # Create 32x32 PNG - solid indigo color
    $bmp32 = New-Object System.Drawing.Bitmap 32, 32
    $g32 = [System.Drawing.Graphics]::FromImage($bmp32)
    $g32.FillRectangle([System.Drawing.Brushes]::Indigo, 0, 0, 32, 32)
    $bmp32.Save("$iconDir\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Create 128x128 PNG - solid indigo color
    $bmp128 = New-Object System.Drawing.Bitmap 128, 128
    $g128 = [System.Drawing.Graphics]::FromImage($bmp128)
    $g128.FillRectangle([System.Drawing.Brushes]::Indigo, 0, 0, 128, 128)
    $bmp128.Save("$iconDir\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Create @2x version
    $bmp128_2x = New-Object System.Drawing.Bitmap 128, 128
    $g128_2x = [System.Drawing.Graphics]::FromImage($bmp128_2x)
    $g128_2x.FillRectangle([System.Drawing.Brushes]::Indigo, 0, 0, 128, 128)
    $bmp128_2x.Save("$iconDir\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $g32.Dispose(); $bmp32.Dispose()
    $g128.Dispose(); $bmp128.Dispose()
    $g128_2x.Dispose(); $bmp128_2x.Dispose()
    
    Write-Host "Created simple icons successfully"
}

# Try to create icons using .NET drawing (no external dependencies)
try {
    # Create 32x32 PNG - professional indigo background
    $bmp32 = New-Object System.Drawing.Bitmap 32, 32
    $g32 = [System.Drawing.Graphics]::FromImage($bmp32)
    $g32.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))  # Indigo color #6366f1
    
    # Add white inner rectangle for contrast
    $g32.FillRectangle([System.Drawing.Brushes]::White, 8, 8, 16, 16)
    
    $bmp32.Save("$iconDir\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Create 128x128 PNG
    $bmp128 = New-Object System.Drawing.Bitmap 128, 128
    $g128 = [System.Drawing.Graphics]::FromImage($bmp128)
    $g128.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))  # Indigo color
    $g128.FillRectangle([System.Drawing.Brushes]::White, 32, 32, 64, 64)
    $bmp128.Save("$iconDir\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Create @2x version
    $bmp128_2x = New-Object System.Drawing.Bitmap 128, 128
    $g128_2x = [System.Drawing.Graphics]::FromImage($bmp128_2x)
    $g128_2x.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))
    $g128_2x.FillRectangle([System.Drawing.Brushes]::White, 32, 32, 64, 64)
    $bmp128_2x.Save("$iconDir\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created professional icons successfully"
    
    # Clean up
    $g32.Dispose(); $bmp32.Dispose()
    $g128.Dispose(); $bmp128.Dispose()
    $g128_2x.Dispose(); $bmp128_2x.Dispose()
    
} catch {
    Write-Host "Using fallback method: $_"
    Create-SimpleIcons
}

# Create ICO format (copy PNG as ICO for basic compatibility)
if (Test-Path "$iconDir\32x32.png") {
    Copy-Item "$iconDir\32x32.png" "$iconDir\icon.ico"
    Write-Host "Created icon.ico"
}

# Create ICNS format (copy PNG as ICNS for basic compatibility)
if (Test-Path "$iconDir\32x32.png") {
    Copy-Item "$iconDir\32x32.png" "$iconDir\icon.icns"
    Write-Host "Created icon.icns"
}

Write-Host "`nIcons created successfully! You can now run: pnpm tauri build"
Write-Host "Files created:"
Get-ChildItem $iconDir | Select-Object Name, Length
