import type { PixelData } from "./types.js";

export function renderBraille(pixels: PixelData): string {
  const { data, info } = pixels;
  const { width, height, channels } = info;

  let result = "";
  for (let y = 0; y < height - 3; y += 4) {
    for (let x = 0; x < width - 1; x += 2) {
      const dot1Index = (y * width + x) * channels;
      const dot2Index = ((y + 1) * width + x) * channels;
      const dot3Index = ((y + 2) * width + x) * channels;
      const dot4Index = (y * width + x + 1) * channels;
      const dot5Index = ((y + 1) * width + x + 1) * channels;
      const dot6Index = ((y + 2) * width + x + 1) * channels;
      const dot7Index = ((y + 3) * width + x) * channels;
      const dot8Index = ((y + 3) * width + x + 1) * channels;

      const getRgba = (index: number) => {
        const r = data[index] as number;
        const g = data[index + 1] as number;
        const b = data[index + 2] as number;
        const a = channels === 4 ? (data[index + 3] as number) : 1;
        return { r, g, b, a };
      };

      const dot1 = rgbaToBlackOrWhite(getRgba(dot1Index));
      const dot2 = rgbaToBlackOrWhite(getRgba(dot2Index));
      const dot3 = rgbaToBlackOrWhite(getRgba(dot3Index));
      const dot4 = rgbaToBlackOrWhite(getRgba(dot4Index));
      const dot5 = rgbaToBlackOrWhite(getRgba(dot5Index));
      const dot6 = rgbaToBlackOrWhite(getRgba(dot6Index));
      const dot7 = rgbaToBlackOrWhite(getRgba(dot7Index));
      const dot8 = rgbaToBlackOrWhite(getRgba(dot8Index));

      const brailleChar = String.fromCharCode(
        0x2800 +
          (dot8 << 7) +
          (dot7 << 6) +
          (dot6 << 5) +
          (dot5 << 4) +
          (dot4 << 3) +
          (dot3 << 2) +
          (dot2 << 1) +
          dot1,
      );
      result += brailleChar;
    }
    result += "\n";
  }

  return result.slice(0, -1);
}

function rgbaToBlackOrWhite({
  r,
  g,
  b,
  a,
}: {
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  const alpha = a / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const alphaAdjustedLuminance = luminance * alpha + 255 * (1 - alpha);

  if (alphaAdjustedLuminance > 128) {
    return 1;
  }
  return 0;
}
