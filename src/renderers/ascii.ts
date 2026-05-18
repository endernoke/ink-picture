import chalk from "chalk";
import type { PixelData } from "./types.js";

const ASCII_CHARS =
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

export function renderAscii(
  pixels: PixelData,
  options: { colored?: boolean } = {},
): string {
  const { data, info } = pixels;
  const { width, height, channels } = info;
  const colored = options.colored ?? true;

  let result = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * channels;

      const r = data[pixelIndex] as number;
      const g = data[pixelIndex + 1] as number;
      const b = data[pixelIndex + 2] as number;
      const a = channels === 4 ? (data[pixelIndex + 3] as number) : 255;

      const sum = r + g + b + a;
      const intensity = sum === 0 ? 0 : sum / (255 * 4);
      const char =
        ASCII_CHARS[
          ASCII_CHARS.length -
            1 -
            Math.floor(intensity * (ASCII_CHARS.length - 1))
        ];

      result += colored ? chalk.rgb(r, g, b)(char) : char;
    }

    result += "\n";
  }

  return result.slice(0, -1);
}
