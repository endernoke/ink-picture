import { type Jimp } from "jimp";
import { useEffect, useState } from "react";
import type { PixelData, PngData } from "../renderers/types.js";
import { fetchImage, getPngBuffer, getRawPixels } from "../utils/image.js";
import { getCachedImage, setCachedImage } from "../utils/imageCache.js";

export function useImage<T extends "pixels" | "png" = "pixels">(options: {
  src: Parameters<typeof Jimp.read>[0];
  pixelWidth: number;
  pixelHeight: number;
  mode?: T;
}): T extends "png"
  ? { imageData: PngData | undefined; error: boolean }
  : { imageData: PixelData | undefined; error: boolean } {
  const { src, pixelWidth, pixelHeight, mode = "pixels" } = options;
  const [imageData, setImageData] = useState<PngData | PixelData | undefined>(
    undefined,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pixelWidth === 0 || pixelHeight === 0) return;

    let cancelled = false;

    const load = async () => {
      let image = typeof src === "string" ? getCachedImage(src) : undefined;

      if (!image) {
        image = await fetchImage(src);
        if (cancelled) return;

        if (!image) {
          setError(true);
          setImageData(undefined);
          return;
        }

        if (typeof src === "string") {
          setCachedImage(src, image);
        }
      }

      setError(false);
      image.resize({ w: pixelWidth, h: pixelHeight });

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
  }, [src, pixelWidth, pixelHeight, mode]);

  return { imageData, error } as T extends "png"
    ? { imageData: PngData | undefined; error: boolean }
    : { imageData: PixelData | undefined; error: boolean };
}
