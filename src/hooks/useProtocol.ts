import { useTerminalInfo } from "../context/TerminalInfo";
import { getBestProtocol } from "../utils/getBestProtocol";

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
