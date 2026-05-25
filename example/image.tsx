import path from "node:path";
import { fileURLToPath } from "node:url";
import { Box, render, Text, useApp, useInput } from "ink";
import React from "react";
import Image, {
  InkPictureProvider,
  type TerminalInfo,
  useTerminalInfo,
} from "../src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getImagePath(): string {
  return `${__dirname}/images/full.png`;
}

type ProtocolConfig = {
  name: string;
  protocol: React.ComponentProps<typeof Image>["protocol"];
  requirements: string;
  getSupportStatus: (caps: TerminalInfo) => {
    supported: boolean;
  };
};

const protocols: ProtocolConfig[] = [
  {
    name: "ASCII Art",
    protocol: "ascii",
    requirements: "None",
    getSupportStatus: () => ({ supported: true }),
  },
  {
    name: "Half-Block",
    protocol: "halfBlock",
    requirements: "Unicode + Color support",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsUnicode && caps?.supportsColor,
    }),
  },
  {
    name: "Braille Patterns",
    protocol: "braille",
    requirements: "Unicode support",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsUnicode,
    }),
  },
  {
    name: "Sixel Graphics",
    protocol: "sixel",
    requirements: "Sixel-compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsSixelGraphics,
    }),
  },
  {
    name: "iTerm2 Inline Images",
    protocol: "iterm2",
    requirements: "iTerm2 or compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsITerm2Graphics,
    }),
  },
  {
    name: "Kitty Graphics",
    protocol: "kitty",
    requirements: "Kitty or compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsKittyGraphics,
    }),
  },
];

function ProtocolDemo({ config }: { config: ProtocolConfig }) {
  const terminalInfo = useTerminalInfo();
  // biome-ignore lint/style/noNonNullAssertion: monkey patch
  const supportInfo = config.getSupportStatus(terminalInfo!);

  return (
    <Box flexDirection="column" width={26}>
      <Text bold color="cyan">
        {config.name}
      </Text>
      <Text dimColor>Requirements: {config.requirements}</Text>
      <Text color={supportInfo.supported ? "green" : "red"}>
        {supportInfo.supported ? "✓ Supported" : "✗ Not Supported"}
      </Text>
      <Box
        borderStyle="single"
        borderColor={supportInfo.supported ? "green" : "red"}
        width={26}
        height={14}
      >
        {supportInfo.supported ? (
          <Image
            src={getImagePath()}
            // width={24}
            // height={12}
            protocol={config.protocol}
            alt={`${config.name} demo`}
          />
        ) : (
          <Box
            alignItems="center"
            justifyContent="center"
            height="100%"
            width="100%"
          >
            <Text color="red">Not Supported</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ProtocolShowcase() {
  const { exit } = useApp();
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  return (
    <InkPictureProvider>
      <Box flexDirection="column">
        <Text bold color="white" backgroundColor="blue">
          🖼️ ink-picture Showcase
        </Text>
        <Box marginBottom={1}>
          <Text dimColor>Press Ctrl+C to exit</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Box flexDirection="row" gap={1}>
            {protocols.slice(0, 3).map((config) => (
              <ProtocolDemo key={config.protocol} config={config} />
            ))}
          </Box>
          <Box flexDirection="row" gap={1}>
            {protocols.slice(3).map((config) => (
              <ProtocolDemo key={config.protocol} config={config} />
            ))}
          </Box>
        </Box>
      </Box>
    </InkPictureProvider>
  );
}

render(<ProtocolShowcase />);
