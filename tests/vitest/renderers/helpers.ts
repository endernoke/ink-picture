import { Jimp } from "jimp";
import type { PixelData } from "../../../src/renderers/types.js";

export function makePixelData(
  width: number,
  height: number,
  fillColor: (x: number, y: number) => [number, number, number, number],
): PixelData {
  const channels = 4;
  const data = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fillColor(x, y);
      const i = (y * width + x) * channels;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  return {
    data,
    info: { width, height, channels },
  };
}

export function solidColor(
  r: number,
  g: number,
  b: number,
  a = 255,
): (x: number, y: number) => [number, number, number, number] {
  return () => [r, g, b, a];
}

export function checkerboard(
  size: number,
): (x: number, y: number) => [number, number, number, number] {
  return (x, y) => {
    const on = Math.floor(x / size) % 2 === Math.floor(y / size) % 2;
    return on ? [255, 255, 255, 255] : [0, 0, 0, 255];
  };
}

export function verticalGradient(
  height: number,
): (x: number, y: number) => [number, number, number, number] {
  return (_x, y) => {
    const v = Math.round((y / (height - 1)) * 255);
    return [v, v, v, 255];
  };
}

export async function jimpToPixelData(
  image: Awaited<ReturnType<typeof Jimp.read>>,
): Promise<PixelData> {
  return {
    data: image.bitmap.data,
    info: {
      width: image.bitmap.width,
      height: image.bitmap.height,
      channels: 4,
    },
  };
}
