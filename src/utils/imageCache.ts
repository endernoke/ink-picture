import { getCacheSize as getMaxCacheSize } from "../config.js";
import type { JimpImage } from "./image.js";

class ImageCache {
  #cache = new Map<string, JimpImage>();
  #maxEntries: number;

  constructor(maxEntries: number) {
    this.#maxEntries = Math.max(1, maxEntries);
  }

  get(key: string): JimpImage | undefined {
    const entry = this.#cache.get(key);
    if (!entry) return undefined;

    this.#cache.delete(key);
    this.#cache.set(key, entry);

    return entry.clone();
  }

  set(key: string, image: JimpImage): void {
    this.#cache.delete(key);

    while (this.#cache.size >= this.#maxEntries) {
      const lru = this.#cache.keys().next().value;
      if (lru !== undefined) this.#cache.delete(lru);
    }

    this.#cache.set(key, image.clone());
  }

  clear(): void {
    this.#cache.clear();
  }

  get size(): number {
    return this.#cache.size;
  }
}

let cache: ImageCache | null | undefined;

function getOrCreateCache(): ImageCache | null {
  if (cache !== undefined) return cache;
  const maxEntries = getMaxCacheSize();
  cache = maxEntries === 0 ? null : new ImageCache(maxEntries);
  return cache;
}

export function getCachedImage(src: string): JimpImage | undefined {
  return getOrCreateCache()?.get(src);
}

export function setCachedImage(src: string, image: JimpImage): void {
  getOrCreateCache()?.set(src, image);
}

export function clearImageCache(): void {
  getOrCreateCache()?.clear();
}

export function getCacheSize(): number {
  return getOrCreateCache()?.size ?? 0;
}
