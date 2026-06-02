import type { JimpImage } from "./image.js";

export class ImageCache {
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
