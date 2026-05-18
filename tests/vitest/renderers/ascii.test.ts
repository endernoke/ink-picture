import chalk from "chalk";
import { beforeAll, describe, expect, it } from "vitest";
import { renderAscii } from "../../../src/renderers/ascii.js";
import { makePixelData, solidColor } from "./helpers.js";

beforeAll(() => {
  chalk.level = 3;
});

describe("renderAscii", () => {
  it("produces correct dimensions", () => {
    const pixels = makePixelData(4, 2, solidColor(128, 128, 128));
    const result = renderAscii(pixels, { colored: false });

    const lines = result.split("\n");
    expect(lines.length).toBe(2);
    expect(lines[0].length).toBe(4);
    expect(lines[1].length).toBe(4);
  });

  it("maps white (255,255,255,255) to the darkest character ($)", () => {
    const pixels = makePixelData(1, 1, solidColor(255, 255, 255, 255));
    const result = renderAscii(pixels, { colored: false });

    expect(result[0]).toBe("$");
  });

  it("maps transparent-black (0,0,0,0) to the lightest character (space)", () => {
    const pixels = makePixelData(1, 1, solidColor(0, 0, 0, 0));
    const result = renderAscii(pixels, { colored: false });

    expect(result[0]).toBe(" ");
  });

  it("produces ANSI color codes when colored is true", () => {
    const pixels = makePixelData(2, 1, solidColor(255, 0, 0, 255));
    const result = renderAscii(pixels, { colored: true });

    expect(result).toContain("\x1b[");
  });

  it("does not produce ANSI color codes when colored is false", () => {
    const pixels = makePixelData(2, 1, solidColor(255, 0, 0, 255));
    const result = renderAscii(pixels, { colored: false });

    expect(result).not.toContain("\x1b[");
  });

  it("handles 1x1 minimum image", () => {
    const pixels = makePixelData(1, 1, solidColor(100, 100, 100));
    const result = renderAscii(pixels, { colored: false });

    expect(result).toMatch(/^.$/);
  });
});
