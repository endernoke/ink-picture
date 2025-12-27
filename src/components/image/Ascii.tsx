import React, { useState, useEffect, useRef } from "react";
import { Box, Text, Newline, measureElement, type DOMElement } from "ink";
import chalk from "chalk";
import { type ImageProps } from "./protocol.js";
import { fetchImage, calculateImageSize } from "../../utils/image.js";
import { useTerminalCapabilities } from "../../context/TerminalInfo.js";

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
  const terminalCapabilities = useTerminalCapabilities();
  const {
    onSupportDetected,
    src,
    width: propsWidth,
    height: propsHeight,
  } = props;

  // Detect support and notify parent
  useEffect(() => {
    if (!terminalCapabilities) return;

    // ASCII rendering works in all terminals, but colored ASCII requires color support
    // Inclusion of color support is dynamically handled by conversion logic
    const isSupported = true; // ASCII always works as fallback
    onSupportDetected(isSupported);
  }, [onSupportDetected, terminalCapabilities]);

  useEffect(() => {
    const generateImageOutput = async () => {
      const image = await fetchImage(src);
      if (!image) {
        setHasError(true);
        return;
      }
      setHasError(false);

      if (!containerRef.current) return;
      const { width: maxWidth, height: maxHeight } = measureElement(
        containerRef.current,
      );

      // Calculate target size - ASCII art is character-based, so we don't need to scale original sizes
      const { width, height } = calculateImageSize({
        maxWidth,
        maxHeight,
        originalAspectRatio: image.width / (image.height / 2),
        specifiedWidth: propsWidth,
        specifiedHeight: propsHeight ? propsHeight / 2 : undefined,
      });

      // resized in place
      image.scaleToFit({ w: width, h: height });

      // TODO: LEO: ask for thoughts on hard coding this, assuming intepreting as jpeg is fine
      const data = await image.getBuffer("image/jpeg");

      const output = await toAscii(
        data,
        width,
        height,
        // TODO: LEO: need to dig deeper in this,  assuming always 3 channels used by jimp (RGB), still not sure if this is correct
        3,
        terminalCapabilities?.supportsColor,
      );

      setImageOutput(output);
    };
    generateImageOutput();
  }, [src, propsWidth, propsHeight, terminalCapabilities]);

  return (
    <Box ref={containerRef} flexDirection="column" flexGrow={1}>
      {imageOutput ? (
        imageOutput
          .split("\n")
          .map((line, index) => <Text key={index}>{line}</Text>)
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

async function toAscii(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  colored: boolean = true,
) {
  // ascii characters ordered by brightness
  const ascii_chars =
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

  let result = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * channels;

      const r = data[pixelIndex] as number;
      const g = data[pixelIndex + 1] as number;
      const b = data[pixelIndex + 2] as number;
      const a = channels === 4 ? (data[pixelIndex + 3] as number) : 255;

      // this is different from perceived luminance
      const intensity = r + g + b + a == 0 ? 0 : (r + g + b + a) / (255 * 4);
      const pixel_char =
        ascii_chars[
          ascii_chars.length -
            1 -
            Math.floor(intensity * (ascii_chars.length - 1))
        ];

      result += colored ? chalk.rgb(r, g, b)(pixel_char) : pixel_char;
    }

    result += "\n";
  }

  return result;
}

export default AsciiImage;
