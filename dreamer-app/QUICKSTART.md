# Quick Start Guide - Dreamer Desktop App (Windows)

## 🚀 Building Your Windows .exe

### Prerequisites (One-time setup)

1. **Run the setup script** (PowerShell as Administrator):
   ```powershell
   .\setup-windows.ps1
   ```

   Or install manually:
   - Node.js (v18+): https://nodejs.org/
   - Rust: https://rustup.rs/
   - VS Build Tools: https://visualstudio.microsoft.com/downloads/
   - pnpm: `npm install -g pnpm`

### Build Commands

```bash
# Development mode (with hot-reload)
pnpm tauri dev

# Production build (creates .exe and installer)
pnpm tauri build

# Generate icons from PNG
pnpm tauri icon path/to/icon.png
```

### Where to Find Built Files

After `pnpm tauri build`:

```
src-tauri/target/release/bundle/
├── msi/                                    # MSI installer (recommended)
│   └── Dreamer-Cinematic-Prompt-Builder_0.1.0_x64_en-US.msi
├── nsis/                                   # Alternative installer
└── ../release/
    └── dreamer-cinematic-prompt-builder.exe  # Portable version
```

## 📦 What You Get

- **MSI Installer**: ~15-25 MB (standard Windows installer)
- **Portable EXE**: ~10-20 MB (no installation required)
- **Much smaller than Electron**: 10x smaller than typical Electron apps!

## 🎯 Distribution

### For End Users:
- Share the **MSI installer** from `src-tauri/target/release/bundle/msi/`
- Or share the **portable .exe** from `src-tauri/target/release/`

### Installation:
- **MSI**: Double-click to install (normal Windows installation)
- **Portable**: Just run the .exe (no installation needed)

## 🔧 Project Structure

```
dreamer-app/
├── src/                    # React app source code
├── src-tauri/              # Tauri/Rust backend
│   ├── src/main.rs         # Rust entry point
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # App configuration
│   └── icons/              # App icons
├── .env.production         # API keys (embedded in build)
├── BUILD_WINDOWS.md        # Detailed build instructions
├── README_DESKTOP.md       # User guide
└── setup-windows.ps1       # Setup script
```

## ⚙️ Key Configuration Files

### `src-tauri/tauri.conf.json`
- App name, version, window size
- Bundle settings (identifier, icons)
- Security and permissions

### `.env.production`
- GEMINI_API_KEY (embedded in build)
- Note: API key is built into the .exe

### `package.json`
- Updated with Tauri dependencies
- New scripts: `tauri`, `tauri:dev`, `tauri:build`

## 🐛 Common Issues

### "cargo not found"
→ Restart terminal after installing Rust

### "link.exe not found"
→ Install Visual Studio Build Tools with C++ workload

### "WebView2 not found"
→ Install WebView2 Runtime (usually pre-installed on Windows 10/11)

### Build takes forever
→ First build takes 5-15 minutes (subsequent builds are faster)

### Windows security warning when running .exe
→ Normal for unsigned apps. Click "More info" → "Run anyway"

## 📊 Build Time & Size

| Metric | Value |
|--------|-------|
| First build | 5-15 minutes |
| Subsequent builds | 2-5 minutes |
| MSI installer | ~15-25 MB |
| Portable .exe | ~10-20 MB |
| Installed size | ~30-50 MB |

## 🔐 Security Notes

⚠️ **Important**: The Gemini API key is embedded in the executable.

For production distribution, consider:
- Moving API calls to a backend server
- Implementing user authentication
- Using Tauri's secure storage API

## 📚 Resources

- **BUILD_WINDOWS.md**: Detailed build instructions
- **README_DESKTOP.md**: End-user guide
- **Tauri Docs**: https://tauri.app/
- **Tauri Discord**: https://discord.com/invite/tauri

## ✅ Verification Checklist

After building, verify:
- [ ] .exe runs without errors
- [ ] All UI elements display correctly
- [ ] AI features work (Gemini integration)
- [ ] Local storage/saving works
- [ ] Window resizes properly
- [ ] Icons display correctly

## 🎨 Customization

### Change App Name
Edit `src-tauri/tauri.conf.json`:
```json
"productName": "Your App Name"
```

### Change Window Size
Edit `src-tauri/tauri.conf.json`:
```json
"windows": [{
  "width": 1400,
  "height": 900
}]
```

### Add Custom Icons
```bash
pnpm tauri icon your-icon.png
```

## 📢 Next Steps

1. ✅ Setup complete - Project is ready to build
2. 🔨 On your Windows machine, run: `pnpm tauri build`
3. 📦 Find your .exe in `src-tauri/target/release/bundle/`
4. 🚀 Distribute to users!

---

**Need help?** Check BUILD_WINDOWS.md for detailed troubleshooting.
