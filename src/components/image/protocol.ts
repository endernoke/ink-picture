import type { Jimp } from "jimp";
import type { JSX } from "react";

export interface ImageProps {
  /**
   * The source URL, file path or ArrayBuffer of the image to render
   * Supports all image formats supported by jimp (JPEG, PNG, WebP, GIF, BMP, TIFF).
   */
  src: Parameters<typeof Jimp.read>[0];
  /** Width in terminal cells or a percentage */
  width: number | string;
  /** Height in terminal cells or a percentage */
  height: number | string;
  /** Alternative text displayed while loading or on error */
  alt?: string;
}

/**
 * Interface defining an image rendering protocol.
 *
 * Each protocol represents a different method of displaying images in the terminal,
 * such as ASCII art, Sixel graphics, Braille patterns, or Unicode half-blocks.
 *
 * @interface ImageProtocol
 */
export interface ImageProtocol {
  /** Unique identifier for this protocol */
  name: string;
  /** Function that renders the image using this protocol */
  render(props: ImageProps): JSX.Element | null;
}
