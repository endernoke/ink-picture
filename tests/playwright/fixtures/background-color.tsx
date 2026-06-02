import { Box, render, Text } from "ink";
import React, { useEffect, useState } from "react";
import Image, { ImageProtocolName, TerminalInfoProvider } from "../../../src";
import { parseArgs } from "./utils.js";

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
