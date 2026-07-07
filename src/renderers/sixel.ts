import { FINALIZER, introducer, sixelEncode } from "sixel";
import { reduce } from "sixel/lib/Quantizer.js";
import type { PixelData } from "./types.js";

export function renderSixel(pixels: PixelData): string {
  const { data, info } = pixels;
  const { width, height } = info;
  const pixelCount = width * height;

  const opaqueCopy = new Uint8Array(data.slice());
  // Replace fully transparent pixels with opaque black pixels to avoid issues with the quantizer
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    if (opaqueCopy[offset + 3] === 0) {
      opaqueCopy[offset] = 0;
      opaqueCopy[offset + 1] = 0;
      opaqueCopy[offset + 2] = 0;
      opaqueCopy[offset + 3] = 255;
    }
  }

  const { indices, palette } = reduce(opaqueCopy, width, 256);

  const quantOutput = new Uint8Array(pixelCount * 4);
  const originalData = new Uint8Array(data.slice());
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    if (originalData[offset + 3] === 0) {
      quantOutput[offset] = 0;
      quantOutput[offset + 1] = 0;
      quantOutput[offset + 2] = 0;
      quantOutput[offset + 3] = 0;
    } else {
      const color = palette[indices[i]];
      quantOutput[offset] = color & 0xff;
      quantOutput[offset + 1] = (color >> 8) & 0xff;
      quantOutput[offset + 2] = (color >> 16) & 0xff;
      quantOutput[offset + 3] = (color >> 24) & 0xff;
    }
  }

  const sixelData = sixelEncode(quantOutput, width, height, palette);

  return [introducer(1), sixelData, FINALIZER].join("");
}
