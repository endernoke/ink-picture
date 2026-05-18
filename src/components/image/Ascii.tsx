import { Box, type DOMElement, measureElement, Newline, Text } from "ink";
import React, { useEffect, useRef, useState } from "react";
import { useTerminalInfo } from "../../context/TerminalInfo.js";
import { renderAscii } from "../../renderers/ascii.js";
import { fetchImage, getRawPixels } from "../../utils/image.js";
import type { ImageProps } from "./protocol.js";

/**
 * ASCII Image Rendering Component
 *
 * Converts images to ASCII art using character-based representation.
 * This is the most compatible rendering method as it works in all terminals.
 *
 * Features:
 * - Works in all terminal environments (fallback protocol)
 * - Supports both monochrome and colored ASCII art
 * - Automatic color detection based on terminal capabilities
 *
 * Technical Details:
 * - Uses the 'ascii-art' library for image-to-ASCII conversion
 * - Applies image preprocessing (sharpening, normalization) for better results
 * - Color support is automatically detected and applied when available
 * - Temporary files are created and cleaned up during conversion
 *
 * @param props - Image rendering properties
 * @returns JSX element containing ASCII art representation of the image
 */
function AsciiImage(props: ImageProps) {
  const [imageOutput, setImageOutput] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const containerRef = useRef<DOMElement | null>(null);
  const terminalInfo = useTerminalInfo();
  const { src, width, height, alt, allowPartial } = props;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

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

  useEffect(() => {
    if (resolvedWidth === 0 || resolvedHeight === 0) return;

    const generateImageOutput = async () => {
      const image = await fetchImage(src, allowPartial);
      if (!image) {
        setHasError(true);
        return;
      }
      setHasError(false);

      image.resize({ w: resolvedWidth, h: resolvedHeight });
      const resizedImage = await getRawPixels(image);

      const output = renderAscii(resizedImage, {
        colored: terminalInfo?.supportsColor,
      });
      setImageOutput(output);
    };
    generateImageOutput();
  }, [
    src,
    resolvedWidth,
    resolvedHeight,
    terminalInfo?.supportsColor,
    allowPartial,
  ]);

  return (
    <Box
      ref={containerRef}
      flexDirection="column"
      width={width}
      height={height}
    >
      {imageOutput ? (
        imageOutput
          .split("\n")
          // biome-ignore lint/suspicious/noArrayIndexKey: static content, won't change
          .map((line, idx) => <Text key={`${line}-${idx}`}>{line}</Text>)
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
            <Text color="gray">Loading...</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default AsciiImage;
