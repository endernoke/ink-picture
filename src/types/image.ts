import AsciiImage from "../components/image/Ascii.js";
import HalfBlockImage from "../components/image/HalfBlock.js";
import BrailleImage from "../components/image/Braille.js";
import SixelImage from "../components/image/Sixel.js";
import ITerm2Image from "../components/image/ITerm2.js";
import KittyImage from "../components/image/Kitty.js";

export const imageProtocols = {
  ascii: AsciiImage,
  braille: BrailleImage,
  halfBlock: HalfBlockImage,
  iterm2: ITerm2Image,
  kitty: KittyImage,
  sixel: SixelImage,
};

export type ImageProtocolName = keyof typeof imageProtocols;
