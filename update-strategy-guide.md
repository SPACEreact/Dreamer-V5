# Dreamer Cinematic Prompt Builder - Distribution & Update Guide

## 🚀 Distribution Options

### Option 1: Direct File Sharing (Best for Testing)

**MSI Installer (Recommended)**
- File: `src-tauri/target/release/bundle/msi/Dreamer Cinematic Prompt Builder.msi`
- Professional Windows installer
- Adds shortcuts, proper uninstaller
- Works with Windows Installer service

**Portable EXE**
- File: `src-tauri/target/release/dreamer-cinematic-prompt-builder.exe`
- No installation needed
- Can run from USB stick
- Users can just double-click to run

**Sharing Methods:**
- **Email:** Attach MSI (max ~100MB)
- **Google Drive:** Share public link
- **Dropbox/OneDrive:** Shareable link
- **USB Drive:** Physical distribution
- **GitHub Releases:** Professional option

### Option 2: GitHub Releases (Best for Public Distribution)

1. **Create Release:**
   ```bash
   # Tag your version
   git tag -a v1.0.0 -m "First release"
   git push origin v1.0.0
   ```

2. **Upload Files to GitHub:**
   - Go to your repo → Releases
   - Draft a new release
   - Upload your MSI and EXE files
   - Add release notes

3. **Benefits:**
   - Professional distribution
   - Version control
   - Easy for users to find updates
   - Can add download stats

### Option 3: Custom Website (Best for Business)

Create download page with:
- Download buttons for different OS
- Version history
- Installation instructions
- Screenshots and descriptions

## 🔄 Update Mechanisms

### Manual Updates (Recommended for Start)

**Process:**
1. Build new version (`pnpm tauri build`)
2. Create new GitHub Release or update website
3. Users download and install new version
4. Old version gets uninstalled

**Communication:**
- Announce updates on your website/social media
- Include what's new in the changelog
- Give users advance notice

### Automatic Updates (Advanced)

**Tauri Built-in Updater:**
Add to your Rust code:

```rust
// In src-tauri/src/main.rs
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) {
    let updater = app.updater();
    
    updater.check_for_update(|update| {
        if let Some(available) = available {
            // Show update dialog
            if update.update_app_immediately() {
                // Restart app
            }
        }
    }).await;
}
```

**WebSocket Updates:**
For real-time push updates to users.

## 📊 Best Practices

### File Naming
```
Dreamer-Cinematic-Prompt-Builder-v1.0.0.msi
Dreamer-Cinematic-Prompt-Builder-v1.0.0-Portable.exe
```

### Versioning
- Use semantic versioning: v1.0.0, v1.1.0, v1.1.1
- Major.Minor.Patch format
- Update package.json version too

### Distribution Checklist
- [ ] Build production version
- [ ] Test installer on clean Windows machine
- [ ] Compress files (ZIP for sharing)
- [ ] Create release notes
- [ ] Upload to GitHub/website
- [ ] Test download links

### User Experience
- [ ] Clear download buttons
- [ ] Installation instructions
- [ ] System requirements
- [ ] Changelog with new features
- [ ] Support contact information

## 🛠️ Build Commands Reference

**Development Build:**
```bash
pnpm tauri dev
```

**Production Build:**
```bash
pnpm tauri build
```

**Windows Only:**
```bash
pnpm tauri build --target x86_64-pc-windows-msvc
```

**Build Output:**
- `src-tauri/target/release/` - EXE files
- `src-tauri/target/release/bundle/msi/` - Windows installer
- `src-tauri/target/release/bundle/` - Other platforms

## 📱 Cross-Platform Distribution

Your Tauri app can also build for:
- **macOS:** `.dmg` installer
- **Linux:** `.deb`, `.rpm`, `.AppImage`
- **Windows:** `.msi` installer (recommended)

## 💡 Pro Tips

1. **Test on Fresh Windows:** Use VirtualBox/VM for testing
2. **Sign Your Code:** Add certificate to avoid security warnings
3. **Small Downloads:** Optimize your app size
4. **Backup Releases:** Keep old versions available
5. **Feedback Loop:** Add way for users to report issues