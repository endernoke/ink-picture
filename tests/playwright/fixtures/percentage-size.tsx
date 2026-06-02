import { Box, render, Text } from "ink";
import React from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../../src";
import { parseArgs } from "./utils.js";

const parsed = parseArgs(process.argv.slice(2));
const imagePath = (parsed.src as string) || "";
const widthArg = parsed.width || "100%";
const heightArg = parsed.height || "100%";
const protocol = (parsed.protocol as string) || "halfBlock";
const parentWidth = parseInt(parsed.parentWidth as string, 10) || 20;
const parentHeight = parseInt(parsed.parentHeight as string, 10) || 10;
const keepalive = parsed.keepalive === true;

let width: number | string = widthArg as string;
if (typeof widthArg === "string" && !widthArg.endsWith("%")) {
  width = parseInt(widthArg, 10);
}
let height: number | string = heightArg as string;
if (typeof heightArg === "string" && !heightArg.endsWith("%")) {
  height = parseInt(heightArg, 10);
}

export function App() {
  if (keepalive) {
    setInterval(() => {}, 10000);
  }

  return (
    <TerminalInfoProvider>
      <Box flexDirection="column" width={parentWidth} height={parentHeight}>
        <Image
          src={imagePath}
          width={width}
          height={height}
          protocol={protocol as ImageProtocolName}
        />
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
