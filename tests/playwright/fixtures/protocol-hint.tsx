import process from "node:process";
import { Box, render } from "ink";
import React from "react";
import type { ImageProtocolHint, ImageProtocolName } from "../../../src";
import Image, { TerminalInfoProvider } from "../../../src";

function parseArgs(args: string[]) {
  const result: Record<string, boolean | string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);

      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        result[key] = args[++i];
      } else {
        result[key] = true;
      }
    }
  }

  return result;
}

const parsed = parseArgs(process.argv.slice(2));
const imagePath = (parsed.src as string) || "";
const imageWidth = parsed.width ? parseInt(parsed.width as string, 10) : 4;
const imageHeight = parsed.height ? parseInt(parsed.height as string, 10) : 2;

function parseProtocol(
  raw: string | undefined,
): ImageProtocolName | ImageProtocolHint | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("{")) return JSON.parse(raw) as ImageProtocolHint;
  return raw as ImageProtocolName;
}

const protocol = parseProtocol(parsed.protocol as string | undefined);

export function App() {
  return (
    <TerminalInfoProvider>
      <Box flexDirection="row" width={80} height={24}>
        <Image
          src={imagePath}
          width={imageWidth}
          height={imageHeight}
          protocol={protocol}
          alt="Protocol hint test"
        />
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
