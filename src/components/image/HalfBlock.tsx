import { Box, Newline, Text } from "ink";
import React, { useMemo } from "react";
import { useImage } from "../../hooks/useImage.js";
import { useMeasuredSize } from "../../hooks/useMeasuredSize.js";
import { renderHalfBlock } from "../../renderers/halfBlock.js";
import type { ImageProps } from "./protocol.js";

function HalfBlockImage(props: ImageProps) {
  const { src, width, height, alt, allowPartial } = props;

  const { containerRef, resolvedWidth, resolvedHeight } = useMeasuredSize(
    width,
    height,
  );

  const { imageData, error } = useImage({
    src,
    pixelWidth: resolvedWidth,
    pixelHeight: resolvedHeight * 2,
    mode: "pixels",
  });

  const imageOutput = useMemo(() => {
    if (!imageData) return null;
    return renderHalfBlock(imageData);
  }, [imageData]);

  return (
    <Box
      ref={containerRef}
      flexDirection="column"
      width={width}
      height={height}
    >
      {imageOutput ? (
        imageOutput
          .split("\n")
          // biome-ignore lint/suspicious/noArrayIndexKey: static content, won't change
          .map((line, idx) => <Text key={`${line}-${idx}`}>{line}</Text>)
      ) : (
        <Box flexDirection="column" alignItems="center" justifyContent="center">
          {alt ? (
            <Text color="gray">{alt}</Text>
          ) : error ? (
            <Text color="red">
              X<Newline />
              Load failed
            </Text>
          ) : (
            <Text color="gray">{props.alt || "Loading..."}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default HalfBlockImage;
