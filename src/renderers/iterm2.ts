import type { PngData } from "./types.js";

export function renderITerm2(
  png: PngData,
  options: { width: number; height: number },
): string {
  const { data } = png;
  const { width, height } = options;

  return (
    "\x1b]1337;File=" +
    `size=${data.length};` +
    `width=${width}px;height=${height}px;` +
    `preserveAspectRatio=1;` +
    `inline=1:` +
    data.toString("base64") +
    "\x07"
  );
}
