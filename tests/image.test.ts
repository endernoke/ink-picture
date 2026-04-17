import { test as base, expect } from "@playwright/test";
import { createTestContext, runFixture, TestContext } from "./terminal";

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ImageTestFixtures = {
  ctx: TestContext;
};

const test = base.extend<ImageTestFixtures>({
  ctx: async ({ browser }, use: (context: TestContext) => Promise<void>) => {
    const context = await createTestContext(browser);
    await use(context);
    await context.page.close();
  },
});

test.describe.configure({
  mode: "parallel",
  retries: 2,
});

test("renders standalone image", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["--src", "../example/images/full.png"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const bufferOutput = await ctx.terminalProxy.getBufferAsString();
  expect(bufferOutput).toMatch(/\u2584\u2584\s*\n\u2584\u2584/);
});

test("shows fallback on load failure", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["--src", "non-existent.png", "--width", "12", "--height", "6"],
    ctx.terminalProxy,
  );
  await ps.waitForExit();
  const bufferOutput = await ctx.terminalProxy.getBufferAsString();
  expect(bufferOutput).toContain("Load failed");
});

function checkCellsHaveGraphics(
  cells: { x: number; y: number; hasGraphic: boolean }[],
): boolean {
  for (const cell of cells) {
    if (!cell.hasGraphic) {
      return false;
    }
  }
  return true;
}

test("renders sixel image", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    [
      "--src",
      "../example/images/full.png",
      "--protocol",
      "sixel",
      "--keepalive",
    ],
    ctx.terminalProxy,
  );
  await timeout(10000);
  expect
    .poll(
      async () => {
        const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
        return checkCellsHaveGraphics(cells);
      },
      {
        intervals: [1000],
        timeout: 10000,
      },
    )
    .toBe(true);
  await ps.kill();
});

test("renders iip image", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    [
      "--src",
      "../example/images/full.png",
      "--protocol",
      "iterm2",
      "--keepalive",
    ],
    ctx.terminalProxy,
  );
  await timeout(4000);
  expect
    .poll(
      async () => {
        const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
        return checkCellsHaveGraphics(cells);
      },
      {
        intervals: [1000],
        timeout: 10000,
      },
    )
    .toBe(true);
  await ps.kill();
});

test("renders kitty image", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    [
      "--src",
      "../example/images/full.png",
      "--protocol",
      "kitty",
      "--keepalive",
    ],
    ctx.terminalProxy,
  );
  await timeout(4000);
  expect
    .poll(
      async () => {
        const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
        return checkCellsHaveGraphics(cells);
      },
      {
        intervals: [1000],
        timeout: 10000,
      },
    )
    .toBe(true);
  await ps.kill();
});

test("keeps sixel image after exit", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["--src", "../example/images/full.png", "--protocol", "sixel"],
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

test("keeps iip image after exit", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["--src", "../example/images/full.png", "--protocol", "iterm2"],
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

test("keeps kitty image after exit", async ({ ctx }) => {
  const ps = await runFixture(
    "simple-image.tsx",
    ["--src", "../example/images/full.png", "--protocol", "kitty"],
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
