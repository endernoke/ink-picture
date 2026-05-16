import { isDeepStrictEqual } from "node:util";
import { Box, render, Text } from "ink";
import React from "react";
import Image, { defaultTerminalInfo, useTerminalInfo } from "../../../src";

export function App() {
  const terminalInfo = useTerminalInfo();
  return (
    <Text>
      {isDeepStrictEqual(terminalInfo, defaultTerminalInfo) && "default"}
    </Text>
  );
}

render(<App />);
