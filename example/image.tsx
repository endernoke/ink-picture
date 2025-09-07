import React, { useState, useEffect } from "react";
import Image from "../src/components/image/index.js";
import { Text, Box, render, useInput } from "ink";
import {
  TerminalInfoProvider,
  useTerminalCapabilities,
} from "../src/context/TerminalInfo.js";

// Demo image - a simple test image that should work reliably
const DEMO_IMAGE = "https://sipi.usc.edu/database/preview/misc/4.1.05.png";

type ProtocolConfig = {
  name: string;
  protocol: string;
  description: string;
  requirements: string;
  getSupportStatus: (caps: any) => {
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
];

function ProtocolDemo({ config }: { config: ProtocolConfig }) {
  const capabilities = useTerminalCapabilities();
  const supportInfo = config.getSupportStatus(capabilities);

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
            src={DEMO_IMAGE}
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

function TerminalInfo() {
  const capabilities = useTerminalCapabilities();

  if (!capabilities) {
    return (
      <Box marginBottom={2}>
        <Text color="yellow">Detecting terminal capabilities...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={2}>
      <Text bold color="magenta">
        Terminal Capabilities Detected:
      </Text>
      <Box marginLeft={2} flexDirection="column">
        <Text>Unicode: {capabilities.supportsUnicode ? "✓ Yes" : "✗ No"}</Text>
        <Text>Color: {capabilities.supportsColor ? "✓ Yes" : "✗ No"}</Text>
        <Text>
          Sixel Graphics:{" "}
          {capabilities.supportsSixelGraphics ? "✓ Yes" : "✗ No"}
        </Text>
        <Text>
          Kitty Graphics:{" "}
          {capabilities.supportsKittyGraphics ? "✓ Yes" : "✗ No"}
        </Text>
      </Box>
    </Box>
  );
}

function ProtocolShowcase() {
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.exit();
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

        {/* <TerminalInfo /> */}

        <Box flexDirection="row">
          {protocols.map((config) => (
            <ProtocolDemo key={config.protocol} config={config} />
          ))}
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
