import type { JSX } from "react";
/**
 * Props interface for image rendering components.
 *
 * **Important:** Components using these props must be rendered within a
 * `<TerminalInfoProvider>` context to access terminal capabilities and dimensions.
 *
 * @interface ImageProps
 */
export interface ImageProps {
  /**
   * The source URL or file path of the image to render
   * Supports all image formats supported by sharp (JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF)
   */
  src: string;
  /** Width in terminal cells or a percentage */
  width: number;
  /** Height in terminal cells or a percentage */
  height: number;
  /** Alternative text displayed while loading or on error */
  alt?: string;
  /** Supports partially loaded image reading */
  allowPartial?: boolean;
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
