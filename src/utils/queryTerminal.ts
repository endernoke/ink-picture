import * as fs from "node:fs";

const HIDDEN_MODE = "\x1b[8m";
const CLEAR_LINE_AND_RETURN = "\x1b[2K\r";
const RESET_ATTRIBUTES = "\x1b[0m";

const CELL_SIZE_QUERY = "\x1b[16t";
const TERMINAL_SIZE_QUERY = "\x1b[14t";
const KITTY_QUERY = "\x1b_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1b\\";
const ITERM_CELL_SIZE_QUERY = "\x1b]1337;ReportCellSize\x07";
const DEVICE_ATTRIBUTES_QUERY = "\x1b[c";

// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally parsing escape sequence responses
const CELL_SIZE_REGEX = /\x1b\[6;(\d+);(\d+);?t/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally parsing escape sequence responses
const TERMINAL_SIZE_REGEX = /\x1b\[4;(\d+);(\d+);?t/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally parsing escape sequence responses
const KITTY_RESPONSE_REGEX = /\x1b_Gi=31;(.+?)\x1b\\/;
const ITERM_CELL_SIZE_REGEX = /ReportCellSize=([\d.]+);([\d.]+);([\d.]+)/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally parsing escape sequence responses
const DEVICE_ATTRIBUTES_REGEX = /\x1b\[\?(\d+(?:;\d+)*)c/;

const RESPONSE_PATTERNS_FOR_STRIPPING: RegExp[] = [
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally stripping escape sequence responses
  /\x1b\[6;\d+;\d+;?t/g,
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally stripping escape sequence responses
  /\x1b\[4;\d+;\d+;?t/g,
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally stripping escape sequence responses
  /\x1b_Gi=31;.+?\x1b\\/g,
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally stripping escape sequence responses
  /\x1b\]1337;ReportCellSize=[\d.]+;[\d.]+;[\d.]+\x07/g,
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally stripping escape sequence responses
  /\x1b\[\?\d+(?:;\d+)*c/g,
];

export interface TerminalQueryResult {
  cellWidth: number | undefined;
  cellHeight: number | undefined;
  terminalWidth: number | undefined;
  terminalHeight: number | undefined;
  supportsKittyGraphics: boolean;
  supportsSixelGraphics: boolean;
  iterm2CellWidth: number | undefined;
  iterm2CellHeight: number | undefined;
  iterm2Scale: number | undefined;
}

/**
 * Detect terminal capabilities by sending a batch of escape sequence queries
 * and accumulating the responses in a buffer matched by regex.
 *
 * The Device Attributes response (`\x1b[?Nc`) is used as a sentinel to signal
 * end of terminal response, with a 1000ms fallback timeout.
 * The function overrides `stdin.push`, preventing data from being picked up
 * by Ink's `useInput` hook. `stdin.push` is restored on cleanup, and any
 * user input during this period is pushed back into the stream.
 */
export function queryTerminal(
  stdin: NodeJS.ReadStream,
  setRawMode: (value: boolean) => void,
  signal?: AbortSignal,
): Promise<TerminalQueryResult> {
  return new Promise((resolve) => {
    if (signal?.aborted || !process.stdin.isTTY || !process.stdout.isTTY) {
      resolve({
        cellWidth: undefined,
        cellHeight: undefined,
        terminalWidth: undefined,
        terminalHeight: undefined,
        supportsKittyGraphics: false,
        supportsSixelGraphics: false,
        iterm2CellWidth: undefined,
        iterm2CellHeight: undefined,
        iterm2Scale: undefined,
      });
      return;
    }

    setRawMode(true);

    let buffer = "";
    let cellSizeReceived = false;
    let terminalSizeReceived = false;
    let kittyReceived = false;
    let itermCellSizeReceived = false;
    let sentinelReceived = false;
    let timeoutId: NodeJS.Timeout;
    let done = false;

    const result: TerminalQueryResult = {
      cellWidth: undefined,
      cellHeight: undefined,
      terminalWidth: undefined,
      terminalHeight: undefined,
      supportsKittyGraphics: false,
      supportsSixelGraphics: false,
      iterm2CellWidth: undefined,
      iterm2CellHeight: undefined,
      iterm2Scale: undefined,
    };

    const origPush: typeof stdin.push = stdin.push.bind(stdin);

    const cleanup = () => {
      if (done) return;
      done = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      signal?.removeEventListener("abort", onAbort);
      stdin.push = origPush;
      setRawMode(false);

      let filtered = buffer;
      for (const regex of RESPONSE_PATTERNS_FOR_STRIPPING) {
        filtered = filtered.replace(regex, "");
      }

      if (filtered.length > 0) {
        stdin.push(filtered);
      }

      resolve(result);
    };

    const onAbort = () => {
      cleanup();
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    timeoutId = setTimeout(cleanup, 1000);

    const processChunk = (data: string) => {
      buffer += data;

      if (!cellSizeReceived) {
        const match = buffer.match(CELL_SIZE_REGEX);
        if (match?.[1] && match?.[2]) {
          cellSizeReceived = true;
          const height = parseInt(match[1], 10);
          const width = parseInt(match[2], 10);
          if (!Number.isNaN(height) && !Number.isNaN(width)) {
            result.cellWidth = width;
            result.cellHeight = height;
          }
        }
      }

      if (!terminalSizeReceived) {
        const match = buffer.match(TERMINAL_SIZE_REGEX);
        if (match?.[1] && match?.[2]) {
          terminalSizeReceived = true;
          const height = parseInt(match[1], 10);
          const width = parseInt(match[2], 10);
          if (!Number.isNaN(height) && !Number.isNaN(width)) {
            result.terminalWidth = width;
            result.terminalHeight = height;
          }
        }
      }

      if (!kittyReceived) {
        const match = buffer.match(KITTY_RESPONSE_REGEX);
        if (match?.[1]?.includes("OK")) {
          kittyReceived = true;
          result.supportsKittyGraphics = true;
        }
      }

      if (!itermCellSizeReceived) {
        const match = buffer.match(ITERM_CELL_SIZE_REGEX);
        if (match?.[1] && match?.[2] && match?.[3]) {
          itermCellSizeReceived = true;
          const height = parseFloat(match[1]);
          const width = parseFloat(match[2]);
          const scale = parseFloat(match[3]);
          if (
            !Number.isNaN(height) &&
            !Number.isNaN(width) &&
            !Number.isNaN(scale)
          ) {
            result.iterm2CellWidth = width;
            result.iterm2CellHeight = height;
            result.iterm2Scale = scale;
          }
        }
      }

      if (!sentinelReceived && DEVICE_ATTRIBUTES_REGEX.test(buffer)) {
        sentinelReceived = true;
        const daMatch = buffer.match(DEVICE_ATTRIBUTES_REGEX);
        if (daMatch?.[1]) {
          result.supportsSixelGraphics = daMatch[1].split(";").includes("4");
        }
        cleanup();
      }
    };

    stdin.push = (chunk) => {
      const str = Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk);
      processChunk(str);
      return true;
    };

    const query =
      HIDDEN_MODE +
      CELL_SIZE_QUERY +
      TERMINAL_SIZE_QUERY +
      KITTY_QUERY +
      ITERM_CELL_SIZE_QUERY +
      DEVICE_ATTRIBUTES_QUERY +
      CLEAR_LINE_AND_RETURN +
      RESET_ATTRIBUTES;

    try {
      fs.writeSync(process.stdout.fd, query);
    } catch {
      cleanup();
    }
  });
}
