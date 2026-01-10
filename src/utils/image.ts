import { Jimp } from "jimp";
import { JimpInstance } from "jimp";

export async function fetchImage(
  src: string,
): Promise<JimpInstance | undefined> {
  try {
    // Should be a safe hard cast here as all default plugin behaviours should all be inside JimpInstance
    const jimpImg = (await Jimp.read(src)) as JimpInstance;
    return jimpImg;
  } catch (error) {
    return undefined;
  }
}

export function calculateImageSize({
  maxWidth,
  maxHeight,
  originalAspectRatio,
  specifiedWidth,
  specifiedHeight,
  alignment = { width: 1, height: 1 },
}: {
  maxWidth: number;
  maxHeight: number;
  originalAspectRatio: number;
  specifiedWidth?: number;
  specifiedHeight?: number;
  alignment?: { width?: number; height?: number };
}): { width: number; height: number } {
  let width: number;
  let height: number;

  // Both width and height specified
  if (specifiedWidth && specifiedHeight) {
    width = Math.min(specifiedWidth, maxWidth);
    height = Math.min(specifiedHeight, maxHeight);
  }
  // Only width specified
  else if (specifiedWidth) {
    width = Math.min(specifiedWidth, maxWidth);
    height = width / originalAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * originalAspectRatio;
    }
  }
  // Only height specified
  else if (specifiedHeight) {
    height = Math.min(specifiedHeight, maxHeight);
    width = height * originalAspectRatio;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / originalAspectRatio;
    }
  }
  // No dimensions specified - scale to fit while maintaining aspect ratio
  else {
    height = maxHeight;
    width = height * originalAspectRatio;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / originalAspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * originalAspectRatio;
    }
  }

  // Align dimensions to cell boundaries
  const alignW = alignment.width || 1;
  const alignH = alignment.height || 1;
  const alignedWidth = Math.floor(width / alignW) * alignW;
  const alignedHeight = Math.floor(height / alignH) * alignH;

  return {
    width: Math.max(alignW, Math.round(alignedWidth)),
    height: Math.max(alignH, Math.round(alignedHeight)),
  };
}
