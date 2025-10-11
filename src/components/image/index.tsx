import React, { useState, useEffect, useCallback } from "react";
import { type ImageProps } from "./protocol.js";
import AsciiImage from "./Ascii.js";
import HalfBlockImage from "./HalfBlock.js";
import BrailleImage from "./Braille.js";
import SixelImage from "./Sixel.js";
import ITerm2Image from "./ITerm2.js";
import KittyImage from "./Kitty.js";

const imageProtocols = {
  ascii: AsciiImage,
  braille: BrailleImage,
  halfBlock: HalfBlockImage,
  iterm2: ITerm2Image,
  kitty: KittyImage,
  sixel: SixelImage,
};

export type ImageProtocolName = keyof typeof imageProtocols;

/**
 * Internal component that renders an image using a specific protocol.
 *
 * @param props - Image props with protocol specification
 * @returns JSX element rendering the image with the specified protocol
 */
const ImageRenderer = (props: ImageProps & { protocol: ImageProtocolName }) => {
  const ProtocolComponent =
    imageProtocols[props.protocol] || imageProtocols["ascii"];
  return <ProtocolComponent {...props} />;
};

/**
 * Main Image component with automatic protocol fallback.
 *
 * This component automatically detects terminal capabilities and falls back
 * to supported rendering protocols in order of preference:
 * halfBlock -> braille -> ascii
 *
 * **IMPORTANT: TerminalInfo Provider Requirement**
 * This component MUST be used within a `<TerminalInfoProvider>` component tree.
 * The Image component requires terminal capability detection to function properly
 * and will throw an error if the TerminalInfo context is not available.
 *
 * Example usage:
 * ```tsx
 * import React from 'react';
 * import { Box } from 'ink';
 * import { TerminalInfoProvider } from '../context/TerminalInfo.js';
 * import Image from './components/image/index.js';
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
 *         <Image
 *           src="/local/path/image.png"
 *           protocol="sixel"
 *         />
 *       </Box>
 *     </TerminalInfoProvider>
 *   );
 * }
 * ```
 *
 * Features:
 * - Automatic protocol detection and fallback
 * - Support for multiple image formats (PNG, JPEG, WebP, etc.)
 * - Responsive sizing based on parent container dimensions
 * - Error handling with graceful degradation
 * - Terminal capability detection for optimal rendering
 * - Support for both local files and remote URLs
 *
 * Protocol Options:
 * - `sixel`: (experimental) Highest quality, requires Sixel graphics support
 * - `kitty`: (experimental) High quality, requires Kitty graphics support
 * - `iterm2`: (experimental) High quality, requires iTerm2 graphics support
 * - `braille`: High resolution monochrome, requires Unicode support
 * - `halfBlock`: Good color quality, requires Unicode and color support
 * - `ascii`: Universal compatibility, works in all terminals
 *
 * @param props - Image properties including source, dimensions, and initial protocol
 * @returns JSX element rendering the image with the best supported protocol
 * @throws Error if not used within TerminalInfoProvider context
 */
function Image({
  protocol: initialProtocol = "ascii",
  ...props
}: Omit<ImageProps & { protocol?: ImageProtocolName }, "onSupportDetected">) {
  const [protocol, setProtocol] = useState(initialProtocol);

  /**
   * Determines the next fallback protocol based on the current protocol and attempt count.
   *
   * Fallback hierarchy: halfBlock -> braille -> ascii
   *
   * @param currentProtocol - The currently attempted protocol
   * @param attemptCount - Number of fallback attempts made
   * @returns The next protocol to try
   */
  const getFallbackProtocol = useCallback(
    (currentProtocol: ImageProtocolName): ImageProtocolName => {
      switch (currentProtocol) {
        case "kitty":
          return "halfBlock";
        case "iterm2":
          return "halfBlock";
        case "sixel":
          return "halfBlock";
        case "halfBlock":
          return "braille";
        case "braille":
          return "ascii";
        default:
          return "ascii";
      }
    },
    [],
  );

  /**
   * Handles support detection feedback from child components.
   *
   * If the current protocol is supported, marks the support check as complete.
   * If not supported, attempts to fall back to the next protocol in the hierarchy.
   *
   * @param isSupported - Whether the current protocol is supported
   */
  const handleSupportDetected = useCallback(
    (isSupported: boolean) => {
      if (isSupported) {
        // Current protocol is supported
        return;
      }
      // Try fallback protocol
      const nextProtocol = getFallbackProtocol(protocol);
      setProtocol(nextProtocol);
    },
    [protocol, getFallbackProtocol],
  );

  // Reset support check when initial protocol changes
  useEffect(() => {
    setProtocol(initialProtocol);
  }, [initialProtocol]);

  return (
    <ImageRenderer
      protocol={protocol}
      {...props}
      onSupportDetected={handleSupportDetected}
    />
  );
}

export default Image;
