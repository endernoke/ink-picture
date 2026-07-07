import { Text } from "ink";
import React, { useMemo } from "react";
import { useImage } from "../../hooks/useImage.js";
import { useMeasuredSize } from "../../hooks/useMeasuredSize.js";
import { renderBraille } from "../../renderers/braille.js";
import ImageBox from "../ImageBox.js";
import type { ImageProps } from "./protocol.js";

function BrailleImage(props: ImageProps) {
  const { src, width, height, alt, objectFit } = props;

  const { containerRef, resolvedWidth, resolvedHeight } = useMeasuredSize(
    width,
    height,
  );

  const { imageData, error } = useImage({
    src,
    pixelWidth: resolvedWidth * 2,
    pixelHeight: resolvedHeight * 4,
    mode: "pixels",
    objectFit,
  });

  const imageOutput = useMemo(() => {
    if (!imageData) return null;
    return renderBraille(imageData);
  }, [imageData]);

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

export default BrailleImage;
