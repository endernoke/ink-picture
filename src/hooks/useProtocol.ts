import { useTerminalCapabilities } from "../context/TerminalInfo";
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
  const terminalCapabilitiesContext = useTerminalCapabilities();

  if (specifiedProtocol) {
    return specifiedProtocol;
  }

  if (!terminalCapabilitiesContext) {
    return "ascii";
  }

  return getBestProtocol(terminalCapabilitiesContext);
}
