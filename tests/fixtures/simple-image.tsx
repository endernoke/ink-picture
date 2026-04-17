import process from "node:process";
import { Box, render, Text } from "ink";
import React from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../src";

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
const imageWidth = parseInt(parsed.width as string, 10) || 4;
const imageHeight = parseInt(parsed.height as string, 10) || 2;
const protocol = (parsed.protocol as string) || "halfBlock";
const keepalive = parsed.keepalive === true;

export function App() {
  if (keepalive) {
    setInterval(() => {}, 10000);
  }

  return (
    <TerminalInfoProvider>
      <Box flexDirection="row">
        <Image
          src={imagePath}
          width={imageWidth}
          height={imageHeight}
          protocol={protocol as ImageProtocolName}
        />
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
