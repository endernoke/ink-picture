import { type Jimp } from "jimp";
import { useEffect, useState } from "react";
import { useImageCache } from "../InkPictureProvider.js";
import type { PixelData, PngData } from "../renderers/types.js";
import {
  fetchImage,
  getPngBuffer,
  getRawPixels,
  resizeImage,
} from "../utils/image.js";

export function useImage<T extends "pixels" | "png" = "pixels">(options: {
  src: Parameters<typeof Jimp.read>[0];
  pixelWidth: number;
  pixelHeight: number;
  mode?: T;
  objectFit?: "fill" | "contain" | "cover";
  cellRatio?: number;
}): T extends "png"
  ? { imageData: PngData | undefined; error: boolean }
  : { imageData: PixelData | undefined; error: boolean } {
  const {
    src,
    pixelWidth,
    pixelHeight,
    mode = "pixels",
    objectFit = "fill",
    cellRatio,
  } = options;
  const [imageData, setImageData] = useState<PngData | PixelData | undefined>(
    undefined,
  );
  const [error, setError] = useState(false);
  const cache = useImageCache();

  useEffect(() => {
    if (pixelWidth === 0 || pixelHeight === 0) return;

    let cancelled = false;

    const load = async () => {
      let image = typeof src === "string" ? cache?.get(src) : undefined;

      if (!image) {
        image = await fetchImage(src);
        if (cancelled) return;

        if (!image) {
          setError(true);
          setImageData(undefined);
          return;
        }

        if (typeof src === "string") {
          cache?.set(src, image);
        }
      }

      setError(false);
      resizeImage(image, objectFit, pixelWidth, pixelHeight, cellRatio);

      if (mode === "png") {
        const result = await getPngBuffer(image);
        if (!cancelled) {
          setImageData(result);
        }
      } else {
        const result = await getRawPixels(image);
        if (!cancelled) {
          setImageData(result);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [src, pixelWidth, pixelHeight, mode, objectFit, cache, cellRatio]);

  return { imageData, error } as T extends "png"
    ? { imageData: PngData | undefined; error: boolean }
    : { imageData: PixelData | undefined; error: boolean };
}
