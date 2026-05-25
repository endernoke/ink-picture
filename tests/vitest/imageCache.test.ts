import { Jimp } from "jimp";
import { describe, expect, it } from "vitest";
import { ImageCache } from "../../src/utils/imageCache.js";

function makeImage(color = 0xff0000ff): Jimp {
  return new Jimp({ width: 4, height: 4, color });
}

describe("ImageCache", () => {
  it("caches images", () => {
    const cache = new ImageCache(10);
    expect(cache.size).toBe(0);
    const img = makeImage();
    cache.set("test-key", img);
    expect(cache.size).toBe(1);
    expect(cache.get("test-key")?.bitmap.data).toEqual(img.bitmap.data);
  });

  it("cache is immutable", () => {
    const cache = new ImageCache(10);
    const image = makeImage();
    cache.set("test-key", image);

    const hit1 = cache.get("test-key");
    const hit2 = cache.get("test-key");

    expect(hit1?.bitmap.data).not.toBe(hit2?.bitmap.data);
    expect(hit1?.bitmap.data).toEqual(hit2?.bitmap.data);
  });

  it("clear empties the cache", () => {
    const cache = new ImageCache(10);
    cache.set("a", makeImage());
    cache.set("b", makeImage());
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts least recently used entries when full", () => {
    const cache = new ImageCache(10);
    for (let i = 0; i < 12; i++) {
      cache.set(`img-${i}`, makeImage());
    }

    expect(cache.get("img-0")).toBeUndefined();
    expect(cache.get("img-1")).toBeUndefined();
    for (let i = 2; i < 12; i++) {
      expect(cache.get(`img-${i}`)).toBeDefined();
    }
  });

  it("most-recently-used entry survives eviction", () => {
    const cache = new ImageCache(10);
    for (let i = 0; i < 10; i++) {
      cache.set(`img-${i}`, makeImage());
    }

    cache.get("img-0");

    cache.set("overflow", makeImage());

    expect(cache.get("img-0")).toBeDefined();
    expect(cache.get("img-1")).toBeUndefined();
  });
});
