import React from "react";
import { render, useInput, useApp, Text } from "ink";
import { TerminalInfoProvider } from "../../src/context/TerminalInfo.js";

function UserInput() {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === "c" && key.ctrl) {
      exit();
      return;
    }

    throw new Error("Crash");
  });

  return (
    <TerminalInfoProvider>
      <Text>__READY__</Text>
    </TerminalInfoProvider>
  );
}

const app = render(<UserInput />, { exitOnCtrlC: false });

await app.waitUntilExit();
console.log("exited");
