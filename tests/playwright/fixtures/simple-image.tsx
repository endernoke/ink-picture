import { Box, render, Text } from "ink";
import React from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../../src";
import { parseArgs } from "./utils.js";

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
