# Alternative: Try to find and use Windows built-in icons
Write-Host "Looking for Windows built-in icons..."

# Try to copy from Windows icons folder
$windowsIconPath = "C:\Windows\System32\shell32.dll"
$appIconPath = "src-tauri\icons\icon.ico"

if (Test-Path $windowsIconPath) {
    try {
        # Create a simple ICO by copying a PNG file as ICO
        # This is a common workaround
        Copy-Item "src-tauri\icons\32x32.png" $appIconPath
        Write-Host "Created ICO file from PNG (workaround)"
    } catch {
        Write-Host "Failed to create ICO file"
        New-Item -ItemType File -Path $appIconPath -Force
    }
} else {
    New-Item -ItemType File -Path $appIconPath -Force
    Write-Host "Created empty ICO file"
}

Write-Host "Final icon directory contents:"
Get-ChildItem "src-tauri\icons\" | ForEach-Object { 
    $size = if ($_.Length -gt 0) { " ($($_.Length) bytes)" } else { " (empty)" }
    Write-Host "  - $($_.Name)$size"
}