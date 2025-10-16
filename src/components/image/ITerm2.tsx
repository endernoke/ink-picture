import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Box, Text, Newline, useStdout, type DOMElement } from "ink";
// import { backgroundContext } from "ink";
import usePosition from "../../hooks/usePosition.js";
import {
  useTerminalDimensions,
  useTerminalCapabilities,
} from "../../context/TerminalInfo.js";
import { type ImageProps } from "./protocol.js";
import { fetchImage, calculateImageSize } from "../../utils/image.js";
import sharp from "sharp";

/**
 * ITerm2 Image Rendering Component
 *
 * Displays images using the ITerm2 graphics protocol, providing the highest quality
 * image rendering in supported terminals. ITerm2 is a bitmap graphics format that
 * can display true color images at full resolution.
 *
 * Features:
 * - Highest quality image rendering (true color, full resolution)
 * - Supports all image formats
 * - Requires specific terminal support (VT340+, xterm, iTerm2, etc.)
 * - Direct pixel-to-pixel rendering
 *
 * Technical Details:
 * - Uses the ITerm2 graphics protocol
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
 * 2. Image is fetched and converted to ITerm2 format
 * 3. useEffect hook renders image directly to terminal after each Ink render
 * 4. Previous image is cleared before rendering new content
 * 5. Cleanup occurs on component unmount or re-render
 * 6. Cleanup will not be performed when application terminates (so the rendered image is preserved in its location)
 *
 * @param props - Image rendering properties
 * @returns JSX element that manages ITerm2 image display
 */
function ITerm2Image(props: ImageProps) {
  const [imageOutput, setImageOutput] = useState<string | undefined>(undefined);
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

    // ITerm2 rendering requires explicit iTerm2 graphics support
    const isSupported = terminalCapabilities.supportsITerm2Graphics;
    props.onSupportDetected?.(isSupported);
  }, [terminalCapabilities, props.onSupportDetected]);

  // TODO: If we upgrade to Ink 6 we will need to deal with Box background colors when rendering/cleaning up
  // const inheritedBackgroundColor = useContext(backgroundContext);

  /**
   * Main effect for image processing and ITerm2 conversion.
   *
   * This effect:
   * 1. Fetches and processes the source image
   * 2. Calculates appropriate sizing based on terminal dimensions
   * 3. Resizes image to fit within the component's allocated space
   * 4. Ensures alpha channel is present (required by node-iTerm2)
   * 5. Converts processed image data to ITerm2 format
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

      const resizedImage = await image
        .png() // iTerm2 expects a FILE, not raw pixel data
        .toBuffer({ resolveWithObject: true });
      setActualSizeInCells({
        width: Math.ceil(
          resizedImage.info.width / terminalDimensions.cellWidth,
        ),
        height: Math.ceil(
          resizedImage.info.height / terminalDimensions.cellHeight,
        ),
      });

      const output = toITerm2(resizedImage, { width, height });
      setImageOutput(output);
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
   * Critical rendering effect for ITerm2 image display.
   *
   * This effect runs after every re-render to display the ITerm2 image because
   * Ink overwrites the terminal content with each render cycle. This is a
   * necessary workaround for the current Ink architecture.
   *
   * Process:
   * 1. Validates that image and position data are available
   * 2. Checks if the image would be visible within terminal bounds
   * 3. Sets up process exit handlers for cleanup
   * 4. Positions cursor to the correct location
   * 5. Writes ITerm2 data directly to stdout
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
  useLayoutEffect(() => {
    if (!imageOutput) return;
    if (!componentPosition) return;
    if (
      stdout.rows - componentPosition.appHeight + componentPosition.row < 0 ||
      componentPosition.col > stdout.columns
    )
      return;

    function onExit() {
      shouldCleanupRef.current = false;
    }
    function onSigInt() {
      shouldCleanupRef.current = false;
      process.exit();
    }
    process.on("exit", onExit);
    process.on("SIGINT", onSigInt);
    process.on("SIGTERM", onSigInt);

    let previousRenderBoundingBox:
      | { row: number; col: number; width: number; height: number }
      | undefined = undefined;
    const renderTimeout = setTimeout(() => {
      stdout.write("\x1b7"); // Save cursor position
      stdout.write(
        cursorUp(componentPosition.appHeight - componentPosition.row),
      );
      stdout.write("\r");
      stdout.write(cursorForward(componentPosition.col));
      stdout.write(imageOutput);
      stdout.write("\x1b8"); // Restore cursor position

      previousRenderBoundingBox = {
        row: stdout.rows - componentPosition.appHeight + componentPosition.row,
        col: componentPosition.col,
        width: actualSizeInCells!.width,
        height: actualSizeInCells!.height,
      };
    }, 100); // Delay to allow Ink/terminal to finish its render

    return () => {
      process.removeListener("exit", onExit);
      process.removeListener("SIGINT", onSigInt);
      process.removeListener("SIGTERM", onSigInt);

      if (!shouldCleanupRef.current) return;
      clearTimeout(renderTimeout);
      // If we never rendered the image, nothing to clean up
      if (!previousRenderBoundingBox) return;

      stdout.write("\x1b7"); // Save cursor position
      stdout.write(
        cursorUp(componentPosition.appHeight - componentPosition.row),
      );
      for (let i = 0; i < previousRenderBoundingBox.height; i++) {
        stdout.write("\r");
        stdout.write(cursorForward(previousRenderBoundingBox.col));
        // if (inheritedBackgroundColor) {
        //   const bgColor = "bg" + toProper(inheritedBackgroundColor);
        //   stdout.write(
        //     chalk[bgColor](" ".repeat(previousRenderBoundingBox.width) + "\n"),
        //   );
        // } else {
        stdout.write(" ".repeat(previousRenderBoundingBox.width));
        stdout.write("\n");
        // }
      }
      stdout.write("\x1b8"); // Restore cursor position
    };
    // }, [imageOutput, ...Object.values(componentPosition)]);
  });

  return (
    <Box ref={containerRef} flexDirection="column" flexGrow={1}>
      {imageOutput ? (
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
 * Converts processed image data to ITerm2 format.
 *
 * This function takes raw RGBA image data from Sharp and converts it to
 * the ITerm2 graphics format using the node-iTerm2 library. The resulting
 * string contains escape sequences that can be written directly to a
 * terminal that supports ITerm2 graphics.
 *
 * @note We do not use auto width and height because we might adjust it based on scale factor
 *
 * @param imageData - Raw image data with buffer and metadata from Sharp
 * @returns ITerm2-formatted string
 */
function toITerm2(
  imageData: { data: Buffer; info: sharp.OutputInfo },
  options: { width: number; height: number },
) {
  const { data, info } = imageData;
  const { width, height } = options;

  const iTerm2Data =
    "\x1b]1337;File=" +
    `size=${info.size};` +
    `width=${width}px;height=${height}px;` +
    `preserveAspectRatio=1;` +
    `inline=1:` +
    data.toString("base64") +
    "\x07";
  return iTerm2Data;
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

export default ITerm2Image;
