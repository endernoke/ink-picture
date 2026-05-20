import type { JimpImage } from "./image.js";

const ENV_MAX_ENTRIES = "INK_PICTURE_CACHE_SIZE";

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

function parseCacheSize(): number {
  const raw = process.env[ENV_MAX_ENTRIES];
  if (raw === undefined) return 10;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 10;
  return n;
}

const maxEntries = parseCacheSize();
const cache = maxEntries === 0 ? null : new ImageCache(maxEntries);

export function getCachedImage(src: string): JimpImage | undefined {
  return cache?.get(src);
}

export function setCachedImage(src: string, image: JimpImage): void {
  cache?.set(src, image);
}

export function clearImageCache(): void {
  cache?.clear();
}

export function getCacheSize(): number {
  return cache?.size ?? 0;
}
