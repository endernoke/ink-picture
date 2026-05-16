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
      {terminalInfo?.supportsSixelGraphics && <Text>sixel</Text>}
      {terminalInfo?.supportsKittyGraphics && <Text>kitty</Text>}
    </Box>
  );
}

render(
  <TerminalInfoProvider>
    <App />
  </TerminalInfoProvider>,
);
