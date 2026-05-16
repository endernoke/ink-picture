import { Box, render, Text } from "ink";
import React, { useEffect, useState } from "react";
import Image, {
  ImageProtocolName,
  TerminalInfoProvider,
  useTerminalInfo,
} from "../../../src";

export function App() {
  const terminalInfo = useTerminalInfo();
  return (
    <Box flexDirection="column">
      {terminalInfo?.supportsColor && <Text>color</Text>}
    </Box>
  );
}

render(
  // xterm.js supports color so overriding with false checks that the default info is properly overridden
  <TerminalInfoProvider terminalInfo={{ supportsColor: false }}>
    <App />
  </TerminalInfoProvider>,
);
