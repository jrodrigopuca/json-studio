# JSON Spark ⚡

> The most beautiful and feature-rich JSON viewer for Chrome. Automatically detects and formats JSON on any webpage.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6)
![License](https://img.shields.io/badge/license-GPL%20v3-green)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

## How to Use

### 🔄 Auto-Detection

Visit any URL that returns JSON (e.g., `https://api.github.com/users/github`) and JSON Spark will automatically replace the plain text with a beautiful, interactive viewer.

### 🖱️ Extract from Page

Click the extension icon on any webpage to extract and view JSON content from the current page.

### 📝 Format Selection

Select JSON text on any webpage, right-click, and choose "Format JSON" to open it in the viewer.

## Features

### 🌳 Six Powerful Views

| View      | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| **Tree**  | Collapsible tree with search, expand/collapse all, level control |
| **Raw**   | Syntax highlighted JSON with line numbers, prettify/minify       |
| **Table** | Arrays of objects rendered as sortable tables                    |
| **Diff**  | Side-by-side comparison with change highlighting                 |
| **Edit**  | Full-featured editor with validation, bracket matching, folding  |
| **Saved** | Bookmark JSONs locally for quick access                          |

### ✨ Key Features

#### Extension Features

- **Auto-Detection**: Automatically formats JSON pages (APIs, config files, data endpoints)
- **Extract from Page**: Click extension icon to extract JSON from any webpage
- **Right-Click Format**: Select JSON text and format via context menu
- **100% Private**: All processing happens locally - no data sent to servers

#### Viewer Features

- **Context Menu**: Copy Key, Copy Path (JSONPath), Copy Value, Copy Formatted
- **Search**: Real-time search with match navigation (⌘F)
- **Sort Keys**: 3-state sorting — Original → A-Z → Z-A
- **Filter to Node**: Focus on any subtree
- **Themes**: Dark / Light / System auto-detection
- **Keyboard Shortcuts**: Full keyboard navigation (⌥1-6 for views)
- **URLs & Emails**: Clickable links detected automatically
- **Download**: Export formatted JSON as .json file

### ✏️ Edit Mode Pro

- **Indent Toggle**: 2 spaces → 4 spaces → Tab (auto re-formats)
- **Word Wrap**: Toggle line wrapping
- **Font Size**: Adjustable (10-24px)
- **Bracket Matching**: Highlights matching `{}[]`
- **Format on Paste**: Auto-prettifies valid JSON
- **Fold/Unfold**: Collapse objects and arrays
- **Cursor Position**: Live Ln/Col display

## Development

### Setup

```bash
# Install dependencies
npm install

# Development server (viewer only)
npm run dev

# Run demo page
npm run demo

# Type checking
npx tsc --noEmit

# Run tests
npm test
```

### Building

```bash
# Build demo site
npm run build

# Build Chrome extension
npm run build:ext

# Output: dist-ext/
```

### Extension Development

1. Run `npm run build:ext`
2. Load `dist-ext/` as unpacked extension in Chrome
3. Make changes and rebuild
4. Click extension reload button in `chrome://extensions/`

### GitHub Actions

Automated packaging is available via GitHub Actions:

1. Go to **Actions** → **Package Extension**
2. Click **Run workflow**
3. Check **Create GitHub Release** (optional)
4. Download `json-spark-v{version}.zip` from Releases or Artifacts

## Keyboard Shortcuts

| Shortcut | Action       |
| -------- | ------------ |
| ⌥1-6     | Switch views |
| ⌘F       | Open search  |
| ⌥E       | Expand all   |
| ⌥C       | Collapse all |
| ⌥S       | Sort by keys |
| ⌘Z       | Undo         |
| ⌘⇧Z      | Redo         |
| ?        | Show help    |

## Tech Stack

- **React 19** — UI framework
- **Zustand 5** — State management
- **Vite 7.3** — Build tool
- **TypeScript 5.3** — Type safety
- **CSS Modules** — Scoped styling

## Project Structure

```
src/
├── viewer/              # Main JSON viewer app
│   ├── components/      # React components (Tree, Raw, Table, etc.)
│   ├── core/            # Parser, formatter, highlighter, converters
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand state management
│   └── styles/          # CSS modules
├── background/          # Chrome extension service worker
├── content/             # Content script (auto-detection)
├── options/             # Extension options page
├── shared/              # Shared types, constants, i18n
└── popup/ (deprecated)  # Removed - extension opens full viewer

design/
├── chrome-store/        # Promotional images (440×280, 1400×560)
└── icons-source/        # Source SVG icons

scripts/
├── build-ext.js              # Extension build script
├── generate-store-assets.mjs # Generate promo PNGs
└── generate-*-fixture.mjs    # Test data generators
```

## Chrome Web Store Assets

Ready-to-use promotional materials:

- **Small Tile**: `design/chrome-store/promo-small-440x280.png` (440×280)
- **Large Marquee**: `design/chrome-store/promo-large-1400x560.png` (1400×560)
- **Icons**: 16×16, 32×32, 48×48, 128×128 (PNG)
- **Permission Justifications**: `design/chrome-store/permission-justifications.md`

Regenerate assets:

```bash
node scripts/generate-store-assets.mjs
```

## Privacy

Your privacy is our priority:

- ✅ **100% Local Processing** - All JSON parsing happens in your browser
- ✅ **Zero Data Collection** - No analytics, no tracking, no telemetry
- ✅ **No External Calls** - Works completely offline
- ✅ **Open Source** - Fully auditable code
- ✅ **Temporary Storage** - Session-only storage for extracted JSON

See our [Privacy Policy](PRIVACY.md) for complete details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
