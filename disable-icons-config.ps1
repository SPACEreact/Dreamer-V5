# Backup and modify config to temporarily disable icon requirement
Copy-Item "src-tauri\tauri.conf.json" "src-tauri\tauri.conf.json.backup"

Write-Host "Backing up original config..."

# Read current config
$config = Get-Content "src-tauri\tauri.conf.json" | ConvertFrom-Json

# Show current icon config
Write-Host "Current icon configuration:"
if ($config.bundle -and $config.bundle.icon) {
    $config.bundle.icon | Write-Host
}

# Temporarily set to empty array to disable icon requirement
$config.bundle.icon = @()

# Save modified config
$config | ConvertTo-Json -Depth 10 | Set-Content "src-tauri\tauri.conf.json"

Write-Host "Temporarily disabled icon requirement in config"
Write-Host "Try building now:"
Write-Host "pnpm tauri build"
Write-Host ""
Write-Host "If successful, restore original config with:"
Write-Host "Copy-Item 'src-tauri\tauri.conf.json.backup' 'src-tauri\tauri.conf.json'"