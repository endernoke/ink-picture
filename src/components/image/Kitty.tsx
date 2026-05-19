import { useStdout } from "ink";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTerminalInfo } from "../../context/TerminalInfo.js";
import { useImage } from "../../hooks/useImage.js";
import { useMeasuredSize } from "../../hooks/useMeasuredSize.js";
import usePosition from "../../hooks/usePosition.js";
import { defaultVisibility } from "../../hooks/useVisibility.js";
import {
  makeKittyDeletion,
  makeKittyPlacement,
  makeKittyTransmitChunks,
} from "../../renderers/kitty.js";
import { cursorForward, cursorUp } from "../../utils/ansiEscapes.js";
import generateKittyId from "../../utils/generateKittyId.js";
import ImageBox from "../ImageBox.js";
import type { ImageProps } from "./protocol.js";

function KittyImage(props: ImageProps) {
  const terminalInfo = useTerminalInfo();
  const { stdout } = useStdout();
  const { src, width, height, alt } = props;

  const { containerRef, resolvedWidth, resolvedHeight } = useMeasuredSize(
    width,
    height,
  );

  const componentPosition = usePosition(containerRef);

  const pixelWidth = resolvedWidth * (terminalInfo?.cellWidth ?? 0);
  const pixelHeight = resolvedHeight * (terminalInfo?.cellHeight ?? 0);

  const { imageData, error } = useImage({
    src,
    pixelWidth,
    pixelHeight,
    mode: "png",
  });

  const [imageId, setImageId] = useState<number | undefined>(undefined);
  const shouldCleanupRef = useRef(true);

  useEffect(() => {
    if (!imageData) return;

    const id = generateKittyId();
    const base64Data = imageData.data.toString("base64");
    const chunks = makeKittyTransmitChunks(id, base64Data);
    for (const chunk of chunks) {
      stdout.write(chunk);
    }
    setImageId(id);
  }, [imageData, stdout.write]);

  useEffect(() => {
    if (!imageId) return;
    if (!componentPosition) return;
    if (
      defaultVisibility(componentPosition, stdout.rows, stdout.columns) !==
      "full"
    ) {
      return;
    }

    stdout.write("\x1b7");
    stdout.write(
      cursorUp(componentPosition.appHeight - componentPosition.row, {
        appHeight: componentPosition.appHeight,
        terminalHeight: stdout.rows,
      }),
    );
    stdout.write("\r");
    stdout.write(cursorForward(componentPosition.col));

    stdout.write(makeKittyPlacement(imageId, 1));

    stdout.write("\x1b8");
  });

  const onExit = useCallback(() => {
    shouldCleanupRef.current = false;
  }, []);

  const onSigInt = useCallback(() => {
    shouldCleanupRef.current = false;
    process.exit();
  }, []);

  useEffect(() => {
    process.on("exit", onExit);
    process.on("SIGINT", onSigInt);
    process.on("SIGTERM", onSigInt);

    return () => {
      process.removeListener("exit", onExit);
      process.removeListener("SIGINT", onSigInt);
      process.removeListener("SIGTERM", onSigInt);
      if (!shouldCleanupRef.current) return;
      if (!imageId) return;

      stdout.write(makeKittyDeletion(imageId));
    };
  }, [imageId, onExit, onSigInt, stdout.write]);

  return (
    <ImageBox
      ref={containerRef}
      width={width}
      height={height}
      alt={alt}
      error={error}
      loaded={!!imageId}
    />
  );
}

export default KittyImage;
