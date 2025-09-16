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
 * import Image, { TerminalInfoProvider } from 'ink-picture';
 *
 * function App() {
 *   return (
 *     <TerminalInfoProvider>
 *       <Box flexDirection="column">
 *         <Image
 *           src="https://example.com/image.jpg"
 *           width={40}
 *           height={20}
 *           alt="Example image"
 *         />
 *       </Box>
 *     </TerminalInfoProvider>
 *   );
 * }
 *
 * Notice that the Image component must be used within a TerminalInfoProvider.
 * This ensures terminal capabilities and information (like width and height in pixels) are detected and provided to the Image component.
 * ```
 */

// Main Image component - the primary export
export { default } from "./components/image/index.js";

// Terminal info context and provider - required for Image component
export {
  TerminalInfoProvider,
  TerminalInfoContext,
  useTerminalInfo,
  useTerminalDimensions,
  useTerminalCapabilities,
} from "./context/TerminalInfo.js";

// Individual image rendering components - for advanced usage
export { default as AsciiImage } from "./components/image/Ascii.js";
export { default as BrailleImage } from "./components/image/Braille.js";
export { default as HalfBlockImage } from "./components/image/HalfBlock.js";
export { default as SixelImage } from "./components/image/Sixel.js";

// Types and interfaces
export type { ImageProps, ImageProtocol } from "./components/image/protocol.js";

export type {
  TerminalInfo,
  TerminalDimensions,
  TerminalCapabilities,
} from "./context/TerminalInfo.js";

// Utility hooks
export { default as usePosition } from "./hooks/usePosition.js";

// Note: utils are kept internal for now, but can be exported later if needed
