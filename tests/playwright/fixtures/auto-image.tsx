import { Box, render } from "ink";
import React from "react";
import Image, { TerminalInfoProvider } from "../../../src";
import { parseArgs } from "./utils.js";

const parsed = parseArgs(process.argv.slice(2));
const imagePath = (parsed.src as string) || "";
const imageWidth = parsed.width
  ? parseInt(parsed.width as string, 10)
  : undefined;
const imageHeight = parsed.height
  ? parseInt(parsed.height as string, 10)
  : undefined;
const keepalive = parsed.keepalive === true;

export function App() {
  if (keepalive) {
    setInterval(() => {}, 10000);
  }

  return (
    <TerminalInfoProvider>
      <Box flexDirection="row" width={80} height={24}>
        <Image
          src={imagePath}
          width={imageWidth}
          height={imageHeight}
          alt="Auto-detect test"
        />
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
