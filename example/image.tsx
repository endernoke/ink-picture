import React, { useState, useEffect } from "react";
import Image from "../src/components/image/index.js";
import { RenderOptions, Text, Box, render } from "ink";
import { TerminalInfoProvider } from "../src/context/TerminalInfo.js";

const protocol = process.argv[2] || "ascii";

const testImages = [
  "https://sipi.usc.edu/database/preview/misc/4.1.01.png",
  "https://sipi.usc.edu/database/preview/misc/4.1.06.png",
  "https://sipi.usc.edu/database/preview/misc/4.2.06.png",
  "https://www.math.hkust.edu.hk/~masyleung/Teaching/CAS/MATLAB/image/images/cameraman.jpg",
  "https://example.com/bad-url/image-that-doesnt-exist.jpg",
  "/home/endernoke/Downloads/wn_php.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Lenna_%28test_image%29.png/500px-Lenna_%28test_image%29.png",
];

function TestImage() {
  const [, setTick] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => !t);
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <TerminalInfoProvider>
      <Box flexDirection="column">
        <Text>{protocol}</Text>
        <Box flexDirection="column">
          {/* First row */}
          <Box flexDirection="row">
            {testImages.slice(0, 3).map((src, index) => (
              <Box
                key={index}
                borderStyle="round"
                borderColor="cyan"
                width={32}
                height={17}
              >
                <Image
                  src={src}
                  alt={`Test Image ${index + 1}`}
                  protocol={protocol}
                />
              </Box>
            ))}
          </Box>
          {/* Second row */}
          <Box flexDirection="row">
            {testImages.slice(3, 6).map((src, index) => (
              <Box
                key={index + 3}
                borderStyle="round"
                borderColor="cyan"
                width={32}
                height={17}
              >
                <Image
                  src={src}
                  alt={`Test Image ${index + 4}`}
                  protocol={protocol}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box>
        <Text>Ctrl+C to exit</Text>
      </Box>
    </TerminalInfoProvider>
  );
}

render(<TestImage />);

setTimeout(() => {
  process.exit(0);
}, 20000);
