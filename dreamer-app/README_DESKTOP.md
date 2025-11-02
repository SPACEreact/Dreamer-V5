# Dreamer: Cinematic Prompt Builder - Desktop App

A standalone Windows desktop application for AI-powered cinematic storytelling and prompt generation.

## Features

✨ **AI-Powered Prompt Generation** - Generate cinematic prompts using Google Gemini AI  
🎬 **Visual Composition Tools** - Design scenes with professional composition controls  
💡 **Lighting & Color Grading** - Fine-tune lighting and color for cinematic looks  
🎥 **Camera Movement** - Define dynamic camera movements  
📱 **Offline-First** - Works without internet (except AI features)  
⚡ **Lightweight** - Only ~15-20 MB installed size

## Installation

### Option 1: MSI Installer (Recommended)

1. Download `Dreamer-Cinematic-Prompt-Builder_0.1.0_x64_en-US.msi`
2. Double-click to install
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Option 2: Portable EXE

1. Download `dreamer-cinematic-prompt-builder.exe`
2. No installation needed - just run the .exe file
3. Can be placed in any folder or run from USB

## System Requirements

- **OS:** Windows 10 (1809+) or Windows 11
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 100 MB free space
- **Internet:** Required only for AI features (Gemini API)

## First Run

On first launch:
1. The app window will open (may take 5-10 seconds)
2. WebView2 runtime will load (pre-installed on Windows 10/11)
3. You can start creating cinematic prompts immediately

## Usage

### Creating Prompts
1. Click "New Project" to start
2. Choose from various cinematic templates
3. Use visual editors for composition, lighting, and color
4. Generate AI suggestions with Gemini integration
5. Export your prompts for use in AI video/image generation

### Keyboard Shortcuts
- `Ctrl + N` - New project
- `Ctrl + S` - Save project
- `Ctrl + O` - Open project
- `Ctrl + Z` - Undo
- `Ctrl + Y` - Redo

## Troubleshooting

### App won't start
- **Solution 1:** Install WebView2 Runtime from https://developer.microsoft.com/microsoft-edge/webview2/
- **Solution 2:** Right-click .exe → "Run as administrator"
- **Solution 3:** Check Windows Defender didn't block it (see Security section)

### AI features not working
- Verify internet connection
- Check if Gemini API key is valid
- Contact support if issues persist

### App crashes or freezes
- Try deleting app data folder:
  ```
  %APPDATA%\com.dreamer.cinematic-prompt-builder
  ```
- Restart the application
- Update to latest version

### Windows Security Warning
First-time users may see "Windows protected your PC" warning:
1. Click "More info"
2. Click "Run anyway"
3. This happens because the app is not code-signed (see Security section)

## Data Storage

Your projects are saved locally in:
```
C:\Users\YourName\AppData\Roaming\com.dreamer.cinematic-prompt-builder\
```

To backup your work, copy this folder.

## Uninstallation

### If installed via MSI:
1. Settings → Apps → Installed apps
2. Find "Dreamer: Cinematic Prompt Builder"
3. Click "Uninstall"

### If using portable .exe:
Simply delete the .exe file (your saved projects remain in AppData unless deleted)

## Updates

Currently, manual updates are required:
1. Download the latest version
2. Install/replace the old version
3. Your projects and settings are preserved

## Security & Privacy

✅ **No telemetry** - The app doesn't track usage  
✅ **Offline-first** - Works without internet  
✅ **Local storage** - All data stays on your computer  
⚠️ **API key embedded** - Gemini API key is built into the app

### Why "Windows protected your PC" warning?

The app is not code-signed with a certificate (costs $300+/year). This is normal for free/open-source apps. The app is safe to run.

To avoid this warning in the future:
- Developer can code-sign the executable
- Or users can add to Windows Defender exclusions

## Performance

- **Startup time:** 3-8 seconds
- **RAM usage:** 80-150 MB
- **CPU usage:** Low (5-15% during normal use)
- **Disk usage:** ~50 MB installed

## Known Limitations

- Windows only (macOS/Linux versions planned)
- API key is embedded (cannot be changed without rebuild)
- Manual updates required
- No auto-save yet (save manually with Ctrl+S)

## Support

For issues, questions, or feature requests:
- GitHub Issues: [Your repository URL]
- Email: [Your support email]
- Discord: [Your Discord server]

## Building from Source

Want to build the app yourself? See [BUILD_WINDOWS.md](BUILD_WINDOWS.md) for instructions.

## Credits

**Built with:**
- React 19 + TypeScript
- Tauri (Rust-based app framework)
- Google Gemini AI
- Framer Motion
- Tailwind CSS

**License:** [Your license]

---

**Version:** 0.1.0  
**Last Updated:** 2025-11-01  
**Platform:** Windows 10/11 (x64)
