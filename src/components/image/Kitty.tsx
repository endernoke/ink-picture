import React, { useState, useEffect, useRef } from "react";
import { Box, Text, Newline, useStdout, type DOMElement } from "ink";
// import { backgroundContext } from "ink";
import usePosition from "../../hooks/usePosition.js";
import {
  useTerminalDimensions,
  useTerminalCapabilities,
} from "../../context/TerminalInfo.js";
import { type ImageProps } from "./protocol.js";
import { fetchImage, calculateImageSize } from "../../utils/image.js";
import generateKittyId from "../../utils/generateKittyId.js";

/**
 * Kitty Image Rendering Component
 *
 * Displays images using the Kitty terminal graphics protocol, providing the highest quality
 * image rendering in supported terminals. Kitty is a bitmap graphics format that
 * can display true color images at full resolution.
 *
 * Features:
 * - Highest quality image rendering (true color, full resolution)
 * - Supports all image formats
 * - Requires specific terminal support (VT340+, xterm, iTerm2, etc.)
 * - Direct pixel-to-pixel rendering
 *
 * Technical Details:
 * - Uses the Kitty graphics protocol
 * - Renders directly to terminal using escape sequences
 * - Bypasses Ink's normal rendering pipeline for control over image position
 * - Requires careful cursor management
 * - More performant cleanup logic than sixel and iTerm2
 *
 * **EXPERIMENTAL COMPONENT WARNING:**
 * This component does not follow React/Ink's normal rendering lifecycle.
 * It implements custom rendering logic that writes directly to the terminal.
 * While designed to be as React-compatible as possible, you may experience:
 * - Rendering flicker
 * - Cursor positioning issues
 * - Cleanup problems on component unmount
 *
 * How it works:
 * 1. A Box component reserves space in the layout
 * 2. Image is fetched and converted to Kitty format
 * 3. useEffect hook renders image directly to terminal after each Ink render
 * 4. Previous image is cleared before rendering new content
 * 5. Cleanup occurs on component unmount or re-render
 * 6. Cleanup will not be performed when application terminates (so the rendered image is preserved in its location)
 *
 * @param props - Image rendering properties
 * @returns JSX element that manages Kitty image display
 */
