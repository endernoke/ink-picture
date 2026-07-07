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

export function resizeImage(
  image: JimpImage,
  objectFit: "fill" | "contain" | "cover",
  width: number,
  height: number,
  cellRatio?: number,
): void {
  if (cellRatio !== undefined && cellRatio !== 1 && objectFit !== "fill") {
    image.resize({
      w: Math.round(image.bitmap.width * cellRatio),
      h: image.bitmap.height,
    });
  }

  switch (objectFit) {
    case "contain":
      image.contain({ w: width, h: height });
      break;
    case "cover":
      image.cover({ w: width, h: height });
      break;
    default:
      image.resize({ w: width, h: height });
  }
}
