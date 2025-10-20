import React from "react";
import { render, useInput, useApp, Text } from "ink";
import { TerminalInfoProvider } from "../../src/context/TerminalInfo.js";

function UserInput() {
  const { exit } = useApp();

  useInput((input) => {
    if (input === "george") {
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

const app = render(<UserInput />);

await app.waitUntilExit();
console.log("exited");
