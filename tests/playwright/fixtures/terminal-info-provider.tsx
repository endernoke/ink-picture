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
      {terminalInfo?.capabilities.supportsSixelGraphics && <Text>sixel</Text>}
      {terminalInfo?.capabilities.supportsKittyGraphics && <Text>kitty</Text>}
    </Box>
  );
}

render(
  <TerminalInfoProvider>
    <App />
  </TerminalInfoProvider>,
);
