import { useTerminalInfo } from "../InkPictureProvider.js";
import { getBestProtocol } from "../utils/getBestProtocol.js";

export default function useProtocol(
  specifiedProtocol?:
    | "ascii"
    | "braille"
    | "halfBlock"
    | "iterm2"
    | "kitty"
    | "sixel",
): "ascii" | "braille" | "halfBlock" | "iterm2" | "kitty" | "sixel" {
  const terminalInfo = useTerminalInfo();

  if (specifiedProtocol) {
    return specifiedProtocol;
  }

  if (!terminalInfo) {
    return "ascii";
  }

  return getBestProtocol(terminalInfo);
}
