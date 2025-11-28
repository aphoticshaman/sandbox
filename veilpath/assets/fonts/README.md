# VeilPath Custom Fonts

This directory contains the custom fonts used throughout the VeilPath app.

## Required Font Files

Download these fonts from Google Fonts and place the `.ttf` files in this directory:

### Cinzel (Display Font)
**Purpose:** Titles, headings, card names, hero text
**Download:** https://fonts.google.com/specimen/Cinzel

Required files:
- `Cinzel-Regular.ttf`
- `Cinzel-Medium.ttf`
- `Cinzel-SemiBold.ttf`
- `Cinzel-Bold.ttf`

### Raleway (Body Font)
**Purpose:** Body text, paragraphs, descriptions, content
**Download:** https://fonts.google.com/specimen/Raleway

Required files:
- `Raleway-Light.ttf`
- `Raleway-Regular.ttf`
- `Raleway-Medium.ttf`
- `Raleway-SemiBold.ttf`
- `Raleway-Bold.ttf`

### Philosopher (UI Font)
**Purpose:** Buttons, labels, navigation, UI elements
**Download:** https://fonts.google.com/specimen/Philosopher

Required files:
- `Philosopher-Regular.ttf`
- `Philosopher-Bold.ttf`
- `Philosopher-Italic.ttf`
- `Philosopher-BoldItalic.ttf`

## Installation

1. Download each font family from Google Fonts (links above)
2. Extract the downloaded ZIP files
3. Copy the specific `.ttf` files listed above into this `assets/fonts/` directory
4. Rebuild the app

## Font Loading

Fonts are loaded automatically during app initialization via `src/utils/fontLoader.js`.
If fonts fail to load, the app will fallback to system fonts.

## Usage in Code

```javascript
import { getDisplayFont, getBodyFont, getUIFont } from '../utils/fontLoader';

// In styles
const styles = StyleSheet.create({
  title: {
    fontFamily: getDisplayFont('bold'),
    fontSize: 24,
  },
  body: {
    fontFamily: getBodyFont('regular'),
    fontSize: 16,
  },
  button: {
    fontFamily: getUIFont('bold'),
    fontSize: 14,
  },
});
```

## Design System Mapping

| Category | Font | Weight | Usage |
|----------|------|--------|-------|
| Display | Cinzel | Bold | H1, Hero titles |
| Display | Cinzel | SemiBold | H2, Section titles |
| Display | Cinzel | Medium | H3, Card titles |
| Display | Cinzel | Regular | H4, Subtitles |
| Body | Raleway | Light | Subtle text |
| Body | Raleway | Regular | Paragraphs |
| Body | Raleway | Medium | Emphasis |
| Body | Raleway | SemiBold | Strong |
| Body | Raleway | Bold | Very strong |
| UI | Philosopher | Regular | Labels |
| UI | Philosopher | Bold | Buttons |
| UI | Philosopher | Italic | Quotes |

## Licensing

All three fonts are open source under the SIL Open Font License (OFL).
See https://scripts.sil.org/OFL for license details.
