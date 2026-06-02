/**
 * Moves cursor forward (right) by specified number of columns.
 * @param count - Number of columns to move forward (default: 1)
 * @returns ANSI escape sequence string
 */
export function cursorForward(count: number = 1) {
  if (count === 0) return "";
  return `\x1b[${count}C`;
}

/**
 * Moves cursor up by specified number of rows.
 * @param count - Number of rows to move up (default: 1)
 * @param context - Object containing appHeight and terminalHeight
 * @returns ANSI escape sequence string
 */
export function cursorUp(
  count: number = 1,
  context: { appHeight: number; terminalHeight: number },
) {
  // Ink appends a newline after output unless the app height exceeds the terminal height
  // See https://github.com/vadimdemedes/ink/blob/76d221c3639f62c8c2f6c3599d51a1bf51ed1b7b/src/ink.tsx#L1040-L1042
  // So we need to adjust the cursor movement by one row in that case to account for the absence of the newline
  const movementCount =
    context.appHeight >= context.terminalHeight ? count - 1 : count;
  if (movementCount <= 0) return "";
  return `\x1b[${movementCount}A`;
}
