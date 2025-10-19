import React from "react";
import { render, Text } from "ink";
import { TerminalInfoProvider } from "../../src/context/TerminalInfo.js";

const CtrlCTest = () => {
  setInterval(() => {}, 1000); // Keep the process alive
  return (
    <TerminalInfoProvider>
      {/* Signal that the process is ready */}
      <Text>__READY__</Text>
    </TerminalInfoProvider>
  );
};

const app = render(<CtrlCTest />);

await app.waitUntilExit();
console.log("exited");
