import process from "node:process";
import { render } from "ink";
import React from "react";
import Image, { TerminalInfoProvider } from "../../src";

const imagePath = process.argv[2] || "";
const imageWidth = process.argv[3] ? parseInt(process.argv[3], 10) : 4;
const imageHeight = process.argv[4] ? parseInt(process.argv[4], 10) : 2;

export function App() {
  return (
    <TerminalInfoProvider>
      <Image
        src={imagePath}
        width={imageWidth}
        height={imageHeight}
        protocol="halfBlock"
      />
    </TerminalInfoProvider>
  );
}

render(<App />);
