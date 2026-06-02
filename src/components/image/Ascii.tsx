import { Text } from "ink";
import React, { useMemo } from "react";
import { useImage } from "../../hooks/useImage.js";
import { useMeasuredSize } from "../../hooks/useMeasuredSize.js";
import { useTerminalInfo } from "../../InkPictureProvider.js";
import { renderAscii } from "../../renderers/ascii.js";
import ImageBox from "../ImageBox.js";
import type { ImageProps } from "./protocol.js";

function AsciiImage(props: ImageProps) {
  const terminalInfo = useTerminalInfo();
  const { src, width, height, alt } = props;

  const { containerRef, resolvedWidth, resolvedHeight } = useMeasuredSize(
    width,
    height,
  );

  const { imageData, error } = useImage({
    src,
    pixelWidth: resolvedWidth,
    pixelHeight: resolvedHeight,
    mode: "pixels",
  });

  const imageOutput = useMemo(() => {
    if (!imageData) return null;
    return renderAscii(imageData, { colored: terminalInfo?.supportsColor });
  }, [imageData, terminalInfo?.supportsColor]);

  return (
    <ImageBox
      ref={containerRef}
      width={width}
      height={height}
      alt={alt}
      error={error}
      loaded={!!imageOutput}
    >
      {imageOutput?.split("\n").map((line, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static content, won't change
        <Text key={`${line}-${idx}`}>{line}</Text>
      ))}
    </ImageBox>
  );
}

export default AsciiImage;
