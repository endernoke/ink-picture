import process from "node:process";
import { Box, render, Text } from "ink";
import React, { useEffect, useState } from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../../src";

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
const protocol = (parsed.protocol as string) || "halfBlock";
const bgColor = (parsed.bgColor as string) || undefined;

export function App() {
  const [showImage, setShowImage] = useState<boolean>(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowImage(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <TerminalInfoProvider>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        width={6}
        height={4}
        backgroundColor={bgColor}
      >
        {showImage && (
          <Image
            src={imagePath}
            width={4}
            height={2}
            protocol={protocol as ImageProtocolName}
          />
        )}
      </Box>
    </TerminalInfoProvider>
  );
}

render(<App />);
