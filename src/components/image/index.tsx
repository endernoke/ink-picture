import { Box, useIsScreenReaderEnabled, useStdout } from "ink";
import React, { useMemo } from "react";
import { useTerminalInfo } from "../../context/TerminalInfo.js";
import { useMeasuredSize } from "../../hooks/useMeasuredSize.js";
import usePosition from "../../hooks/usePosition.js";
import useProtocol from "../../hooks/useProtocol.js";
import type { GetVisibility } from "../../hooks/useVisibility.js";
import { useVisibility } from "../../hooks/useVisibility.js";
import AsciiImage from "./Ascii.js";
import BrailleImage from "./Braille.js";
import HalfBlockImage from "./HalfBlock.js";
import ITerm2Image from "./ITerm2.js";
import KittyImage from "./Kitty.js";
import type { ImageProps } from "./protocol.js";
import SixelImage from "./Sixel.js";

const imageProtocols = {
  ascii: AsciiImage,
  braille: BrailleImage,
  halfBlock: HalfBlockImage,
  iterm2: ITerm2Image,
  kitty: KittyImage,
  sixel: SixelImage,
};

export type ImageProtocolName = keyof typeof imageProtocols;

const ImageRenderer = (props: ImageProps & { protocol: ImageProtocolName }) => {
  const ProtocolComponent = imageProtocols[props.protocol];
  return <ProtocolComponent {...props} />;
};

type ImageComponentProps = Omit<ImageProps, "width" | "height"> & {
  width?: number | string;
  height?: number | string;
  protocol?: ImageProtocolName;
  getVisibility?: GetVisibility;
};

function Image({
  protocol: specifiedProtocol,
  getVisibility,
  width = "100%",
  height = "100%",
  ...props
}: ImageComponentProps) {
  const isScreenReaderEnabled = useIsScreenReaderEnabled();
  const terminalInfo = useTerminalInfo();
  const { stdout } = useStdout();
  const protocol = useProtocol(specifiedProtocol);

  const { containerRef, resolvedWidth, resolvedHeight } = useMeasuredSize(
    width,
    height,
  );

  const position = usePosition(containerRef);
  const visibility = useVisibility(
    position,
    stdout.rows,
    stdout.columns,
    getVisibility,
  );

  const effectiveProtocol = useMemo((): ImageProtocolName => {
    if (specifiedProtocol) return specifiedProtocol;
    if (visibility === "full") return protocol;
    if (
      protocol === "ascii" ||
      protocol === "braille" ||
      protocol === "halfBlock"
    )
      return protocol;
    if (terminalInfo.supportsUnicode && terminalInfo.supportsColor)
      return "halfBlock";
    if (terminalInfo.supportsUnicode) return "braille";
    return "ascii";
  }, [
    visibility,
    protocol,
    specifiedProtocol,
    terminalInfo.supportsUnicode,
    terminalInfo.supportsColor,
  ]);

  if (isScreenReaderEnabled) {
    const { src, alt } = props;
    const label = `image: ${alt || (typeof src === "string" ? src : "binary image data")}`;

    return (
      <Box
        ref={containerRef}
        width={width}
        height={height}
        aria-label={label}
        flexDirection="column"
      />
    );
  }

  return (
    <Box
      ref={containerRef}
      width={width}
      height={height}
      flexDirection="column"
    >
      <ImageRenderer
        protocol={effectiveProtocol}
        key={effectiveProtocol}
        width={resolvedWidth}
        height={resolvedHeight}
        {...props}
      />
    </Box>
  );
}

export default Image;
