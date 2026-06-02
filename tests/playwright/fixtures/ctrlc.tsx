import { Box, render, Text, useStdout } from "ink";
import React from "react";
import { TerminalInfoProvider } from "../../../src";

const CtrlCTest = () => {
  setInterval(() => {}, 1000); // Keep the process alive

  const stdout = useStdout();

  return (
    <TerminalInfoProvider
      onTerminalInfoDetection={(_) => {
        stdout.write("__READY__");
      }}
    >
      <Box />
    </TerminalInfoProvider>
  );
};

const app = render(<CtrlCTest />);

await app.waitUntilExit();
console.log("exited");
