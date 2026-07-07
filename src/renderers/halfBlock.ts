import chalk from "chalk";
import bgColorize from "../utils/bgColorize.js";
import type { PixelData } from "./types.js";

const HALF_BLOCK = "\u2584";

export function renderHalfBlock(
  pixels: PixelData,
  options: { bgColor?: string } = {},
): string {
  const { data, info } = pixels;
  const { width, height, channels } = info;

  let result = "";
  for (let y = 0; y < height - 1; y += 2) {
    for (let x = 0; x < width; x++) {
      const topPixelIndex = (y * width + x) * channels;
      const bottomPixelIndex = ((y + 1) * width + x) * channels;

      const r = data[topPixelIndex] as number;
      const g = data[topPixelIndex + 1] as number;
      const b = data[topPixelIndex + 2] as number;
      const a = channels === 4 ? (data[topPixelIndex + 3] as number) : 255;

      const r2 = data[bottomPixelIndex] as number;
      const g2 = data[bottomPixelIndex + 1] as number;
      const b2 = data[bottomPixelIndex + 2] as number;

      result +=
        a === 0
          ? options.bgColor
            ? bgColorize(" ", options.bgColor)
            : chalk.reset(" ")
          : chalk.bgRgb(r, g, b).rgb(r2, g2, b2)(HALF_BLOCK);
    }

    result += "\n";
  }

  return result.slice(0, -1);
}
