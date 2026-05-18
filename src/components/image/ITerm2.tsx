import { Box, Newline, Text, useStdout } from "ink";
import React, { useMemo } from "react";
import { useTerminalInfo } from "../../context/TerminalInfo.js";
import useBackgroundColor from "../../hooks/useBackgroundColor.js";
import { useDirectRenderer } from "../../hooks/useDirectRenderer.js";
import { useImage } from "../../hooks/useImage.js";
import { useMeasuredSize } from "../../hooks/useMeasuredSize.js";
import usePosition from "../../hooks/usePosition.js";
import { renderITerm2 } from "../../renderers/iterm2.js";
import type { ImageProps } from "./protocol.js";

function ITerm2Image(props: ImageProps) {
  const terminalInfo = useTerminalInfo();
  const { stdout } = useStdout();
  const { src, width, height, alt, allowPartial } = props;

  const { containerRef, resolvedWidth, resolvedHeight } = useMeasuredSize(
    width,
    height,
  );

  const componentPosition = usePosition(containerRef);
  const inheritedBackgroundColor = useBackgroundColor(containerRef);

  const pixelWidth = resolvedWidth * (terminalInfo?.cellWidth ?? 0);
  const pixelHeight = resolvedHeight * (terminalInfo?.cellHeight ?? 0);

  const { imageData, error } = useImage({
    src,
    pixelWidth,
    pixelHeight,
    mode: "png",
  });

  const imageOutput = useMemo(() => {
    if (!imageData) return undefined;
    return renderITerm2(imageData, { width: pixelWidth, height: pixelHeight });
  }, [imageData, pixelWidth, pixelHeight]);

  useDirectRenderer({
    enabled: !!imageOutput && !!componentPosition,
    imageOutput: imageOutput ?? "",
    position: componentPosition,
    stdout,
    width: resolvedWidth,
    height: resolvedHeight,
    backgroundColor: inheritedBackgroundColor,
  });

  return (
    <Box
      ref={containerRef}
      flexDirection="column"
      width={width}
      height={height}
    >
      {imageOutput ? (
        <Text color="gray" wrap="wrap">
          {alt ?? "Loading..."}
        </Text>
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
            <Text color="gray">"Loading..."</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ITerm2Image;
