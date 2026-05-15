import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchImage } from "../../src/utils/image.js";

const sampleImage = "example/images/full.png";
const sampleImagePath = resolve(process.cwd(), sampleImage);

let server: ReturnType<typeof createServer>;
let baseUrl: string;

beforeAll(async () => {
  const imageBuffer = await readFile(sampleImagePath);

  server = createServer((req, res) => {
    if (req.url === "/image.png") {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(imageBuffer);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("fetchImage", () => {
  describe("local file paths", () => {
    it("loads a valid local image file", async () => {
      const image = await fetchImage(sampleImage);
      expect(image).toBeDefined();
      expect(image?.bitmap.width).toBeGreaterThan(0);
      expect(image?.bitmap.height).toBeGreaterThan(0);
    });

    it("returns undefined for a nonexistent local file", async () => {
      const image = await fetchImage("nonexistent.png");
      expect(image).toBeUndefined();
    });
  });

  describe("http image URLs", () => {
    it("loads an image over http", async () => {
      const image = await fetchImage(`${baseUrl}/image.png`);
      expect(image).toBeDefined();
      expect(image?.bitmap.width).toBeGreaterThan(0);
      expect(image?.bitmap.height).toBeGreaterThan(0);
    });

    it("returns undefined for a invalid url", async () => {
      const image = await fetchImage(`${baseUrl}/missing.png`);
      expect(image).toBeUndefined();
    });
  });

  describe("file:// URLs", () => {
    it("loads an image via file:// URL", async () => {
      const fileUrl = pathToFileURL(sampleImagePath).href;

      const image = await fetchImage(fileUrl);
      expect(image).toBeDefined();
      expect(image?.bitmap.width).toBeGreaterThan(0);
      expect(image?.bitmap.height).toBeGreaterThan(0);
    });

    it("returns undefined for a file:// URL to a nonexistent file", async () => {
      const fileUrl = pathToFileURL("/nonexistent/image.png").href;
      const image = await fetchImage(fileUrl);
      expect(image).toBeUndefined();
    });
  });

  describe("binary sources", () => {
    it("loads an image from a Buffer", async () => {
      const buf = await readFile(sampleImagePath);
      const image = await fetchImage(buf);
      expect(image).toBeDefined();
      expect(image?.bitmap.width).toBeGreaterThan(0);
      expect(image?.bitmap.height).toBeGreaterThan(0);
    });

    it("loads an image from an ArrayBuffer", async () => {
      const response = await fetch(`${baseUrl}/image.png`);
      const arrayBuffer = await response.arrayBuffer();
      const image = await fetchImage(arrayBuffer);
      expect(image).toBeDefined();
      expect(image?.bitmap.width).toBeGreaterThan(0);
      expect(image?.bitmap.height).toBeGreaterThan(0);
    });

    it("returns undefined for a Buffer with invalid image data", async () => {
      const image = await fetchImage(Buffer.from("not an image"));
      expect(image).toBeUndefined();
    });
  });
});
