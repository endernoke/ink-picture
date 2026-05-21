import { fileURLToPath } from "node:url";
import { Jimp } from "jimp";
import fetch from "node-fetch";

export type JimpImage = Awaited<ReturnType<typeof Jimp.read>>;

export interface ImageOutputInfo {
  width: number;
  height: number;
  channels: number;
  size?: number;
}

export async function fetchImage(
  src: Parameters<typeof Jimp.read>[0],
): Promise<JimpImage | undefined> {
  try {
    if (typeof src === "string" && src.startsWith("file://")) {
      return await Jimp.read(fileURLToPath(src));
    }
    return await Jimp.read(src);
  } catch {
    return undefined;
  }
}

export async function getRawPixels(
  image: JimpImage,
): Promise<{ data: Buffer; info: ImageOutputInfo }> {
  return {
    data: image.bitmap.data,
    info: {
      width: image.bitmap.width,
      height: image.bitmap.height,
      channels: 4,
    },
  };
}

export async function getPngBuffer(
  image: JimpImage,
): Promise<{ data: Buffer; info: ImageOutputInfo }> {
  const buffer = await image.getBuffer("image/png");
  return {
    data: buffer,
    info: {
      width: image.bitmap.width,
      height: image.bitmap.height,
      channels: 4,
      size: buffer.length,
    },
  };
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
