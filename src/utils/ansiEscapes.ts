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
 * @returns ANSI escape sequence string
 */
export function cursorUp(count: number = 1) {
  if (count === 0) return "";
  return `\x1b[${count}A`;
}
