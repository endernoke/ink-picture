/**
 * ink-picture - Better image component for Ink CLI/TUIs
 *
 * This library provides components for rendering images in terminal applications
 * built with Ink. It supports multiple rendering protocols with automatic fallback:
 * Kitty, iTerm2, Sixel, Half-Block, Braille, and ASCII.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { Box } from 'ink';
 * import Image, { InkPictureProvider } from 'ink-picture';
 *
 * function App() {
 *   return (
 *     <InkPictureProvider>
 *       <Box flexDirection="column">
 *         <Image
 *           src="https://example.com/image.jpg"
 *           width={40}
 *           height={20}
 *           alt="Example image"
 *         />
 *       </Box>
 *     </InkPictureProvider>
 *   );
 * }
 * ```
 *
 * The Image component must be used within an InkPictureProvider.
 * This ensures terminal capabilities and configuration are detected and provided.
 */

export { default as AsciiImage } from "./components/image/Ascii.js";
export { default as BrailleImage } from "./components/image/Braille.js";
export { default as HalfBlockImage } from "./components/image/HalfBlock.js";
export { default as ITerm2Image } from "./components/image/ITerm2.js";
export type {
  ImageProtocolHint,
  ImageProtocolName,
} from "./components/image/index.js";
export { default } from "./components/image/index.js";
export { default as KittyImage } from "./components/image/Kitty.js";
export type { ImageProps, ImageProtocol } from "./components/image/protocol.js";
export { default as SixelImage } from "./components/image/Sixel.js";

export { default as usePosition } from "./hooks/usePosition.js";
export type {
  GetVisibility,
  Visibility,
  VisibilityInfo,
} from "./hooks/useVisibility.js";
export { useVisibility } from "./hooks/useVisibility.js";

export {
  defaultConfig as defaultInkPictureConfig,
  defaultTerminalInfo,
  type InkPictureConfig,
  InkPictureProvider,
  type TerminalInfo,
  TerminalInfoContext,
  TerminalInfoProvider,
  useImageCache,
  useInkPictureConfig,
  useTerminalInfo,
} from "./InkPictureProvider.js";
