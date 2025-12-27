import { Jimp } from "jimp";
import { JimpImg } from "../types/jimp";

export async function fetchImage(src: string): Promise<JimpImg | undefined> {
  try {
    const img = await Jimp.read(src);
    return img;
  } catch (error) {
    // TODO: LEO: wondering if it's possible to intgrate logger from instagram-cli into here
    return undefined;
  }
}

export function calculateImageSize({
  maxWidth,
  maxHeight,
  originalAspectRatio,
  specifiedWidth,
  specifiedHeight,
}: {
  maxWidth: number;
  maxHeight: number;
  originalAspectRatio: number;
  specifiedWidth?: number;
  specifiedHeight?: number;
}): { width: number; height: number } {
  // Both width and height specified
  if (specifiedWidth && specifiedHeight) {
    const width = Math.min(specifiedWidth, maxWidth);
    const height = Math.min(specifiedHeight, maxHeight);
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Only width specified
  if (specifiedWidth) {
    let width = Math.min(specifiedWidth, maxWidth);
    let height = width / originalAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * originalAspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Only height specified
  if (specifiedHeight) {
    let height = Math.min(specifiedHeight, maxHeight);
    let width = height * originalAspectRatio;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / originalAspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // No dimensions specified - scale to fit while maintaining aspect ratio
  let height = maxHeight;
  let width = height * originalAspectRatio;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / originalAspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * originalAspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}
