/**
 * ink-picture - Better image component for Ink CLI/TUIs
 *
 * This library provides components for rendering images in terminal applications
 * built with Ink. It supports multiple rendering protocols with automatic fallback:
 * Half-Block, Braille, ASCII, and Sixel (experimental).
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

// Individual image rendering components - for advanced usage
export { default as AsciiImage } from "./components/image/Ascii.js";
export { default as BrailleImage } from "./components/image/Braille.js";
export { default as HalfBlockImage } from "./components/image/HalfBlock.js";
export type {
  ImageProtocolHint,
  ImageProtocolName,
} from "./components/image/index.js";
// Main Image component - the primary export
export { default } from "./components/image/index.js";
// Types and interfaces
export type { ImageProps, ImageProtocol } from "./components/image/protocol.js";
export { default as SixelImage } from "./components/image/Sixel.js";

export type { TerminalInfo } from "./context/TerminalInfo.js";
export {
  defaultTerminalInfo,
  TerminalInfoContext,
  useTerminalInfo,
} from "./context/TerminalInfo.js";
// Utility hooks
export { default as usePosition } from "./hooks/usePosition.js";
export type {
  GetVisibility,
  Visibility,
  VisibilityInfo,
} from "./hooks/useVisibility.js";
export { useVisibility } from "./hooks/useVisibility.js";
export {
  type InkPictureConfig,
  InkPictureProvider,
  TerminalInfoProvider,
  useImageCache,
  useInkPictureConfig,
} from "./InkPictureProvider.js";
