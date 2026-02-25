import path from "node:path";
import { fileURLToPath } from "node:url";
import { Box, render, Text, useApp, useInput } from "ink";
import React from "react";
import Image from "../src/components/image/index.js";
import {
  type TerminalCapabilities,
  TerminalInfoProvider,
  useTerminalCapabilities,
} from "../src/context/TerminalInfo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getImagePath(): string {
  return `${__dirname}/images/${getAllowPartial() ? "partial.jpeg" : "full.png"}`;
}

function getAllowPartial() {
  const args = process.argv.slice(2);
  return args.length > 0 && args[0].startsWith("--partial");
}

type ProtocolConfig = {
  name: string;
  protocol: React.ComponentProps<typeof Image>["protocol"];
  description: string;
  requirements: string;
  getSupportStatus: (caps: TerminalCapabilities) => {
    supported: boolean;
    reason: string;
  };
};

const protocols: ProtocolConfig[] = [
  {
    name: "ASCII Art",
    protocol: "ascii",
    description: "Character-based rendering",
    requirements: "None (universal fallback)",
    getSupportStatus: () => ({ supported: true, reason: "Always supported" }),
  },
  {
    name: "Half-Block",
    protocol: "halfBlock",
    description: "Color rendering with Unicode blocks",
    requirements: "Unicode + Color support",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsUnicode && caps?.supportsColor,
      reason: !caps?.supportsUnicode
        ? "No Unicode support"
        : !caps?.supportsColor
          ? "No color support"
          : "Fully supported",
    }),
  },
  {
    name: "Braille Patterns",
    protocol: "braille",
    description: "High-res monochrome with Braille",
    requirements: "Unicode support",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsUnicode,
      reason: caps?.supportsUnicode ? "Fully supported" : "No Unicode support",
    }),
  },
  {
    name: "Sixel Graphics",
    protocol: "sixel",
    description: "True color bitmap (experimental)",
    requirements: "Sixel graphics protocol",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsSixelGraphics,
      reason: caps?.supportsSixelGraphics
        ? "Fully supported"
        : "No Sixel support detected",
    }),
  },
  {
    name: "iTerm2 Inline Images",
    protocol: "iterm2",
    description: "True color bitmap (proprietary)",
    requirements: "iTerm2 or compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsITerm2Graphics,
      reason: caps?.supportsITerm2Graphics
        ? "Fully supported"
        : "No iTerm2 graphics support detected",
    }),
  },
  {
    name: "Kitty Graphics",
    protocol: "kitty",
    description: "True color bitmap (proprietary)",
    requirements: "Kitty-compatible terminal",
    getSupportStatus: (caps) => ({
      supported: caps?.supportsKittyGraphics,
      reason: caps?.supportsKittyGraphics
        ? "Fully supported"
        : "No Kitty graphics support detected",
    }),
  },
];

function ProtocolDemo({ config }: { config: ProtocolConfig }) {
  const capabilities = useTerminalCapabilities();
  // biome-ignore lint/style/noNonNullAssertion: monkey patch
  const supportInfo = config.getSupportStatus(capabilities!);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">
          {config.name}
        </Text>
        <Text> - {config.description}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>Requirements: {config.requirements}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text>Status: </Text>
        <Text color={supportInfo.supported ? "green" : "red"}>
          {supportInfo.supported ? "✓" : "✗"} {supportInfo.reason}
        </Text>
      </Box>
      <Box
        borderStyle="round"
        borderColor={supportInfo.supported ? "green" : "red"}
        width={28}
        height={14}
      >
        {supportInfo.supported ? (
          <Image
            src={getImagePath()}
            protocol={config.protocol}
            alt={`${config.name} demo`}
            allowPartial={getAllowPartial()}
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
    <TerminalInfoProvider>
      <Box flexDirection="column">
        <Text bold color="white" backgroundColor="blue">
          🖼️ ink-picture Protocol Showcase
        </Text>
        <Box marginBottom={1}>
          <Text dimColor>Press Ctrl+C to exit</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Box flexDirection="row">
            {protocols.slice(0, 3).map((config) => (
              <ProtocolDemo key={config.protocol} config={config} />
            ))}
          </Box>
          <Box flexDirection="row">
            {protocols.slice(3).map((config) => (
              <ProtocolDemo key={config.protocol} config={config} />
            ))}
          </Box>
        </Box>

        <Box marginTop={2} borderStyle="single" borderColor="gray">
          <Text dimColor>
            💡 Tip: This example showcases all available rendering protocols.
            The Image component will automatically choose the best one for your
            terminal unless you specify a protocol explicitly.
          </Text>
        </Box>
      </Box>
    </TerminalInfoProvider>
  );
}

render(<ProtocolShowcase />);
