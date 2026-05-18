export interface PixelData {
  data: Buffer;
  info: {
    width: number;
    height: number;
    channels: number;
  };
}

export interface PngData {
  data: Buffer;
  info: {
    width: number;
    height: number;
  };
}
