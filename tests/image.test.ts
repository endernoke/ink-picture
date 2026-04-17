import { expect, test } from "@playwright/test";
import {
  createTestContext,
  imageAddonSettings,
  runFixture,
  TestContext,
} from "./terminal";

let ctx: TestContext;

test.beforeAll(async ({ browser }) => {
  ctx = await createTestContext(browser);
});

test.afterAll(async () => {
  await ctx.page.close();
});

test.beforeEach(async () => {
  await ctx.page.evaluate(`
    window.term.reset()
    window.imageAddon?.dispose();
    window.imageAddon = new window.ImageAddon.ImageAddon(${JSON.stringify(imageAddonSettings)});
    window.term.loadAddon(window.imageAddon);
  `);
});

test("renders standalone image", async () => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["../example/images/full.png"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const bufferOutput = await ctx.terminalProxy.getBufferAsString();
  expect(bufferOutput).toMatch(/\u2584\u2584\s*\n\u2584\u2584/);
});

test("shows fallback on load failure", async () => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["non-existent.png", "12", "6"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const bufferOutput = await ctx.terminalProxy.getBufferAsString();
  expect(bufferOutput).toContain("Load failed");
});

test.fail("renders sixel image", async () => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["../example/images/full.png", "4", "2", "sixel"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
  for (const cell of cells) {
    expect(
      cell.hasGraphic,
      `Cell (${cell.x}, ${cell.y}) should contain graphics`,
    ).toBe(true);
  }
});

test.fail("renders iip image", async () => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["../example/images/full.png", "4", "2", "iterm2"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
  for (const cell of cells) {
    expect(
      cell.hasGraphic,
      `Cell (${cell.x}, ${cell.y}) should contain graphics`,
    ).toBe(true);
  }
});

test.fail("renders kitty image", async () => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["../example/images/full.png", "4", "2", "kitty"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
  for (const cell of cells) {
    expect(
      cell.hasGraphic,
      `Cell (${cell.x}, ${cell.y}) should contain graphics`,
    ).toBe(true);
  }
});
