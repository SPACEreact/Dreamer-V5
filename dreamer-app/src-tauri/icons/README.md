# Icon Placeholder

The Tauri application requires icons in multiple formats:

- **32x32.png** - Small icon
- **128x128.png** - Medium icon
- **128x128@2x.png** - High-DPI medium icon
- **icon.icns** - macOS icon format
- **icon.ico** - Windows icon format

## How to Generate Icons

On Windows, after installing Tauri dependencies, run:

```bash
pnpm tauri icon path/to/your/icon.png
```

This will automatically generate all required icon formats from a single PNG file (preferably 1024x1024px or larger).

## Temporary Solution

For now, placeholder icons will be generated during the first build. You can replace them later with your custom icons.
