import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Box,
  render,
  Text,
  useApp,
  useBoxMetrics,
  useInput,
  useWindowSize,
} from "ink";
import React, { useRef } from "react";
import Image, {
  InkPictureProvider,
  type TerminalInfo,
  useTerminalInfo,
} from "../src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = `${__dirname}/images/house.png`;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function areRectsOverlapping(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

const headerContent = `
▀█▀ █▄ █ █ █   █▀█ ▀█▀ █▀▀ ▀█▀ █ █ █▀█ █▀▀
 █  █ ██ █▀▄   █▀▀  █  █    █  █ █ ██▀ █▀▀
▀▀▀ ▀  ▀ ▀ ▀   ▀   ▀▀▀ ▀▀▀  ▀  ▀▀▀ ▀ ▀ ▀▀▀
`.trim();

function Header({ ref }) {
  return (
    <Box
      position="absolute"
      top={2}
      flexDirection="column"
      paddingX={1}
      backgroundColor="black"
      borderStyle="double"
      borderBackgroundColor="black"
      ref={ref}
    >
      {headerContent.split("\n").map((line, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static
        <Text key={index}>{line}</Text>
      ))}
    </Box>
  );
}

function Demo() {
  const { rows, columns } = useWindowSize();
  const [imgOffsetX, setImgOffsetX] = React.useState(0);
  const [imgOffsetY, setImgOffsetY] = React.useState(0);
  const headerRef = useRef(null);
  const { width, height, left, top, hasMeasured } = useBoxMetrics(headerRef);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.upArrow) {
      setImgOffsetY((prev) => prev - 1);
    } else if (key.downArrow) {
      setImgOffsetY((prev) => prev + 1);
    } else if (key.leftArrow) {
      setImgOffsetX((prev) => prev - 1);
    } else if (key.rightArrow) {
      setImgOffsetX((prev) => prev + 1);
    } else if (input === "q") {
      exit();
    }
  });

  return (
    <InkPictureProvider>
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        width={columns}
        height={rows}
        overflow="hidden"
      >
        <Box
          width={columns}
          height={rows}
          top={imgOffsetY}
          left={imgOffsetX}
          justifyContent="center"
          alignItems="center"
        >
          <Box
            width={58}
            height={30}
            justifyContent="center"
            alignItems="center"
            borderColor="cyan"
            borderDimColor
            borderStyle="single"
          >
            <Image
              src={imagePath}
              width={56}
              height={28}
              alt="Example image"
              getVisibility={(info) => {
                if (!hasMeasured) {
                  return "partial";
                }
                if (
                  areRectsOverlapping(
                    {
                      x: left,
                      y: top,
                      width,
                      height,
                    },
                    {
                      x: info.position.col,
                      y: info.position.row,
                      width: info.position.width,
                      height: info.position.height,
                    },
                  )
                ) {
                  return "partial";
                }

                // Temporary fix for a sixel processing bug that causes one line of garbage output at the bottom of an image
                if (
                  info.position.row + info.position.height >=
                  info.terminalHeight
                ) {
                  return "partial";
                }

                return info.defaultVisibility;
              }}
            />
          </Box>
        </Box>
        <Header ref={headerRef} />
      </Box>
    </InkPictureProvider>
  );
}

render(<Demo />, {
  alternateScreen: true,
});
