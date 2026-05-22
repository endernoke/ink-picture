import { useEffect, useLayoutEffect, useRef } from "react";
import { useInkPictureConfig } from "../InkPictureProvider.js";
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

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const config = useInkPictureConfig();
  const configRef = useRef(config);
  configRef.current = config;

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
      previousBboxRef.current = writeImageToStdout(
        position,
        imageOutput,
        stdout,
        width,
        height,
      );
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

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function schedule() {
      timeout = setTimeout(tick, configRef.current.pollInterval);
      timeout.unref();
    }

    function tick() {
      const opt = optionsRef.current;
      if (!opt.enabled || !opt.position) {
        schedule();
        return;
      }
      if (
        defaultVisibility(opt.position, opt.stdout.rows, opt.stdout.columns) !==
        "full"
      ) {
        schedule();
        return;
      }

      previousBboxRef.current = writeImageToStdout(
        opt.position,
        opt.imageOutput,
        opt.stdout,
        opt.width,
        opt.height,
      );

      schedule();
    }

    schedule();

    return () => {
      clearTimeout(timeout);
    };
  }, []);
}
