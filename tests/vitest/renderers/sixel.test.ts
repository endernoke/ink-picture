import { describe, expect, it } from "vitest";
import { renderSixel } from "../../../src/renderers/sixel.js";
import { makePixelData, solidColor } from "./helpers.js";

describe("renderSixel", () => {
  it("produces a non-empty string", () => {
    const pixels = makePixelData(4, 4, solidColor(255, 0, 0, 255));
    const result = renderSixel(pixels);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles transparent pixels", () => {
    const pixels = makePixelData(2, 2, solidColor(255, 255, 255, 0));
    const result = renderSixel(pixels);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
