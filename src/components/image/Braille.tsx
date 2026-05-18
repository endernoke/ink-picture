import { Box, type DOMElement, measureElement, Newline, Text } from "ink";
import React, { useEffect, useRef, useState } from "react";
import { renderBraille } from "../../renderers/braille.js";
import {
  calculateImageSize,
  fetchImage,
  getRawPixels,
} from "../../utils/image.js";
import type { ImageProps } from "./protocol.js";

/**
 * Braille Image Rendering Component
 *
 * Renders images using Unicode Braille patterns to create high-resolution monochrome representations.
 * Each Braille character can represent 8 pixels (2x4 grid), providing higher resolution than
 * other text-based rendering methods.
 *
 * Features:
 * - High resolution monochrome rendering (8 pixels per character)
 * - Uses Unicode Braille patterns (U+2800-U+28FF)
 * - Requires only Unicode support (no color needed)
 * - Good for detailed images and line art
 * - Works well for images with clear contrast
 *
 * Technical Details:
 * - Each Braille character represents a 2x4 pixel grid
 * - Uses luminance-based threshold for black/white conversion
 * - Handles transparency by treating transparent pixels as white
 * - Braille patterns are constructed using bit manipulation
 *
 * Braille Pattern Layout:
 * ```
 * 1 4
 * 2 5
 * 3 6
 * 7 8
 * ```
 *
 * @param props - Image rendering properties
 * @returns JSX element containing Braille pattern representation of the image
 */
function BrailleImage(props: ImageProps) {
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

      image.resize({ w: resolvedWidth * 2, h: resolvedHeight * 4 });
      const resizedImage = await getRawPixels(image);

      const output = renderBraille(resizedImage);
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
            <Text color="gray">Loading...</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default BrailleImage;
