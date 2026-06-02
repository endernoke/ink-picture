import { useMemo } from "react";
import type { Position } from "./usePosition.js";

export type Visibility = "full" | "partial" | "hidden";

export interface VisibilityInfo {
  position: Position;
  terminalWidth: number;
  terminalHeight: number;
  defaultVisibility: Visibility;
}

export type GetVisibility = (info: VisibilityInfo) => Visibility;

export function defaultVisibility(
  position: Position,
  terminalHeight: number,
  terminalWidth: number,
): Visibility {
  const viewportStartRow = terminalHeight - position.appHeight + position.row;
  const viewportEndRow = viewportStartRow + position.height;
  const inAppStartRow = position.row;
  const inAppEndRow = inAppStartRow + position.height;

  if (
    viewportEndRow <= 0 ||
    inAppEndRow <= 0 ||
    viewportStartRow >= terminalHeight ||
    inAppStartRow >= position.appHeight
  ) {
    return "hidden";
  }

  const viewportEndCol = position.col + position.width;
  if (
    viewportEndCol <= 0 ||
    position.col >= terminalWidth ||
    position.col >= position.appWidth
  ) {
    return "hidden";
  }

  if (
    viewportStartRow < 0 ||
    inAppStartRow < 0 ||
    viewportEndRow > terminalHeight ||
    inAppEndRow > position.appHeight ||
    position.col < 0 ||
    viewportEndCol > terminalWidth ||
    viewportEndCol > position.appWidth
  ) {
    return "partial";
  }

  return "full";
}

export function useVisibility(
  position: Position | undefined,
  terminalHeight: number,
  terminalWidth: number,
  getVisibility?: GetVisibility,
): Visibility {
  return useMemo(() => {
    if (!position) return "hidden";

    const visibility = defaultVisibility(
      position,
      terminalHeight,
      terminalWidth,
    );

    if (getVisibility) {
      return getVisibility({
        position,
        terminalWidth,
        terminalHeight,
        defaultVisibility: visibility,
      });
    }

    return visibility;
  }, [position, terminalHeight, terminalWidth, getVisibility]);
}
