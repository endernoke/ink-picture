# ink-picture

Better image component for [Ink](https://github.com/vadimdemedes/ink) CLI/TUI applications.

Display images in your terminal with automatic protocol detection and graceful fallbacks. Supports ASCII, Braille patterns, Unicode half-blocks, Sixel graphics, and iTerm2 inline images.

<img width="1919" height="765" alt="Screenshot 2025-09-07 160615" src="https://github.com/user-attachments/assets/0be5be69-043a-446a-aa8a-7d138919113c" />

## Who's using ink-picture?

- [Instagram CLI](https://github.com/supreme-gg-gg/instagram-cli): CLI and terminal client for Instagram

Feel free to open a PR to showcase your project here!

## Installation

```bash
npm install ink-picture
```

## Basic Usage

```tsx
import React from "react";
import { Box, render } from "ink";
import Image, { TerminalInfoProvider } from "ink-picture";

function App() {
  return (
    <TerminalInfoProvider>
      <Box flexDirection="column">
        <Image
          src="https://example.com/image.jpg"
          width={40}
          height={20}
          alt="Example image"
        />
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
```

> [!IMPORTANT]
> Always wrap your app with `TerminalInfoProvider` to enable automatic terminal capability detection.

## API

### `<Image>`

Main component with automatic protocol detection and fallback.

#### Props

- `src` (string) - Image URL or file path. Supports all formats handled by Sharp (JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF)
- `width?` (number) - Width in terminal cells
- `height?` (number) - Height in terminal cells
- `alt?` (string) - Alternative text for loading/error states
- `protocol?` (string) - Force specific protocol: `"ascii" | "braille" | "halfBlock" | "sixel" | "iterm2"` (`sixel` and `iterm2` are experimental, see [Important Notes](#important-notes--caveats))

#### Protocols

The component automatically selects the best available protocol:

1. **Half-block** (`halfBlock`) - Color rendering with Unicode half-blocks (▄). Requires color + Unicode support.
2. **Braille** (`braille`) - High-resolution monochrome using Braille patterns. Requires Unicode support.
3. **ASCII** (`ascii`) - Character-based art. Works in all terminals (fallback).
4. **Sixel** (`sixel`) - True color bitmap graphics. Requires Sixel support (experimental).
5. **iTerm2** (`iterm2`) - True color images in iTerm2-compatible terminals (experimental).

### `<TerminalInfoProvider>`

Required wrapper component that detects terminal capabilities.

```tsx
<TerminalInfoProvider>{/* Your app components */}</TerminalInfoProvider>
```

### Individual Components

For advanced usage, import specific renderers:

```tsx
import {
  AsciiImage,
  BrailleImage,
  HalfBlockImage,
  SixelImage,
  Iterm2Image,
} from "ink-picture";
```

### Hooks

- `useTerminalInfo()` - Complete terminal information
- `useTerminalDimensions()` - Terminal size in pixels and cells
- `useTerminalCapabilities()` - Supported features (Unicode, color, graphics)

## Important Notes & Caveats

### Sixel and iTerm2 Renderers (Experimental)

The Sixel and iTerm2 renderers provide the highest quality but come with important limitations:

⚠️ **Experimental Warning:** These components bypasses React/Ink's normal rendering pipeline and writes directly to the terminal. You may experience:

- Rendering flicker during updates
- Cursor positioning issues
- Cleanup problems on component unmount
- Images may be gone after app termination

### General Considerations

- Images are fetched and processed asynchronously
- Large images are automatically resized to fit terminal constraints
- Remote images require network access
- Terminal capability detection happens once per session

## Examples

### Static Gallery

```tsx
<TerminalInfoProvider>
  <Box flexDirection="row" gap={2}>
    <Image src="./photo1.jpg" width={20} height={15} />
    <Image src="./photo2.jpg" width={20} height={15} />
    <Image src="./photo3.jpg" width={20} height={15} />
  </Box>
</TerminalInfoProvider>
```

### Force Specific Protocol

```tsx
<Image src="./diagram.png" protocol="braille" alt="Technical diagram" />
```

### Responsive Sizing

```tsx
{
  /* Image will fit within container bounds */
}
<Box width={50} height={30}>
  <Image src="./large-image.jpg" />
</Box>;
```

## Contributing

Contributions are welcome! To contribute:

1. Open or comment on an issue describing what you want to change
2. Fork the repository
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `npm install`
5. Make your changes
6. Run tests: `npm test`
7. Open a pull request