function KittyImage(props: ImageProps) {
  const [imageId, setImageId] = useState<number | undefined>(undefined);
  const [hasError, setHasError] = useState<boolean>(false);
  const { stdout } = useStdout();
  const containerRef = useRef<DOMElement | null>(null);
  const componentPosition = usePosition(containerRef);
  const terminalDimensions = useTerminalDimensions();
  const terminalCapabilities = useTerminalCapabilities();
  const {
    src,
    onSupportDetected,
    width: propsWidth,
    height: propsHeight,
  } = props;

  // Detect support and notify parent
  useEffect(() => {
    if (!terminalCapabilities) return;

    // Kitty rendering requires explicit kitty graphics support
    const isSupported = terminalCapabilities.supportsKittyGraphics;
    onSupportDetected?.(isSupported);
  }, [terminalCapabilities, onSupportDetected]);

  // TODO: If we upgrade to Ink 6 we will need to deal with Box background colors when rendering/cleaning up
  // const inheritedBackgroundColor = useContext(backgroundContext);

  /**
   * Main effect for image processing and Kitty conversion.
   *
   * This effect:
   * 1. Fetches and processes the source image
   * 2. Calculates appropriate sizing based on terminal dimensions
   * 3. Resizes image to fit within the component's allocated space
   * 4. Transfers image data to the terminal using Kitty protocol
   */
  useEffect(
    () => {
      const generateImageOutput = async () => {
        if (!componentPosition) return;
        if (!terminalDimensions) return;

        const image = await fetchImage(src);
        if (!image) {
          setHasError(true);
          return;
        }
        setHasError(false);

        const metadata = await image.metadata();

        const { width: maxWidth, height: maxHeight } = componentPosition;
        const { width, height } = calculateImageSize({
          maxWidth: maxWidth * terminalDimensions.cellWidth,
          maxHeight: maxHeight * terminalDimensions.cellHeight,
          originalAspectRatio: metadata.width / metadata.height,
          specifiedWidth: propsWidth
            ? propsWidth * terminalDimensions.cellWidth
            : undefined,
          specifiedHeight: propsHeight
            ? propsHeight * terminalDimensions.cellHeight
            : undefined,
        });

        const resizedImage = image.resize(width, height);

        try {
          const imageId = generateKittyId();

          const data = await resizedImage.png().toBuffer();
          const chunkSize = 4096; // Kitty protocol pixel data max chunk size
          const base64Data = data.toString("base64");

          const firstChunk = base64Data.slice(0, chunkSize);
          // f=100: transmit png data; t=d: direct transfer; i=image-id;
          // m=1: more chunks follow; q=2: suppress terminal response
          stdout.write(
            `\x1b_Gf=100,t=d,i=${imageId},m=1,q=2;${firstChunk}\x1b\\`,
          );
          let bufferOffset = chunkSize;
          while (bufferOffset < base64Data.length - chunkSize) {
            const chunk = base64Data.slice(
              bufferOffset,
              bufferOffset + chunkSize,
            );
            bufferOffset += chunkSize;
            stdout.write(`\x1b_Gm=1,q=2;${chunk}\x1b\\`);
          }
          const lastChunk = base64Data.slice(bufferOffset);
          stdout.write(`\x1b_Gm=0,q=2;${lastChunk}\x1b\\`);

          // Set image ID only after all data are sent
          setImageId(imageId);
        } catch {
          setHasError(true);
          return;
        }
      };
      generateImageOutput();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      src,
      propsWidth,
      propsHeight,
      componentPosition?.width,
      componentPosition?.height,
      terminalDimensions,
    ],
  );

  /**
   * Critical rendering effect for Kitty image display.
   *
   * This effect runs after every re-render to display the Kitty image because
   * Ink overwrites the terminal content with each render cycle. This is a
   * necessary workaround for the current Ink architecture.
   *
   * Process:
   * 1. Validates that image and position data are available
   * 2. Positions cursor to the correct location
   * 3. Tells terminal to display the Kitty image at that position
   * 4. Restores cursor position
   *
   * Cursor Management:
   * - Moves cursor up to component position
   * - Moves cursor right to correct column
   * - Writes image data
   * - Moves cursor back down to original position
   *
   * TODO: This may change when Ink implements incremental rendering
   */
  useEffect(() => {
    if (!imageId) return;
    if (!componentPosition) return;

    // NOTE: technically we don't need to save/restore cursor position
    // assuming that the terminal implements the kitty protocol correctly
    // but some terminals do not respect the 'C=1' parameter
    stdout.write("\x1b7"); // Save cursor position
    stdout.write(cursorUp(componentPosition.appHeight - componentPosition.row));
    stdout.write("\r");
    stdout.write(cursorForward(componentPosition.col));

    const placementId = 1; // We only have one image per component instance
    // a=p: place image; i=image-id; p=placement-id; C=1: do not move cursor;
    // q=2: supress terminal response (don't write to stdin)
    stdout.write(`\x1b_Ga=p,i=${imageId},p=${placementId},C=1,q=2\x1b\\`);

    stdout.write("\x1b8"); // Restore cursor position

    // We do not clean up on rerenders because
    // kitty manages replacing images with the
    // same image id and placement ID without any flicker
  });

  // Cleanup effect to remove Kitty image on unmount or image change only
  useEffect(() => {
    return () => {
      if (!imageId) return;

      // a=d: delete image; d=I: remove image data from storage; i=image-id
      stdout.write(`\x1b_Ga=d,d=I,i=${imageId}\x1b\\`);
    };
  }, [imageId, stdout]);

  return (
    <Box ref={containerRef} flexDirection="column" flexGrow={1}>
      {imageId ? (
        <Text color="gray" wrap="wrap">
          {props.alt || "Loading..."}
        </Text>
      ) : (
        <Box flexDirection="column" alignItems="center" justifyContent="center">
          {hasError && (
            <Text color="red">
              X<Newline />
              Load failed
            </Text>
          )}
          <Text color="gray">{props.alt || "Loading..."}</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Moves cursor forward (right) by specified number of columns.
 * @param count - Number of columns to move forward (default: 1)
 * @returns ANSI escape sequence string
 */
function cursorForward(count: number = 1) {
  return "\x1b[" + count + "C";
}

/**
 * Moves cursor up by specified number of rows.
 * @param count - Number of rows to move up (default: 1)
 * @returns ANSI escape sequence string
 */
function cursorUp(count: number = 1) {
  return "\x1b[" + count + "A";
}

export default KittyImage;
