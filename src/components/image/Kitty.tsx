import React, { useState, useEffect, useRef } from "react";
import { Box, Text, Newline, useStdout, type DOMElement } from "ink";
// import { backgroundContext } from "ink";
import usePosition from "../../hooks/usePosition.js";
import {
  useTerminalDimensions,
  useTerminalCapabilities,
} from "../../context/TerminalInfo.js";
import { type ImageProps } from "./protocol.js";
import sharp from "sharp";
import { fetchImage, calculateImageSize } from "../../utils/image.js";
import generateKittyId from "../../utils/generateKittyId.js";
import tmp from "tmp";
import { image } from "ansi-escapes";
import fs from "fs";

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
 * - Requires careful cursor management and cleanup
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
  const [actualSizeInCells, setActualSizeInCells] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const shouldCleanupRef = useRef<boolean>(true);

  // Detect support and notify parent
  useEffect(() => {
    if (!terminalCapabilities) return;

    // Kitty rendering requires explicit kitty graphics support
    const isSupported = terminalCapabilities.supportsKittyGraphics;
    props.onSupportDetected?.(isSupported);
  }, [terminalCapabilities, props.onSupportDetected]);

  // TODO: If we upgrade to Ink 6 we will need to deal with Box background colors when rendering/cleaning up
  // const inheritedBackgroundColor = useContext(backgroundContext);

  /**
   * Main effect for image processing and Kitty conversion.
   *
   * This effect:
   * 1. Fetches and processes the source image
   * 2. Calculates appropriate sizing based on terminal dimensions
   * 3. Resizes image to fit within the component's allocated space
   * 4. Ensures alpha channel is present (required by node-kitty)
   * 5. Converts processed image data to Kitty format
   * 6. Tracks actual size in terminal cells for cleanup purposes
   */
  useEffect(() => {
    const generateImageOutput = async () => {
      if (!componentPosition) return;
      if (!terminalDimensions) return;

      const image = await fetchImage(props.src);
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
        specifiedWidth: props.width
          ? props.width * terminalDimensions.cellWidth
          : undefined,
        specifiedHeight: props.height
          ? props.height * terminalDimensions.cellHeight
          : undefined,
      });

      const resizedImage = image.resize(width, height);
      const resizedMetadata = await resizedImage.metadata();

      setActualSizeInCells({
        width: Math.floor(resizedMetadata.width / terminalDimensions.cellWidth),
        height: Math.floor(
          resizedMetadata.height / terminalDimensions.cellHeight,
        ),
      });

      try {
        const tmpImageFile = tmp.fileSync({
          prefix: "ink-picture.tty-graphics-protocol.",
          postfix: ".png",
        });
        await resizedImage.png().toFile(tmpImageFile.name);

        // Transfer pixel data to terminal
        const imageId = generateKittyId();
        stdout.write(
          `\x1b_Gf=100,t=t,i=${imageId},q=2;${Buffer.from(tmpImageFile.name).toString("base64")}\x1b\\`,
        );
        setImageId(imageId);
      } catch {
        setHasError(true);
        return;
      }
    };
    generateImageOutput();
  }, [
    props.src,
    props.width,
    props.height,
    componentPosition?.width,
    componentPosition?.height,
    terminalDimensions,
  ]);

  /**
   * Critical rendering effect for Kitty image display.
   *
   * This effect runs after every re-render to display the Kitty image because
   * Ink overwrites the terminal content with each render cycle. This is a
   * necessary workaround for the current Ink architecture.
   *
   * Process:
   * 1. Validates that image and position data are available
   * 2. Checks if the image would be visible within terminal bounds
   * 3. Sets up process exit handlers for cleanup
   * 4. Positions cursor to the correct location
   * 5. Writes Kitty data directly to stdout
   * 6. Restores cursor position
   * 7. Returns cleanup function for previous render cleanup
   *
   * Cursor Management:
   * - Moves cursor up to component position
   * - Moves cursor right to correct column
   * - Writes image data
   * - Moves cursor back down to original position
   *
   * Cleanup Strategy:
   * - Tracks previous render bounding box
   * - Clears previous image by writing spaces
   * - Handles process exit gracefully
   *
   * TODO: This may change when Ink implements incremental rendering
   */
  useEffect(() => {
    if (!imageId) return;
    if (!componentPosition) return;

    stdout.write(cursorUp(componentPosition.appHeight - componentPosition.row));
    stdout.write("\r");
    stdout.write(cursorForward(componentPosition.col));

    const placementId = 1; // We only have one image per component instance
    stdout.write(`\x1b_Ga=p,i=${imageId},p=${placementId},C=1,q=2\x1b\\`);

    stdout.write(
      cursorDown(componentPosition.appHeight - componentPosition.row),
    );
    stdout.write("\r");

    // We do not clean up on rerenders
    // because kitty manages replacing
    // images with the same placement ID
  });

  // Cleanup effect to remove Kitty image on unmount or image change only
  useEffect(() => {
    return () => {
      if (!imageId) return;
      if (!shouldCleanupRef.current) return;

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

/**
 * Moves cursor down by specified number of rows.
 * @param count - Number of rows to move down (default: 1)
 * @returns ANSI escape sequence string
 */
function cursorDown(count: number = 1) {
  return "\x1b[" + count + "B";
}

export default KittyImage;
