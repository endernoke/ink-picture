import { TerminalCapabilities } from "../context/TerminalInfo.js";
import { ImageProtocolName } from "../types/image.js";

// Heuristic for selecting the best image protocol based on terminal capabilities
function getBestProtocol(caps: TerminalCapabilities): ImageProtocolName {
  if (
    process.env["TERM_PROGRAM"] === "iTerm.app" &&
    caps.supportsITerm2Graphics
  ) {
    // Testing has shown that iTerm2 might be adding kitty support in stealth but it's not mature yet
    return "iterm2";
  } else if (
    process.env["TERM_PROGRAM"] === "WarpTerminal" &&
    caps.supportsITerm2Graphics
  ) {
    // Warp terminal only supports a incomplete subset of kitty graphics so we are not using it for now
    return "iterm2";
  } else if (
    process.env["TERM_PROGRAM"] === "WezTerm" &&
    caps.supportsITerm2Graphics
  ) {
    // WezTerm doesn't support placing image above text so it may introduce race conditions during rerenders like sixel and iterm2
    // See https://github.com/wezterm/wezterm/issues/7222
    // a workaround is implemented for sixel and iterm2 to mitigate race conditions but I don't think it's a good idea to do the same for kitty specifically for wezterm
    return "iterm2";
  } else if (process.env["KONSOLE_VERSION"] && caps.supportsKittyGraphics) {
    // Kitty is the only properly working protocol out of the three on Konsole
    // because it has non-standard implementation for overwriting cells containing graphics with text which makes sixel and iterm2 leave artifacts
    return "kitty";
  } else if (caps.supportsKittyGraphics) {
    return "kitty";
  } else if (caps.supportsITerm2Graphics) {
    return "iterm2";
  } else if (caps.supportsSixelGraphics) {
    return "sixel";
  } else if (caps.supportsUnicode && caps.supportsColor) {
    return "halfBlock";
  } else if (caps.supportsUnicode) {
    return "braille";
  } else {
    return "ascii";
  }
}

export { getBestProtocol };
