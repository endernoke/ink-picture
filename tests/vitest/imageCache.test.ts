import { Jimp } from "jimp";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchImage } from "../../src/utils/image.js";
import {
  clearImageCache,
  getCachedImage,
  getCacheSize,
  setCachedImage,
} from "../../src/utils/imageCache.js";

const __dirname = new URL(".", import.meta.url).pathname;

const SAMPLE = `${__dirname}../../example/images/full.png`;

function makeImage(color = 0xff0000ff): Jimp {
  return new Jimp({ width: 4, height: 4, color });
}

describe("imageCache", () => {
  beforeEach(() => {
    clearImageCache();
  });

  it("caches images", async () => {
    expect(getCacheSize()).toBe(0);
    const img = makeImage();
    setCachedImage("test-key", img);
    expect(getCacheSize()).toBe(1);
    expect(getCachedImage("test-key")?.bitmap.data).toEqual(img.bitmap.data);
  });

  it("cache is immutable", async () => {
    const image = makeImage();
    setCachedImage("test-key", image);

    const hit1 = getCachedImage("test-key");
    const hit2 = getCachedImage("test-key");

    expect(hit1?.bitmap.data).not.toBe(hit2?.bitmap.data);
    expect(hit1?.bitmap.data).toEqual(hit2?.bitmap.data);
  });

  it("clear empties the cache", async () => {
    setCachedImage("a", makeImage());
    setCachedImage("b", makeImage());
    expect(getCacheSize()).toBe(2);

    clearImageCache();
    expect(getCacheSize()).toBe(0);
    expect(getCachedImage("a")).toBeUndefined();
  });

  it("evicts least recently used entries when full", async () => {
    for (let i = 0; i < 12; i++) {
      setCachedImage(`img-${i}`, makeImage());
    }

    expect(getCachedImage("img-0")).toBeUndefined();
    expect(getCachedImage("img-1")).toBeUndefined();
    for (let i = 2; i < 12; i++) {
      expect(getCachedImage(`img-${i}`)).toBeDefined();
    }
  });

  it("most-recently-used entry survives eviction", async () => {
    for (let i = 0; i < 10; i++) {
      setCachedImage(`img-${i}`, makeImage());
    }

    getCachedImage("img-0");

    setCachedImage("overflow", makeImage());

    expect(getCachedImage("img-0")).toBeDefined();
    expect(getCachedImage("img-1")).toBeUndefined();
  });

  describe("environment variables", () => {
    afterAll(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it("defaults to 10 entries", async () => {
      vi.stubEnv("INK_PICTURE_CACHE_SIZE", undefined);
      const mod = await import("../../src/utils/imageCache.js");
      expect(mod.getCacheSize()).toBe(0);

      for (let i = 0; i < 12; i++) {
        mod.setCachedImage(`img-${i}`, makeImage());
      }

      expect(mod.getCacheSize()).toBe(10);

      mod.clearImageCache();
    });

    it("INK_PICTURE_CACHE_SIZE=0 disables the cache", async () => {
      vi.stubEnv("INK_PICTURE_CACHE_SIZE", "0");
      vi.resetModules();

      const mod = await import("../../src/utils/imageCache.js");
      expect(mod.getCacheSize()).toBe(0);

      mod.setCachedImage("test", makeImage());
      expect(mod.getCacheSize()).toBe(0);
    });

    it("INK_PICTURE_CACHE_SIZE sets the max entries", async () => {
      vi.stubEnv("INK_PICTURE_CACHE_SIZE", "3");
      vi.resetModules();

      const mod = await import("../../src/utils/imageCache.js");

      for (let i = 0; i < 5; i++) {
        mod.setCachedImage(`img-${i}`, makeImage());
      }

      expect(mod.getCacheSize()).toBe(3);

      expect(mod.getCachedImage("img-0")).toBeUndefined();
      expect(mod.getCachedImage("img-1")).toBeUndefined();
      expect(mod.getCachedImage("img-2")).toBeDefined();

      mod.clearImageCache();
    });

    it("INK_PICTURE_CACHE_SIZE defaults to 10 for invalid values", async () => {
      for (const value of ["invalid", "-1"]) {
        vi.stubEnv("INK_PICTURE_CACHE_SIZE", value);
        vi.resetModules();

        const mod = await import("../../src/utils/imageCache.js");

        for (let i = 0; i < 12; i++) {
          mod.setCachedImage(`img-${i}`, makeImage());
        }

        expect(mod.getCacheSize()).toBe(10);

        mod.clearImageCache();
      }
    });
  });
});
