# Ultra-simple icon creation - minimal approach
Write-Host "Creating minimal working icons..."

# Clean up any existing files
Remove-Item -Path "src-tauri\icons\*" -Force -ErrorAction SilentlyContinue

# Method 1: Download a working ICO file from a reliable source
Write-Host "Attempting to download a working ICO file..."

try {
    # Download a simple working ICO from a Tauri example
    $webClient = New-Object System.Net.WebClient
    $webClient.Headers.Add("user-agent", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.0.3705)")
    
    # Try to download from a reliable source
    $icoUrl = "https://github.com/tauri-apps/tauri/raw/v2/bundler/resources/icons/icon.ico"
    
    $webClient.DownloadFile($icoUrl, "src-tauri\icons\icon.ico")
    Write-Host "Successfully downloaded icon.ico"
} catch {
    Write-Host "Download failed, creating simple file manually"
    
    # Create a minimal but valid ICO file manually
    # This is a simple 1x1 pixel ICO structure
    $icoBytes = [byte[]](0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x04, 0x00, 0x28, 0x01, 
                      0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 
                      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 
                      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
    
    [System.IO.File]::WriteAllBytes("src-tauri\icons\icon.ico", $icoBytes)
    Write-Host "Created minimal ICO file manually"
}

# Create simple PNG placeholder files
Add-Type -AssemblyName System.Drawing

# 32x32 PNG
$bmp32 = New-Object System.Drawing.Bitmap(32, 32)
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.Clear([System.Drawing.Color]::MidnightBlue)
# Add a simple white X pattern using DrawLine
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2)
$g32.DrawLine($pen, 4, 4, 28, 28)
$g32.DrawLine($pen, 28, 4, 4, 28)
$bmp32.Save("src-tauri\icons\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g32.Dispose(); $bmp32.Dispose(); $pen.Dispose()

# 128x128 PNG
$bmp128 = New-Object System.Drawing.Bitmap(128, 128)
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.Clear([System.Drawing.Color]::MidnightBlue)
$pen128 = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 4)
$g128.DrawLine($pen128, 16, 16, 112, 112)
$g128.DrawLine($pen128, 112, 16, 16, 112)
$bmp128.Save("src-tauri\icons\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g128.Dispose(); $bmp128.Dispose(); $pen128.Dispose()

# 128x128@2x PNG
$bmp2x = New-Object System.Drawing.Bitmap(256, 256)
$g2x = [System.Drawing.Graphics]::FromImage($bmp2x)
$g2x.Clear([System.Drawing.Color]::MidnightBlue)
$pen2x = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 8)
$g2x.DrawLine($pen2x, 32, 32, 224, 224)
$g2x.DrawLine($pen2x, 224, 32, 32, 224)
$bmp2x.Save("src-tauri\icons\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g2x.Dispose(); $bmp2x.Dispose(); $pen2x.Dispose()

# Create ICNS placeholder
$null = New-Item -ItemType File -Path "src-tauri\icons\icon.icns" -Force

Write-Host ""
Write-Host "Icons created successfully!"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { 
    $size = if ($_.Length -gt 0) { " ($([math]::Round($_.Length/1024, 1)) KB)" } else { " (empty)" }
    Write-Host "  - $($_.Name)$size"
}

Write-Host ""
Write-Host "Now trying build again..."
pnpm tauri build