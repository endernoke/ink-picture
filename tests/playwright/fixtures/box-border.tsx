import process from "node:process";
import { Box, render, Text } from "ink";
import React, { useEffect, useState } from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../../src";

export function App() {
  return (
    <TerminalInfoProvider>
      <Box width={3} height={3} borderStyle="classic" />
    </TerminalInfoProvider>
  );
}

render(<App />);
