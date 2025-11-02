# Dreamer Desktop App - Windows Setup Script
# This script checks and installs prerequisites for building the Tauri app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dreamer Desktop App - Setup Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  Recommended: LTS version (v18+)" -ForegroundColor Yellow
    exit 1
}

# Check pnpm
Write-Host "Checking pnpm..." -ForegroundColor Yellow
if (Test-Command pnpm) {
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm installed: $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($?) {
        Write-Host "✓ pnpm installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install pnpm" -ForegroundColor Red
        exit 1
    }
}

# Check Rust
Write-Host "Checking Rust..." -ForegroundColor Yellow
if (Test-Command rustc) {
    $rustVersion = rustc --version
    Write-Host "✓ Rust installed: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Rust not found!" -ForegroundColor Red
    Write-Host "  Installing Rust via rustup..." -ForegroundColor Yellow
    Write-Host "  This may take several minutes..." -ForegroundColor Yellow
    
    # Download and run rustup
    $rustupInit = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://win.rustup.rs" -OutFile $rustupInit
    & $rustupInit -y
    
    if ($?) {
        Write-Host "✓ Rust installed successfully" -ForegroundColor Green
        Write-Host "  Please restart your terminal and run this script again" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "✗ Failed to install Rust" -ForegroundColor Red
        Write-Host "  Please install manually from: https://rustup.rs/" -ForegroundColor Yellow
        exit 1
    }
}

# Check cargo (should be installed with Rust)
Write-Host "Checking Cargo..." -ForegroundColor Yellow
if (Test-Command cargo) {
    $cargoVersion = cargo --version
    Write-Host "✓ Cargo installed: $cargoVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Cargo not found!" -ForegroundColor Red
    Write-Host "  Cargo should be installed with Rust" -ForegroundColor Yellow
    Write-Host "  Please restart your terminal" -ForegroundColor Yellow
    exit 1
}

# Check for Visual Studio Build Tools
Write-Host "Checking Visual Studio Build Tools..." -ForegroundColor Yellow
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vswhere) {
    Write-Host "✓ Visual Studio Build Tools found" -ForegroundColor Green
} else {
    Write-Host "⚠ Visual Studio Build Tools may not be installed" -ForegroundColor Yellow
    Write-Host "  Required for building Tauri apps" -ForegroundColor Yellow
    Write-Host "  Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Yellow
    Write-Host "  Install 'Desktop development with C++' workload" -ForegroundColor Yellow
    
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne 'y') {
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Project Dependencies..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Install npm dependencies
Write-Host "Running: pnpm install" -ForegroundColor Yellow
pnpm install

if ($?) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Generate icons (optional):" -ForegroundColor White
Write-Host "     pnpm tauri icon path/to/your/icon.png" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Run in development mode:" -ForegroundColor White
Write-Host "     pnpm tauri dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Build production executable:" -ForegroundColor White
Write-Host "     pnpm tauri build" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see BUILD_WINDOWS.md" -ForegroundColor Cyan
Write-Host ""
