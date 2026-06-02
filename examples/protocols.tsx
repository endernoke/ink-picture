import path from "node:path";
import { fileURLToPath } from "node:url";
import { Box, render, Text } from "ink";
import React from "react";
import Image, {
  ImageProtocolName,
  InkPictureProvider,
  type TerminalInfo,
  useTerminalInfo,
} from "../src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ProtocolConfig = {
  name: string;
  protocol: React.ComponentProps<typeof Image>["protocol"];
  requirements: string;
  getSupportStatus: (caps: TerminalInfo | undefined) => {
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
      supported: (caps?.supportsUnicode && caps?.supportsColor) || false,
    }),
  },
  {
    name: "Braille Patterns",
    protocol: "braille",
    requirements: "Unicode support",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsUnicode || false,
    }),
  },
  {
    name: "Sixel Graphics",
    protocol: "sixel",
    requirements: "Sixel-compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsSixelGraphics || false,
    }),
  },
  {
    name: "iTerm2 Inline Images",
    protocol: "iterm2",
    requirements: "iTerm2 or compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsITerm2Graphics || false,
    }),
  },
  {
    name: "Kitty Graphics",
    protocol: "kitty",
    requirements: "Kitty or compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsKittyGraphics || false,
    }),
  },
];

function ProtocolDemo({ config }: { config: ProtocolConfig }) {
  const terminalInfo = useTerminalInfo();
  const supportInfo = config.getSupportStatus(terminalInfo);

  return (
    <Box flexDirection="column" width={22}>
      <Box height={4} flexDirection="column">
        <Text bold color="cyan">
          {config.name}
        </Text>
        <Text dimColor>Requirements: {config.requirements}</Text>
        <Text color={supportInfo.supported ? "green" : "red"}>
          {supportInfo.supported ? "✓ Supported" : "✗ Not Supported"}
        </Text>
      </Box>
      <Box
        borderStyle="single"
        borderColor={supportInfo.supported ? "green" : "red"}
        width={22}
        height={12}
      >
        {supportInfo.supported ? (
          <Image
            src={`${__dirname}/images/house.png`}
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
  return (
    <InkPictureProvider>
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="white" backgroundColor="blue">
            🖼️ ink-picture Showcase
          </Text>
        </Box>

        <Box flexDirection="column">
          <Box flexDirection="row" gap={1}>
            {protocols.slice(0, 3).map((config) => (
              <ProtocolDemo
                key={config.protocol as ImageProtocolName}
                config={config}
              />
            ))}
          </Box>
          <Box flexDirection="row" gap={1}>
            {protocols.slice(3).map((config) => (
              <ProtocolDemo
                key={config.protocol as ImageProtocolName}
                config={config}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </InkPictureProvider>
  );
}

render(<ProtocolShowcase />);
