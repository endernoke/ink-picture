import { Box, type DOMElement, measureElement, Newline, Text } from "ink";
import React, { useEffect, useRef, useState } from "react";
import { renderHalfBlock } from "../../renderers/halfBlock.js";
import { fetchImage, getRawPixels } from "../../utils/image.js";
import type { ImageProps } from "./protocol.js";

/**
 * Half-Block Image Rendering Component
 *
 * Renders images using Unicode half-block characters (▄) with colored backgrounds and foregrounds.
 * This method provides higher resolution than ASCII art by utilizing both the character color
 * and background color to represent two pixels per character cell.
 *
 * Features:
 * - Higher resolution than ASCII (2 pixels per character)
 * - Full color support using terminal RGB colors
 * - Requires Unicode and color support
 * - Good balance between quality and compatibility
 *
 * Technical Details:
 * - Uses Unicode half-block character (U+2584 ▄)
 * - Top pixel represented by background color
 * - Bottom pixel represented by foreground color
 * - Requires terminal color and Unicode support
 * - Processes images in pairs of vertical pixels
 *
 * @param props - Image rendering properties
 * @returns JSX element containing half-block representation of the image
 */
function HalfBlockImage(props: ImageProps) {
  const [imageOutput, setImageOutput] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const containerRef = useRef<DOMElement | null>(null);
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

      image.resize({ w: resolvedWidth, h: resolvedHeight * 2 });
      const resizedImage = await getRawPixels(image);

      const output = renderHalfBlock(resizedImage);
      setImageOutput(output);
    };
    generateImageOutput();
  }, [src, resolvedWidth, resolvedHeight, allowPartial]);

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
            <Text color="gray">{props.alt || "Loading..."}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default HalfBlockImage;
