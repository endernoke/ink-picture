# ink-picture

Better image component for [Ink](https://github.com/vadimdemedes/ink) CLI/TUI applications.

Display images in your terminal with automatic protocol detection and graceful fallbacks. Supports Sixel, Kitty image protocol, iTerm2 inline images, ASCII art, and more!

[![npm](https://img.shields.io/npm/v/ink-picture?style=flat-square)](https://www.npmjs.com/package/ink-picture)
![MIT License](https://img.shields.io/github/license/endernoke/ink-picture?style=flat-square)
[![downloads](https://img.shields.io/npm/dm/ink-picture?style=flat-square)](https://www.npmjs.com/package/ink-picture)

<img width="1106" height="519" alt="image" src="https://github.com/user-attachments/assets/caac83df-eb35-4b65-bcb1-0a89e889ea83" />

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
> Always wrap your app with `TerminalInfoProvider`.

## API

### `<Image>`

Main component with automatic protocol detection and fallback.

#### Props

- `src` (string) - Image URL or file path. Supports all formats handled by Sharp (JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF)
- `width?` (number) - Width in terminal cells
- `height?` (number) - Height in terminal cells
- `alt?` (string) - Alternative text for loading/error states
- `protocol?` (string) - Force specific protocol: `"auto" | "ascii" | "braille" | "halfBlock" | "sixel" | "iterm2" | "kitty"`

#### Protocols

The component automatically selects the best available protocol with the following priority:

1. **Kitty** (`kitty`) - True color images in terminals that support the [Kitty terminal graphics protocol](https://sw.kovidgoyal.net/kitty/graphics-protocol/).
2. **iTerm2** (`iterm2`) - True color images in terminals that implements the [iTerm2 inline images protocol](https://iterm2.com/documentation-images.html).
3. **Sixel** (`sixel`) - True color bitmap graphics in [Sixel-compatible terminals](https://www.arewesixelyet.com/).
4. **Half-block** (`halfBlock`) - Color rendering with Unicode half-blocks (▄). Requires color + Unicode support.
5. **Braille** (`braille`) - High-resolution monochrome using Braille patterns. Requires Unicode support.
6. **ASCII** (`ascii`) - Character-based art. Works in all terminals (fallback).

### `<TerminalInfoProvider>`

Required wrapper component that automatically detects terminal capabilities.

Image rendering components depend on terminal information to select the best protocol and size images correctly. All `Image` components must be wrapped in `TerminalInfoProvider`.

For best performance, wrap your entire component tree so that terminal info detection is done only once per session.

```tsx
<TerminalInfoProvider>{/* Your app components */}</TerminalInfoProvider>
```

<details>
  <summary>Why should I do this?</summary>

Under the hood, `TerminalInfoProvider` wraps a React context which uses a combination of ANSI control sequence queries, environment variables, and heuristics to determine:

- Terminal cell size in pixels
- Unicode and color support
- Supported terminal image protocols

During this detection phase, it will write some escape sequences to stdout and listen for system responses from stdin. This takes sub-second time and should not be visually noticeable.

It should not interfere with user input, but just in case, it is recommended to wrap your entire component tree in `TerminalInfoProvider` so that detection is finished on startup in order to minimize the chance of any interference.

</details>

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

### High quality renderers

The Kitty, Sixel, and iTerm2 renderers provide the highest image quality but may not work perfectly in all environments. This is because they rely on hacky side effects to display and clear images.

> [!WARNING]
> These components bypasses React/Ink's normal rendering pipeline and writes directly to the terminal.

You may experience:

- Rendering flicker during updates
- Images may be wiped from the terminal after app termination

These issues are difficult/infeasible to fix and I will not be addressing them in the near future. If you know a solution, please open an issue or PR.

### General Considerations

- Images are fetched and processed asynchronously
- Large images are automatically resized to fit terminal constraints
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

## Choosing the right protocol

> Devs using this library are highly encouraged to provide a configuration option to select the image protocol that works best for their users.

If you use `ink-picture` in your project, feel free to link to this section in your documentation.

Please read if you use a project that uses `ink-picture`.

`ink-picture` should work out-of-the-box in most modern terminal emulators. Yet, not all terminals support all image protocols.

Use the table below as a reference to check which protocol to use for your terminal. You might also want to install a better terminal emulator for best experience.

✅ = Fully supported  
⚠️ = Partially supported (works but may have issues/caveats)  
❌ = Not supported

| Terminal Emulator                               | Sixel | kitty graphics | iTerm2 inline images |
| ----------------------------------------------- | ----- | -------------- | -------------------- |
| GNOME Terminal                                  | ❌    | ❌             | ❌                   |
| Ghostty                                         | ❌    | ✅             | ❌                   |
| iTerm2                                          | ✅    | ❌             | ✅                   |
| Kitty                                           | ❌    | ✅             | ❌                   |
| Konsole                                         | ⚠️    | ✅             | ⚠️                   |
| Rio                                             | ✅    | ❌             | ✅                   |
| VS Code integrated terminal <br /> (xterm.js)\* | ✅    | ❌             | ✅                   |
| Warp                                            | ❌    | ⚠️             | ❌                   |
| Wayst                                           | ❌    | ⚠️             | ❌                   |
| WezTerm                                         | ✅    | ✅             | ✅                   |
| Windows Terminal                                | ✅    | ❌             | ❌                   |
| XTerm                                           | ✅    | ❌             | ❌                   |

Please refer to [Are We Sixel Yet?](https://www.arewesixelyet.com/) for a comprehensive (but slightly out-of-date) list of terminals that support Sixel graphics.

\* For VS Code, make sure you have the settings `terminal.integrated.enableImages` and `terminal.integrated.gpuAcceleration` enabled, then restart the integrated terminal. If you are on Windows, you might need to follow the on-screen instructions to configure conPTY.

> If you know your terminal supports any of the above protocols but is not listed here, please open an issue or PR to update the table.

Generally, it is recommended to use the kitty protocol if it is fully supported, as it provides near-perfect performance, without any flickers or artifacts.

Otherwise, the performance of sixel and iterm2 protocols are practically the same, so use whichever your terminal supports.

If not provided with a explicit protocol, `ink-picture` will automatically select the best available protocol based on detected terminal capabilities.

See the [protocols section](#protocols) for more details.

## Contributing

Contributions are welcome! To contribute:

1. Open or comment on an issue describing what you want to change
2. Fork the repository
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `npm install`
5. Make your changes
6. Run tests: `npm test`
7. Open a pull request

## License

MIT License, see [LICENSE](LICENSE).
)
