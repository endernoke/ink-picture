import { render, Text, useApp, useInput } from "ink";
import React from "react";
import { TerminalInfoProvider } from "../../../src";

function UserInput() {
  const { exit } = useApp();

  useInput((input) => {
    if (input === "george") {
      exit();
      return;
    }
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
