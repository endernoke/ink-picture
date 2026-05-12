import process from "node:process";
import { Box, render, Text } from "ink";
import React from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../../src";

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
const protocol = (parsed.protocol as string) || "sixel";
const appHeight = parseInt(parsed.appHeight as string, 10) || 10;

const imageHeight = 2;

export function App() {
  setInterval(() => {}, 10000);

  return (
    <TerminalInfoProvider>
      <Box flexDirection="column" height={appHeight}>
        <Box height={appHeight - imageHeight - 1} />
        <Image
          src={imagePath}
          width={4}
          height={imageHeight}
          protocol={protocol as ImageProtocolName}
        />
        <Box height={1} />
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
