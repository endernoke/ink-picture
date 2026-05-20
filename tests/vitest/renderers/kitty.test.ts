import { describe, expect, it } from "vitest";
import {
  makeKittyDeletion,
  makeKittyPlacement,
  makeKittyTransmitChunks,
} from "../../../src/renderers/kitty.js";

describe("makeKittyTransmitChunks", () => {
  it("produces a single chunk for small data", () => {
    const smallData = Buffer.from("AAA").toString("base64");
    const chunks = makeKittyTransmitChunks(1, smallData);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain(`i=1`);
    expect(chunks[0]).toContain("f=100,t=d");
    expect(chunks[0]).toContain("m=0");
    expect(chunks[0]).toContain("q=2");
    expect(chunks[0]).toContain(smallData);
    expect(chunks[0]).toContain("\x1b_G");
    expect(chunks[0]).toContain("\x1b\\");
  });

  it("produces multiple chunks for large data", () => {
    const chunkSize = 4096;
    const largeData = "A".repeat(chunkSize * 2 + 100);

    const chunks = makeKittyTransmitChunks(42, largeData);

    expect(chunks.length).toBeGreaterThanOrEqual(3);

    expect(chunks[0]).toContain("f=100,t=d");
    expect(chunks[0]).toContain("i=42");
    expect(chunks[0]).toContain("m=1");

    for (let i = 1; i < chunks.length - 1; i++) {
      expect(chunks[i]).toContain("m=1");
      expect(chunks[i]).not.toContain("f=100");
      expect(chunks[i]).not.toContain("t=d");
    }

    expect(chunks[chunks.length - 1]).toContain("m=0");
  });

  it("uses a custom chunk size", () => {
    const smallData = "A".repeat(50);
    const chunks = makeKittyTransmitChunks(1, smallData, 10);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it("handles exact chunk size boundary", () => {
    const chunkSize = 4096;
    const exactData = "A".repeat(chunkSize);

    const chunks = makeKittyTransmitChunks(1, exactData, chunkSize);

    // Should be a single chunk since data fits exactly
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("m=0");
  });
});

describe("makeKittyPlacement", () => {
  it("produces correct placement escape sequence with defaults", () => {
    const result = makeKittyPlacement(15);

    expect(result).toContain("a=p");
    expect(result).toContain("i=15");
    expect(result).toContain("p=1");
    expect(result).toContain("C=1");
    expect(result).toContain("q=2");
    expect(result.startsWith("\x1b_G")).toBe(true);
    expect(result.endsWith("\x1b\\")).toBe(true);
  });

  it("uses provided placement ID", () => {
    const result = makeKittyPlacement(20, 5);

    expect(result).toContain("p=5");
  });
});

describe("makeKittyDeletion", () => {
  it("produces correct deletion escape sequence (delete image data)", () => {
    const result = makeKittyDeletion(25);

    expect(result).toContain("a=d");
    expect(result).toContain("d=I");
    expect(result).toContain("i=25");
    expect(result).not.toContain("p=");
    expect(result.startsWith("\x1b_G")).toBe(true);
    expect(result.endsWith("\x1b\\")).toBe(true);
  });

  it("produces correct placement deletion escape sequence", () => {
    const result = makeKittyDeletion(42, 1);

    expect(result).toContain("a=d");
    expect(result).toContain("d=i");
    expect(result).toContain("p=1");
    expect(result).toContain("i=42");
    expect(result.startsWith("\x1b_G")).toBe(true);
    expect(result.endsWith("\x1b\\")).toBe(true);
  });

  it("uses provided placement ID for placement deletion", () => {
    const result = makeKittyDeletion(10, 7);
    expect(result).toContain("p=7");
  });
});
