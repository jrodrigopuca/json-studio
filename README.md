# JSON Spark ⚡

> A modern, feature-rich JSON viewer Chrome extension built with React 19 + Zustand.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6)
![License](https://img.shields.io/badge/license-GPL%20v3-green)

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

## Quick Start

```bash
# Install dependencies
npm install

# Development (viewer only)
npm run dev

# Build extension
npm run build

# Run demo page
npx vite --config vite.demo.config.ts
```

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
├── viewer/           # Main viewer app
│   ├── components/   # React components
│   ├── core/         # Parser, formatter, highlighter
│   ├── hooks/        # Custom hooks
│   ├── store/        # Zustand store
│   └── styles/       # CSS modules
├── background/       # Service worker
├── content/          # Content script
├── popup/            # Extension popup
└── shared/           # Shared types
```

## Documentation

- [ROADMAP.md](ROADMAP.md) — Feature roadmap & competitive analysis
- [FASE-REACT.md](FASE-REACT.md) — Detailed implementation docs
- [PRIVACY.md](PRIVACY.md) — Privacy policy

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
