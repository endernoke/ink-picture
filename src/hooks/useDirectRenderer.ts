import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useOnRender } from "../InkPictureProvider.js";
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

function writeImageToStdout(
  pos: Position,
  output: string,
  stream: NodeJS.WriteStream,
  w: number,
  h: number,
): { row: number; col: number; width: number; height: number } {
  stream.write("\x1b7");
  stream.write(
    cursorUp(pos.appHeight - pos.row, {
      appHeight: pos.appHeight,
      terminalHeight: stream.rows,
    }),
  );
  stream.write("\r");
  stream.write(cursorForward(pos.col));
  stream.write(output);
  stream.write("\x1b8");

  return {
    row: stream.rows - pos.appHeight + pos.row,
    col: pos.col,
    width: w,
    height: h,
  };
}

export function useDirectRenderer(options: DirectRendererOptions) {
  const { position, stdout, backgroundColor } = options;
  const shouldCleanupRef = useRef(true);
  const previousBboxRef = useRef<
    { row: number; col: number; width: number; height: number } | undefined
  >(undefined);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const writeNow = useCallback(() => {
    const opt = optionsRef.current;
    if (!opt.enabled || !opt.position) return;
    if (
      defaultVisibility(opt.position, opt.stdout.rows, opt.stdout.columns) !==
      "full"
    )
      return;

    previousBboxRef.current = writeImageToStdout(
      opt.position,
      opt.imageOutput,
      opt.stdout,
      opt.width,
      opt.height,
    );
  }, []);

  // Repaint after every React render commit, since Ink clears the terminal
  // on each render cycle, wiping any direct-to-stdout image output.
  useOnRender(writeNow);

  useLayoutEffect(() => {
    return () => {
      if (!shouldCleanupRef.current) return;

      const bbox = previousBboxRef.current;
      if (!bbox || !position) return;

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

  useEffect(() => {
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

    return () => {
      process.removeListener("exit", onExit);
      process.removeListener("SIGINT", onSigInt);
      process.removeListener("SIGTERM", onSigInt);
    };
  }, []);
}
