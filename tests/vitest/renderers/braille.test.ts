import { describe, expect, it } from "vitest";
import { renderBraille } from "../../../src/renderers/braille.js";
import { makePixelData, solidColor } from "./helpers.js";

describe("renderBraille", () => {
  it("produces correct dimensions", () => {
    const pixels = makePixelData(2, 4, solidColor(128, 128, 128));
    const result = renderBraille(pixels);

    const lines = result.split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBe(1);
  });

  it("all-white pixels produce the braille dots 12345678", () => {
    const pixels = makePixelData(2, 4, solidColor(255, 255, 255, 255));
    const result = renderBraille(pixels);

    expect(result[0]).toBe("\u28ff");
  });

  it("all-black pixels produce empty braille char", () => {
    const pixels = makePixelData(2, 4, solidColor(0, 0, 0, 255));
    const result = renderBraille(pixels);

    expect(result[0]).toBe("\u2800");
  });

  it("renders transparent pixels as whitespace", () => {
    const pixels = makePixelData(2, 4, solidColor(0, 0, 0, 0));
    const result = renderBraille(pixels);

    expect(result[0]).toBe("\u2800");
  });

  it("handles RGB data without alpha", () => {
    const data = Buffer.alloc(2 * 4 * 3);
    for (let i = 0; i < data.length; i += 3) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
    const pixels = {
      data,
      info: { width: 2, height: 4, channels: 3 },
    };
    const result = renderBraille(pixels);

    expect(result[0]).toBe("\u28ff");
  });

  it("handles odd-sized images", () => {
    const pixels = makePixelData(3, 5, solidColor(255, 255, 255, 255));
    const result = renderBraille(pixels);

    const lines = result.split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBe(1);
  });

  it("handles 1x1 minimum image", () => {
    const pixels = makePixelData(1, 1, solidColor(255, 255, 255));
    const result = renderBraille(pixels);

    expect(result.length).toBe(0);
  });
});
