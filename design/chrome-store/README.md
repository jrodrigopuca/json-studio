# Chrome Web Store Assets

This directory contains promotional images required for publishing the JSON Spark extension on the Chrome Web Store.

## Files

### Promotional Images

#### Small Promo Tile (`promo-small-440x280.png`)

- **Dimensions:** 440 × 280 pixels
- **Format:** PNG
- **Purpose:** Displayed in Chrome Web Store search results and listings
- **Design:** Features the Energy Ring logo, extension name, tagline, and key features

#### Large Promo Tile / Marquee (`promo-large-1400x560.png`)

- **Dimensions:** 1400 × 560 pixels
- **Format:** PNG
- **Purpose:** Displayed prominently at the top of the extension's Chrome Web Store page
- **Design:** Features logo, branding, feature list, and mockup of the JSON viewer interface

## Source Files

- `promo-small-440x280.svg` - Vector source for small tile
- `promo-large-1400x560.svg` - Vector source for large tile/marquee

## Generating Images

To regenerate the PNG files from SVG sources:

```bash
node scripts/generate-store-assets.mjs
```

## Brand Colors

- **Background:** `#1a1a2e` (Dark blue-gray)
- **Accent:** `#fbbf24` (Bright yellow/gold)
- **Text:** `#f1f5f9` (Off-white)

## Chrome Web Store Requirements

These images meet the Chrome Web Store promotional image requirements:

- ✅ Small tile: Exactly 440×280 pixels
- ✅ Large marquee: Exactly 1400×560 pixels
- ✅ Format: PNG
- ✅ Professional quality
- ✅ Showcases extension features

## Additional Requirements (for Web Store submission)

Beyond these promotional images, you'll also need:

1. **Icon** (already created in `public/icons/`)
   - 128×128 pixels (main store icon)

2. **Screenshots** (to be created)
   - Minimum 1, maximum 5 screenshots
   - Size: 1280×800 or 640×400 pixels
   - PNG or JPEG format
   - Show actual extension functionality

3. **Description & Details**
   - Short description (132 characters max)
   - Detailed description (16,000 characters max)
   - Category selection
   - Language specification

## Tips for Submission

- All images should be high quality and professional
- Screenshots should show real usage scenarios
- Promotional images should be compelling and clear
- Test images at actual display size before submission
