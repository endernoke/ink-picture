import { image2sixel } from "sixel";
import type { PixelData } from "./types.js";

export function renderSixel(pixels: PixelData): string {
  const { data, info } = pixels;
  const u8Data = new Uint8Array(data);
  return image2sixel(u8Data, info.width, info.height);
}
