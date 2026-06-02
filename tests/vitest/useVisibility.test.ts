import { describe, expect, it } from "vitest";
import type { Position } from "../../src/hooks/usePosition.js";
import type { VisibilityInfo } from "../../src/hooks/useVisibility.js";
import { defaultVisibility } from "../../src/hooks/useVisibility.js";

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    col: 10,
    row: 5,
    width: 40,
    height: 20,
    appWidth: 80,
    appHeight: 25,
    ...overrides,
  };
}

describe("defaultVisibility", () => {
  describe("full visibility", () => {
    it("returns full when image is entirely within viewport", () => {
      const pos = makePosition({ row: 5, height: 20, appHeight: 25 });
      expect(defaultVisibility(pos, 50, 100)).toBe("full");
    });

    it("returns full when app is taller than terminal but image is visible", () => {
      const pos = makePosition({ row: 40, height: 10, appHeight: 80 });
      expect(defaultVisibility(pos, 50, 100)).toBe("full");
    });
  });

  describe("partial visibility", () => {
    it("returns partial when image top is clipped by viewport", () => {
      // Terminal: 50, app: 80. Image at row 15, height 30.
      // viewportStartRow = 50 - 80 + 15 = -15 (top clipped)
      const pos = makePosition({ row: 15, height: 30, appHeight: 80 });
      expect(defaultVisibility(pos, 50, 100)).toBe("partial");
    });

    it("returns partial when image bottom extends past viewport", () => {
      // Terminal: 50, app: 25. Image at row 20, height 10.
      // viewportStartRow = 50 - 25 + 20 = 45
      // viewportEndRow = 55 (> 50)
      const pos = makePosition({ row: 20, height: 10, appHeight: 25 });
      expect(defaultVisibility(pos, 50, 100)).toBe("partial");
    });

    it("returns partial when image extends beyond right viewport edge", () => {
      // col=90, width=20 → endCol=110 > terminalWidth=100, but within app bounds
      const pos = makePosition({ col: 90, width: 20, appWidth: 120 });
      expect(defaultVisibility(pos, 50, 100)).toBe("partial");
    });

    it("returns hidden when image starts beyond app right edge", () => {
      const pos = makePosition({ col: 90, width: 10, appWidth: 80 });
      expect(defaultVisibility(pos, 50, 100)).toBe("hidden");
    });
  });

  describe("hidden visibility", () => {
    it("returns hidden when image is entirely above viewport", () => {
      // Terminal: 50, app: 80. Image at row 0, height 10.
      // viewportStartRow = 50 - 80 + 0 = -30
      // viewportEndRow = -20 (entirely above)
      const pos = makePosition({ row: 0, height: 10, appHeight: 80 });
      expect(defaultVisibility(pos, 50, 100)).toBe("hidden");
    });

    it("returns hidden when image is entirely below viewport", () => {
      // Terminal: 50, app: 25. Image at row 40, height 10.
      // viewportStartRow = 50 - 25 + 40 = 65 (> 50)
      const pos = makePosition({ row: 40, height: 10, appHeight: 25 });
      expect(defaultVisibility(pos, 50, 100)).toBe("hidden");
    });

    it("returns hidden when image is entirely to the right", () => {
      const pos = makePosition({ col: 110, width: 10 });
      expect(defaultVisibility(pos, 50, 100)).toBe("hidden");
    });
  });
});
