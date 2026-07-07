# ink-picture

Better image component for [Ink](https://github.com/vadimdemedes/ink) CLI/TUI applications.

Display images in your terminal with automatic protocol detection and graceful fallbacks. Supports Sixel, Kitty image protocol, iTerm2 inline images, ASCII art, and more!

[![npm](https://img.shields.io/npm/v/ink-picture?style=flat-square)](https://www.npmjs.com/package/ink-picture)
![MIT License](https://img.shields.io/github/license/endernoke/ink-picture?style=flat-square)
[![downloads](https://img.shields.io/npm/dt/ink-picture?style=flat-square)](https://www.npmjs.com/package/ink-picture)

<img width="1106" height="519" alt="image" src="https://github.com/user-attachments/assets/caac83df-eb35-4b65-bcb1-0a89e889ea83" />

## Who's using ink-picture?

- [Instagram CLI](https://github.com/supreme-gg-gg/instagram-cli): CLI and terminal client for Instagram

Feel free to open a PR to showcase your project here!

## Installation

```bash
npm install ink-picture
```

## Quick Start

```tsx
import React from 'react';
import {Box, render} from 'ink';
import Image, {InkPictureProvider} from 'ink-picture';

function App() {
  return (
    <InkPictureProvider>
      <Image
        src="https://picsum.photos/200/200"
        width={20}
        height={10}
        alt="Example image"
      />
    </InkPictureProvider>
  );
}

render(<App />);
```

> [!IMPORTANT]
> Always wrap your app with `InkPictureProvider`.

## Usage

### `<Image />`

Drop-in image component with dynamic rendering protocol selection. This component can display images using multiple rendering methods depending on the terminal environment.

<details>
  <summary>Props</summary>

#### `src`

type: `string | ArrayBuffer | Buffer<ArrayBufferLike>`

Source of the image. Accepts local file paths, URLs, and `jimp` raw image buffers. `ink-picture` uses `jimp` to process images internally, so it supports all image formats supported by `jimp`.

```tsx
<Image src="path/to/image.png" />
<Image src="https://picsum.photos/200/200" />
<Image src="file:///path/to/image.jpg" />
```

#### `width` and `height`

type: `number | string`

default: `"100%"`

Dimensions of the image in terms of terminal cells. You can also set them as percentages to have them calculated based on the dimensions of the parent element. The image will be resized to fit the given dimensions.

When using percentage dimensions, the parent `<Box>` must have a determinable size, otherwise the image size cannot be calculated.

> The height of a cell is usually around twice its width in most terminal emulators, so set the width and height to a 2:1 ratio for a roughly square image.

```tsx
<Image
  src="path/to/image.png"
  width={10}
  height={5}
/>

// Image dimensions will be 12W X 8H
<Box width={20} height={10}>
  <Image
    src="path/to/image.png"
    width="60%"
    height="80%"
  />
</Box>

// Height will default to "100%"
<Image
  src="path/to/image.png"
  width={10}
/>

// This will not work because parent size is unbounded
<Box>
  <Image
    src="path/to/image.png"
    width="100%"
    height="100%"
  />
</Box>
```

#### `alt` (optional)

type: `string`

Alternative text displayed during image loading and error. It is also used in Ink's screen reader mode.

```tsx
<Image src="path/to/image.png" alt="a close-up shot of a red brick house" />
```

#### `objectFit` (optional)

type: `"fill" | "contain" | "cover"`

default: `"fill"`

Controls how the image is resized to fit the dimensions given by `width` and `height`.

- `"fill"` (default): stretches the image to fill the entire box.
- `"contain"`: preserves the image's aspect ratio and scales it to fit entirely inside the box. Empty space is centered around the image.
- `"cover"`: preserves the image's aspect ratio and scales it to cover the entire box, cropping any overflow.

```tsx
// Stretch to fill (default)
<Image src="path/to/image.png" width={20} height={10} />

// Preserve aspect ratio and fit inside the box
<Image src="path/to/image.png" width={20} height={10} objectFit="contain" />

// Preserve aspect ratio and fill the box, cropping as needed
<Image src="path/to/image.png" width={20} height={10} objectFit="cover" />
```

#### `protocol` (optional)

type: `ImageProtocolName | ImageProtocolHint`

`ImageProtocolName` is one of `"kitty" | "sixel" | "iterm2" | "halfBlock" | "braille" | "ascii"`. See [Rendering protocols](#rendering-protocols) for details.

`ImageProtocolHint` is an object containing one or more key-value pairs of `Visibility: ImageProtocolName`.

If `protocol` is not set, the image will be rendered using a graphical rendering protocol when it is fully visible, if the terminal supports it. A text-based protocol will be used when the image is or becomes partially or entirely outside the terminal viewport.

<details>
  <summary>Learn why</summary>

Graphical rendering protocols work by moving the cursor to the top-left of the image's location using ANSI escape sequences, and then writing the image data to `stdout`. However, the cursor cannot be positioned outside of the terminal's viewport (e.g. negative row or column indices); it will simply be clipped to the edge of the terminal. If we attempt to write an image that is outside of the terminal viewport, the image will be dislocated.

This is not a problem for text-based protocols because they follow Ink's normal rendering cycle. Overflow content will be clipped internally by Ink, and Ink clears the entire terminal before writing a new frame if the app is taller than the number of terminal rows.

Given this, the `Image` component dynamically switches to a text-based protocol for overflown images so at least something is safely shown.

</details>

If one of `ImageProtocolName` is passed, the corresponding rendering protocol will always be used where available, regardless of terminal capabilities. The image will not be rendered using a text-based protocol fallback when it is partially or entirely outside the terminal viewport; it simply doesn't render there.

If an `ImageProtocolHint` object is passed, the image will be rendered using the corresponding protocol for each specified `Visibility` state. Unspecified states will use the default protocol fallback behavior.

```tsx
// Image will be rendered with sixels when fully visible,
// and skip rendering altogether otherwise.
<Image
  src="path/to/image.png"
  protocol="sixel"
/>

// Image will be rendered with kitty graphics protocol when fully visible,
// and fall back to a text-based protocol otherwise.
<Image
  src="path/to/image.png"
  protocol={{ "full": "kitty" }}
/>
```

See [Visibility](#visibility) for details on visibility states and dynamic protocol switching.

#### `getVisibility` (optional)

type: `(info: VisibilityInfo) => "full" | "partial" | "hidden"`

A callback customizing the visibility detection logic of the image. It receives the absolute position and dimensions of the image in the terminal viewport, and should return a visibility state. This callback is useful for controlling dynamic protocol switching in apps with complex layouts (e.g. sticky headers and footers) since the image by itself does not know about whether it is obstructed by another element.

By default, images determine their visibility by checking against the dimensions of the app and the terminal viewport respectively.

See [Visibility](#visibility) for more on how visibility detection works.

</details>

### `<InkPictureProvider />`

Wrapper component that Detects and provides terminal capabilities, as well as configuration and image caching to all descendant `Image` components.

`TerminalInfoProvider` is exported as an alias for `InkPictureProvider` for backwards compatibility.

Upon mounting, the provider queries the terminal for capabilities using escape sequences. This temporarily intercepts stdin for up to 1 second (usually much shorter). Any user keystrokes made during this window are safely buffered and re-injected into your app once detection completes.

> [!TIP]
> Move `InkPictureProvider` as close to the app's root as possible, i.e. wrap your entire app with it, so terminal capabilities are only detected once and provided to the entire app.

<details>
  <summary>Props</summary>

#### `terminalInfo` (optional)

type: `Partial<TerminalInfo>`

Override detected terminal information and capabilities. Provide one or more of the following:

| Field                    | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `terminalWidth`          | Terminal viewport width in pixels                           |
| `terminalHeight`         | Terminal viewport height in pixels                          |
| `cellWidth`              | Width of each terminal cell in pixels                       |
| `cellHeight`             | Height of each terminal cell in pixels                      |
| `supportsUnicode`        | Whether the terminal supports Unicode                       |
| `supportsColor`          | Whether the terminal supports colored output                |
| `supportsSixelGraphics`  | Whether the terminal supports Sixels                        |
| `supportsKittyGraphics`  | Whether the terminal supports the Kitty Graphics Protocol   |
| `supportsITerm2Graphics` | Whether the terminal supports iTerm2 Inline Images Protocol |

#### `config` (optional)

type: `Partial<InkPictureConfig>`

Configurations for library-wide behavior.

| Field             | Default | Description                                                        |
| ----------------- | ------- | ------------------------------------------------------------------ |
| `pollIntervalMs`  | 16      | Interval in milliseconds for polling for layout changes in the app |
| `paintIntervalMs` | 16      | Unused; will be removed in the next major version.                 |
| `cacheSize`       | 10      | Maximum number of cached images. Set it to 0 to disable caching    |

See [Configuration](#configuration) for details.

#### `onTerminalInfoDetection` (optional)

type: `(info: TerminalInfo) => void`

Callback invoked after terminal capability detection completes. Use this if you want to conditionally run code based on terminal information.

```tsx
<InkPictureProvider
  config={{cacheSize: 20}}
  onTerminalInfoDetection={info => {
    foo(info);
  }}
>
  <App />
</InkPictureProvider>
```

</details>

### Individual components for each protocol

Each rendering protocol has a standalone component export. They all accept the same `ImageProps` (`src`, `width`, `height`, `alt`) and can be used directly when you want more low-level control:

```tsx
import {
  AsciiImage,
  BrailleImage,
  HalfBlockImage,
  SixelImage,
  KittyImage,
  ITerm2Image,
} from 'ink-picture';
```

All protocol components must still be wrapped in `<InkPictureProvider>`. They only handle visibility detection by checking against app and terminal viewport dimensions.

See [Protocols](#rendering-protocols) for differences between each component.

### Hooks

The following hooks are also exported for use in custom components:

- `useInkPictureConfig()`: returns the resolved `InkPictureConfig` combining defaults and overrides
- `useTerminalInfo()`: returns the resolved `TerminalInfo` combining defaults, detected terminal info, and overrides.
- `useImageCache()`: returns the image cache instance (or `null` if caching is disabled)

If `useTerminalInfo()` is used outside of an `InkPictureProvider`, the following defaults will be used. Image rendering quality may degrade significantly with the default values; they are only meant to be a safe fallback.

| Field                    | Default                      |
| ------------------------ | ---------------------------- |
| `terminalWidth`          | `6 * process.stdout.columns` |
| `terminalHeight`         | `12 * process.stdout.rows`   |
| `cellWidth`              | `6`                          |
| `cellHeight`             | `12`                         |
| `supportsUnicode`        | `false`                      |
| `supportsColor`          | `false`                      |
| `supportsSixelGraphics`  | `false`                      |
| `supportsKittyGraphics`  | `false`                      |
| `supportsITerm2Graphics` | `false`                      |

## Rendering protocols

Images can be rendered using one of the following protocols:

| ID          | Name                            | Resolution   | Requirements                            |
| ----------- | ------------------------------- | ------------ | --------------------------------------- |
| `kitty`     | Kitty Graphics Protocol         | Full         | Supported terminals                     |
| `iterm2`    | iTerm2 Inline Images Protocol   | Full         | Supported terminals                     |
| `sixel`     | Sixel                           | Full         | Sixel support (device attribute `4`)    |
| `halfBlock` | Colored unicode half-blocks (▄) | 1x2 per cell | Unicode + color support                 |
| `braille`   | Monochrome Braille patterns     | 2x4 per cell | Unicode support                         |
| `ascii`     | ASCII art                       | 1x1 per cell | None (color support for colored output) |

### Compatibility with terminal emulators

`ink-picture` should work out-of-the-box in most terminal emulators and select the best supported protocol. Yet, terminal emulators may lack support for certain protocols and/or have non-compliant or faulty implementations for some protocols.

Use the table below as a reference to check which protocol to use for your terminal. You might also want to install a better terminal emulator for best experience.

✅ = Fully supported  
⚠️ = Partially supported (works but may have issues or caveats)  
❌ = Not supported

| Terminal Emulator                                      | Sixel | kitty graphics | iTerm2 inline images protocol |
| ------------------------------------------------------ | ----- | -------------- | ----------------------------- |
| GNOME Terminal                                         | ❌    | ❌             | ❌                            |
| Ghostty                                                | ❌    | ✅             | ❌                            |
| iTerm2                                                 | ✅    | ✅ [^1]        | ✅                            |
| Kitty                                                  | ❌    | ✅             | ❌                            |
| Konsole [^2]                                           | ⚠️    | ✅             | ⚠️                            |
| Rio                                                    | ✅    | ❌             | ✅                            |
| xterm.js [^3] <br/> (VS Code integrated terminal) [^4] | ⚠️    | ⚠️             | ⚠️                            |
| Warp [^5]                                              | ❌    | ⚠️             | ❌                            |
| WezTerm                                                | ✅    | ⚠️ [^6]        | ✅                            |
| Windows Terminal                                       | ✅    | ❌             | ❌                            |
| XTerm                                                  | ✅    | ❌             | ❌                            |

Please refer to [Are We Sixel Yet?](https://www.arewesixelyet.com/) for a comprehensive (but slightly out-of-date) list of terminals that support Sixel graphics.

[^1]: Needs verification.
[^2]: sixel and iip images cannot be erased by writing characters over them.
[^3]: sixel and iip images cannot be erased by writing characters over them due to a [bug](https://github.com/xtermjs/xterm.js/issues/5860); kitty has non-compliant implementation.
[^4]: VS Code integrated terminal uses xterm.js. The settings `terminal.integrated.enableImages` and `terminal.integrated.gpuAcceleration` must be enabled to render graphical images.
[^5]: Information may be out-of-date. Kitty has non-compliant implementation.
[^6]: Kitty has non-compliant implementation.

> If you know your terminal emulator supports any of the above protocols but is not listed here, please open an issue or PR to update the table.

### Protocol selection

When no `protocol` prop is specified, `Image` selects the best protocol automatically:

1. A graphical protocol (kitty > iTerm2 > Sixel, in that order) is chosen for fully visible images if the terminal supports it. The priority order is adjusted per-terminal to avoid known issues (see the heuristic in [getBestProtocol](/src/utils/getBestProtocol.ts)).
2. If no graphical protocol is supported, a text-based protocol is used instead: `halfBlock` when both Unicode and color are available, `braille` when only Unicode is available, or `ascii` as the universal fallback.
3. When an image is partially or entirely outside the app or terminal viewport, it **dynamically switches** to a text-based protocol to avoid image dislocation.

<details>
  <summary>Note on graphical protocols (sixel, kitty, iterm2)</summary>
  Images rendered with sixel and iterm2 protocols may experience flickers during app re-renders. This is because Ink clears the terminal buffer before rendering each frame, which removes any sixel and iterm2 images, even if their positions are unchanged. To work around this, images are repainted after every React render via a React Profiler wrapped in `InkPictureProvider`, so they reappear almost instantly.

In addition, images rendered with sixel, kitty, and iterm2 protocols may not persist after app exit. This is because these renderers perform image cleanup upon unmount to prevent graphical artifacts, but they cannot distinguish between a regular React component unmount and an app exit. Issues and PRs addressing this bug are much appreciated.

</details>

## Visibility

Each `Image` component tracks its absolute position in the terminal and determines whether it is **fully visible**, **partially visible**, or **hidden** relative to the terminal viewport and the app bounds. This drives the automatic protocol switching described above.

You can customize visibility detection with the `getVisibility` callback:

```tsx
<Image
  src="image.png"
  getVisibility={({
    position,
    terminalWidth,
    terminalHeight,
    defaultVisibility,
  }) => {
    // Custom logic, e.g. account for a sticky header that overlaps the image
    if (position.row < 5) return 'partial';
    return defaultVisibility;
  }}
/>
```

The callback receives a `VisibilityInfo` object:

| Field               | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `position`          | Absolute position and dimensions (`col`, `row`, `width`, `height`, `appWidth`, `appHeight`) |
| `terminalWidth`     | Terminal viewport width in cells                                                            |
| `terminalHeight`    | Terminal viewport height in cells                                                           |
| `defaultVisibility` | The visibility state computed by the built-in algorithm                                     |

The `useVisibility` hook and `usePosition` hook are also exported if you need visibility logic in custom components.

## Screen reader accessibility

When Ink's screen reader mode is active, `Image` renders an empty `Box` with an `aria-label` describing the image. The label is either the `alt` prop or the image source string. Image data is not loaded or rendered, keeping output clean for screen readers.

## Configuration

Configuration can be set through the `config` prop on `<InkPictureProvider>` or via environment variables. Environment variables take precedence over prop values.

| Prop              | Env variable                 | Default | Description                                                        |
| ----------------- | ---------------------------- | ------- | ------------------------------------------------------------------ |
| `pollIntervalMs`  | `INK_PICTURE_POLL_INTERVAL`  | `16`    | Interval in milliseconds for polling element layout changes.       |
| `paintIntervalMs` | `INK_PICTURE_PAINT_INTERVAL` | `16`    | Unused; will be removed in the next major version.                 |
| `cacheSize`       | `INK_PICTURE_CACHE_SIZE`     | `10`    | Number of decoded images to keep in memory. Set to `0` to disable. |

## Contributing

Contributions are welcome! To contribute:

1. Open or comment on an issue describing what you want to change
2. Fork the repository
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `pnpm install`
5. Make your changes
6. Run tests: `pnpm test`
7. Open a pull request

## License

MIT
