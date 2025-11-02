# Backup original config
Copy-Item "src-tauri\tauri.conf.json" "src-tauri\tauri.conf.json.backup"

# Read and modify config to remove icon requirement
$config = Get-Content "src-tauri\tauri.conf.json" | ConvertFrom-Json

# Remove or modify icon paths in config
if ($config.bundle) {
    if ($config.bundle.icon) {
        Write-Host "Original icon config found:"
        $config.bundle.icon | Write-Host
        # Temporarily comment out icon requirement by setting to empty
        $config.bundle.icon = @()
    }
}

# Save modified config
$config | ConvertTo-Json -Depth 10 | Set-Content "src-tauri\tauri.conf.json"

Write-Host "Config modified to remove icon requirements"
Write-Host "Try building now:"
Write-Host "pnpm tauri build"
Write-Host ""
Write-Host "If successful, you can restore original config with:"
Write-Host "Copy-Item 'src-tauri\tauri.conf.json.backup' 'src-tauri\tauri.conf.json'"