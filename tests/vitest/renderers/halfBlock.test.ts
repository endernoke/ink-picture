import { stripVTControlCharacters } from "node:util";
import chalk from "chalk";
import { beforeAll, describe, expect, it } from "vitest";
import { renderHalfBlock } from "../../../src/renderers/halfBlock.js";
import { makePixelData, solidColor } from "./helpers.js";

beforeAll(() => {
  chalk.level = 3;
});

describe("renderHalfBlock", () => {
  it("produces correct dimensions", () => {
    const pixels = makePixelData(4, 2, solidColor(100, 100, 100));
    const result = renderHalfBlock(pixels);

    const lines = stripVTControlCharacters(result).split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBe(4);
  });

  it("produces correct dimensions for larger image", () => {
    const pixels = makePixelData(16, 16, solidColor(100, 100, 100));
    const result = renderHalfBlock(pixels);

    const lines = stripVTControlCharacters(result).split("\n");
    expect(lines.length).toBe(8);
    expect(lines[0].length).toBe(16);
    expect(lines[7].length).toBe(16);
  });

  it("contains ANSI color codes", () => {
    const pixels = makePixelData(2, 2, solidColor(255, 0, 0, 255));
    const result = renderHalfBlock(pixels);

    expect(result).toContain("\x1b[");
  });

  it("handles 3-channel data (no alpha)", () => {
    const data = Buffer.alloc(1 * 2 * 3);
    data[0] = 255;
    data[1] = 0;
    data[2] = 0;
    data[3] = 0;
    data[4] = 0;
    data[5] = 255;
    const pixels = {
      data,
      info: { width: 1, height: 2, channels: 3 },
    };
    const result = renderHalfBlock(pixels);

    expect(result).toContain("\u2584");
    expect(result).toContain("\x1b[");
  });

  it("handles 1x1 pixel image", () => {
    const pixels = makePixelData(1, 1, solidColor(0, 255, 0));
    const result = renderHalfBlock(pixels);

    expect(result.length).toBe(0);
  });
});
