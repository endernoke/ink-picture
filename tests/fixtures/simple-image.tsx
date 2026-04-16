import process from "node:process";
import { render } from "ink";
import React from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../src";

const imagePath = process.argv[2] || "";
const imageWidth = process.argv[3] ? parseInt(process.argv[3], 10) : 4;
const imageHeight = process.argv[4] ? parseInt(process.argv[4], 10) : 2;
const protocol = process.argv[5] || "halfBlock";

export function App() {
  return (
    <TerminalInfoProvider>
      <Image
        src={imagePath}
        width={imageWidth}
        height={imageHeight}
        protocol={protocol as ImageProtocolName}
      />
    </TerminalInfoProvider>
  );
}

render(<App />);
