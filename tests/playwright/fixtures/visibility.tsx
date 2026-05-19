import { Box, render, Text, useApp, useInput } from "ink";
import React, { useState } from "react";
import Image, {
  ImageProtocolName,
  TerminalInfoProvider,
  type Visibility,
  type VisibilityInfo,
} from "../../../src";

function parseArgs(args: string[]) {
  const result: Record<string, boolean | string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);

      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        result[key] = args[++i];
      } else {
        result[key] = true;
      }
    }
  }

  return result;
}

const parsed = parseArgs(process.argv.slice(2));
const imagePath = (parsed.src as string) || "";
const protocol = (parsed.protocol as ImageProtocolName) || undefined;
const useCustomVisibility = parsed.useCustomVisibility === true;
const appHeight = parseInt(parsed.appHeight as string, 10) || 10;

const getVisibility = useCustomVisibility
  ? (_: VisibilityInfo): Visibility => "partial"
  : undefined;

export function App() {
  const [marginTop, setMarginTop] = useState(0);
  const { exit } = useApp();
  useInput((input, key) => {
    if (input === "w" || key.upArrow) {
      setMarginTop((prev) => prev - 1);
    } else if (input === "s" || key.downArrow) {
      setMarginTop((prev) => prev + 1);
    }
  });

  return (
    <TerminalInfoProvider>
      <Box flexDirection="row">
        <Box
          flexDirection="column"
          height={appHeight}
          width={4}
          overflow="hidden"
        >
          <Box marginTop={marginTop}>
            <Image
              src={imagePath}
              width={4}
              height={2}
              protocol={protocol}
              getVisibility={getVisibility}
            />
          </Box>
        </Box>
        <Text>__READY__</Text>
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
