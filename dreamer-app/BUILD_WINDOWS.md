# Building Dreamer Desktop App for Windows

This guide will help you build the Dreamer: Cinematic Prompt Builder as a standalone Windows executable (.exe) using Tauri.

## Prerequisites

Before building, ensure you have the following installed on your Windows machine:

### 1. Install Node.js and pnpm
- Download and install Node.js (v18 or later) from https://nodejs.org/
- Install pnpm globally:
  ```bash
  npm install -g pnpm
  ```

### 2. Install Rust
- Download and install Rust from https://rustup.rs/
- Run the installer and follow the prompts
- After installation, restart your terminal

### 3. Install Visual Studio Build Tools
- Download Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/
- Install "Desktop development with C++" workload
- This provides the C++ compiler required by Tauri

### 4. Install WebView2 (Usually pre-installed on Windows 10/11)
- If needed, download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Build Steps

### Step 1: Install Dependencies

Open PowerShell or Command Prompt in the project directory and run:

```bash
pnpm install
```

This will install all Node.js dependencies including Tauri CLI.

### Step 2: Generate Icons (Optional)

If you want custom icons, place a 1024x1024px PNG file in the project root, then run:

```bash
pnpm tauri icon path/to/your/icon.png
```

This generates all required icon formats automatically.

### Step 3: Build the Application

To create a production-ready Windows executable:

```bash
pnpm tauri build
```

This command will:
1. Build the React frontend (production mode)
2. Compile the Rust backend
3. Create installers and executables
4. Takes approximately 5-15 minutes on first build

### Build Output

After successful build, you'll find the installers in:

```
src-tauri/target/release/bundle/
```

**Available formats:**
- `msi/` - Windows MSI installer (recommended for distribution)
- `nsis/` - NSIS installer (alternative installer format)
- `../release/` - Portable executable (dreamer-cinematic-prompt-builder.exe)

## Development Mode

To run the app in development mode with hot-reload:

```bash
pnpm tauri dev
```

This opens the app window and rebuilds on code changes.

## Build Options

### Debug Build
For testing with debug symbols:
```bash
pnpm tauri build --debug
```

### Specific Target
To build only MSI installer:
```bash
pnpm tauri build --bundles msi
```

## Troubleshooting

### Issue: "cargo not found"
**Solution:** Restart terminal after installing Rust, or manually add Rust to PATH:
```
C:\Users\YourName\.cargo\bin
```

### Issue: "link.exe not found"
**Solution:** Install Visual Studio Build Tools with C++ development workload

### Issue: "WebView2 not found"
**Solution:** Install WebView2 Runtime from Microsoft

### Issue: Build fails with "API_KEY undefined"
**Solution:** Ensure `.env.production` exists with your GEMINI_API_KEY

### Issue: Icon errors during build
**Solution:** Run `pnpm tauri icon` with a valid PNG, or remove icon references from `tauri.conf.json` temporarily

## File Size

Expected file sizes:
- **Installer (MSI)**: ~15-25 MB
- **Portable EXE**: ~10-20 MB
- **Installed size**: ~30-50 MB

Much smaller than Electron apps (~150+ MB)!

## Distribution

To distribute your app:

1. **MSI Installer** (Recommended)
   - Located in `src-tauri/target/release/bundle/msi/`
   - Users can install like any Windows app
   - Supports updates and uninstallation

2. **Portable EXE**
   - Located in `src-tauri/target/release/`
   - No installation required
   - Can run from USB or any folder

## Security Notes

⚠️ **Important:** The Gemini API key is embedded in the executable. For production apps:

1. Consider implementing user authentication
2. Move API calls to a backend server
3. Or use Tauri's secure storage for API keys

## Next Steps

After building:
- Test the executable on a clean Windows machine
- Verify all features work offline (except API calls)
- Consider code signing for distribution (prevents security warnings)

## Resources

- Tauri Documentation: https://tauri.app/
- Tauri Discord: https://discord.com/invite/tauri
- Report issues: Create GitHub issue in your repository

---

**Built with:** React 19 + TypeScript + Tauri + Rust
**App Size:** ~15 MB installer | ~10 MB portable
**Platform:** Windows 10/11 (x64)
