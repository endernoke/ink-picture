import {
  Box,
  type DOMElement,
  measureElement,
  Newline,
  Text,
  useStdout,
} from "ink";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTerminalInfo } from "../../context/TerminalInfo.js";
import usePosition from "../../hooks/usePosition.js";
import {
  makeKittyDeletion,
  makeKittyPlacement,
  makeKittyTransmitChunks,
} from "../../renderers/kitty.js";
import { cursorForward, cursorUp } from "../../utils/ansiEscapes.js";
import generateKittyId from "../../utils/generateKittyId.js";
import { calculateImageSize, fetchImage } from "../../utils/image.js";
import type { ImageProps } from "./protocol.js";

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
  const terminalInfo = useTerminalInfo();
  const shouldCleanupRef = useRef<boolean>(true);
  const { src, width, height, alt, allowPartial } = props;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // TODO: If we upgrade to Ink 6 we will need to deal with Box background colors when rendering/cleaning up
  // const inheritedBackgroundColor = useContext(backgroundContext);

  const needsMeasure = typeof width === "string" || typeof height === "string";
  useEffect(() => {
    if (!needsMeasure) return;
    if (!containerRef.current) return;

    const { width: w, height: h } = measureElement(containerRef.current);
    if (w > 0) setMeasuredWidth(w);
    if (h > 0) setMeasuredHeight(h);
  });

  const resolvedWidth = typeof width === "number" ? width : measuredWidth;
  const resolvedHeight = typeof height === "number" ? height : measuredHeight;

  /**
   * Main effect for image processing and Kitty conversion.
   *
   * This effect:
   * 1. Fetches and processes the source image
   * 2. Calculates appropriate sizing based on terminal dimensions
   * 3. Resizes image to fit within the component's allocated space
   * 4. Transfers image data to the terminal using Kitty protocol
   */
  useEffect(() => {
    if (resolvedWidth === 0 || resolvedHeight === 0) return;
    if (!terminalInfo) return;

    const generateImageOutput = async () => {
      const image = await fetchImage(src, allowPartial);
      if (!image) {
        setHasError(true);
        return;
      }
      setHasError(false);

      image.resize({
        w: resolvedWidth * terminalInfo.cellWidth,
        h: resolvedHeight * terminalInfo.cellHeight,
      });

      try {
        const imageId = generateKittyId();

        const data = await image.getBuffer("image/png");
        const base64Data = data.toString("base64");

        const chunks = makeKittyTransmitChunks(imageId, base64Data);
        for (const chunk of chunks) {
          stdout.write(chunk);
        }

        // Set image ID only after all data are sent
        setImageId(imageId);
      } catch {
        setHasError(true);
        return;
      }
    };
    generateImageOutput();
  }, [
    src,
    resolvedWidth,
    resolvedHeight,
    terminalInfo,
    allowPartial,
    stdout.write,
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
  const onExit = useCallback(() => {
    shouldCleanupRef.current = false;
  }, []);
  const onSigInt = useCallback(() => {
    shouldCleanupRef.current = false;
    process.exit();
  }, []);
  useEffect(() => {
    if (!imageId) return;
    if (!componentPosition) return;
    if (
      stdout.rows - componentPosition.appHeight + componentPosition.row < 0 ||
      componentPosition.col > stdout.columns
    ) {
      return;
    }

    // NOTE: technically we don't need to save/restore cursor position
    // assuming that the terminal implements the kitty protocol correctly
    // but some terminals do not respect the 'C=1' parameter
    stdout.write("\x1b7"); // Save cursor position
    stdout.write(
      cursorUp(componentPosition.appHeight - componentPosition.row, {
        appHeight: componentPosition.appHeight,
        terminalHeight: stdout.rows,
      }),
    );
    stdout.write("\r");
    stdout.write(cursorForward(componentPosition.col));

    const placementId = 1;
    stdout.write(makeKittyPlacement(imageId, placementId));

    stdout.write("\x1b8"); // Restore cursor position

    // We do not clean up on rerenders because
    // kitty manages replacing images with the
    // same image id and placement ID without any flicker
  });

  // Cleanup effect to remove Kitty image on unmount or image change only
  useEffect(() => {
    process.on("exit", onExit);
    process.on("SIGINT", onSigInt);
    process.on("SIGTERM", onSigInt);

    return () => {
      process.removeListener("exit", onExit);
      process.removeListener("SIGINT", onSigInt);
      process.removeListener("SIGTERM", onSigInt);
      if (!shouldCleanupRef.current) return;
      if (!imageId) return;

      stdout.write(makeKittyDeletion(imageId));
    };
  }, [imageId, stdout, onExit, onSigInt]);

  return (
    <Box
      ref={containerRef}
      flexDirection="column"
      width={width}
      height={height}
    >
      {imageId ? (
        <Text color="gray" wrap="wrap">
          {alt ?? "Loading..."}
        </Text>
      ) : (
        <Box flexDirection="column" alignItems="center" justifyContent="center">
          {alt ? (
            <Text color="gray">{alt}</Text>
          ) : hasError ? (
            <Text color="red">
              X<Newline />
              Load failed
            </Text>
          ) : (
            <Text color="gray">{props.alt || "Loading..."}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default KittyImage;
