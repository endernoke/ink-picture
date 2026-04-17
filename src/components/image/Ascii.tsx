import chalk from "chalk";
import { Box, type DOMElement, measureElement, Newline, Text } from "ink";
import React, { useEffect, useRef, useState } from "react";
import type sharp from "sharp";
import { useTerminalCapabilities } from "../../context/TerminalInfo.js";
import { fetchImage } from "../../utils/image.js";
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
  const terminalCapabilities = useTerminalCapabilities();
  const { src, width, height, alt, allowPartial } = props;

  useEffect(() => {
    const generateImageOutput = async () => {
      const image = await fetchImage(src, allowPartial);
      if (!image) {
        setHasError(true);
        return;
      }
      setHasError(false);

      const resizedImage = await image
        .resize(width, height, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const output = await toAscii(
        resizedImage,
        terminalCapabilities?.supportsColor,
      );
      setImageOutput(output);
    };
    generateImageOutput();
  }, [src, width, height, terminalCapabilities, allowPartial]);

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

async function toAscii(
  imageData: {
    data: Buffer;
    info: sharp.OutputInfo;
  },
  colored: boolean = true,
) {
  const { data, info } = imageData;
  const { width, height, channels } = info;

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
      const intensity = r + g + b + a === 0 ? 0 : (r + g + b + a) / (255 * 4);
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
