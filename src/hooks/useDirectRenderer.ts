import { useLayoutEffect, useRef } from "react";
import { cursorForward, cursorUp } from "../utils/ansiEscapes.js";
import bgColorize from "../utils/bgColorize.js";
import type { Position } from "./usePosition.js";
import { defaultVisibility } from "./useVisibility.js";

interface DirectRendererOptions {
  enabled: boolean;
  imageOutput: string;
  position: Position | undefined;
  stdout: NodeJS.WriteStream;
  width: number;
  height: number;
  backgroundColor?: string;
}

export function useDirectRenderer(options: DirectRendererOptions) {
  const {
    enabled,
    imageOutput,
    position,
    stdout,
    width,
    height,
    backgroundColor,
  } = options;
  const shouldCleanupRef = useRef(true);
  const previousBboxRef = useRef<
    { row: number; col: number; width: number; height: number } | undefined
  >(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useLayoutEffect(() => {
    if (!enabled) return;
    if (!position) return;
    if (defaultVisibility(position, stdout.rows, stdout.columns) !== "full")
      return;

    shouldCleanupRef.current = true;

    function onExit() {
      shouldCleanupRef.current = false;
    }
    function onSigInt() {
      shouldCleanupRef.current = false;
      process.exit();
    }
    process.on("exit", onExit);
    process.on("SIGINT", onSigInt);
    process.on("SIGTERM", onSigInt);

    timeoutRef.current = setTimeout(() => {
      stdout.write("\x1b7"); // Save cursor position
      stdout.write(
        cursorUp(position.appHeight - position.row, {
          appHeight: position.appHeight,
          terminalHeight: stdout.rows,
        }),
      );
      stdout.write("\r");
      stdout.write(cursorForward(position.col));
      stdout.write(imageOutput);
      stdout.write("\x1b8"); // Restore cursor position

      previousBboxRef.current = {
        row: stdout.rows - position.appHeight + position.row,
        col: position.col,
        width,
        height,
      };
    }, 100);

    return () => {
      process.removeListener("exit", onExit);
      process.removeListener("SIGINT", onSigInt);
      process.removeListener("SIGTERM", onSigInt);

      if (!shouldCleanupRef.current) return;
      clearTimeout(timeoutRef.current);

      const bbox = previousBboxRef.current;
      if (!bbox) return;

      stdout.write("\x1b7");
      stdout.write(
        cursorUp(position.appHeight - position.row, {
          appHeight: position.appHeight,
          terminalHeight: stdout.rows,
        }),
      );
      for (let i = 0; i < bbox.height; i++) {
        stdout.write("\r");
        stdout.write(cursorForward(bbox.col));
        if (backgroundColor) {
          stdout.write(bgColorize(" ".repeat(bbox.width), backgroundColor));
        } else {
          stdout.write(" ".repeat(bbox.width));
        }
        stdout.write("\n");
      }
      stdout.write("\x1b8");
    };
  });
}
