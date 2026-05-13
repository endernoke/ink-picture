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

test.describe("basic rendering", () => {
  test("renders standalone image", async ({ ctx }) => {
    const ps = await runFixture(
      "simple-image.tsx",
      ["--src", "../../example/images/full.png"],
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

const advancedImageProtocols = ["sixel", "iterm2", "kitty"];

const verticalOffsetAppHeightCases = [
  {
    label: "app height < terminal height",
    appHeight: "4",
    expectedImageLocation: [0, 1, 4, 2],
  },
  {
    label: "app height >= terminal height",
    appHeight: "50",
    expectedImageLocation: [0, 47, 4, 2],
  },
];

test.describe("advanced protocols", () => {
  for (const protocol of advancedImageProtocols) {
    test(`renders ${protocol} image`, async ({ ctx }) => {
      const ps = await runFixture(
        "simple-image.tsx",
        [
          "--src",
          "../../example/images/full.png",
          "--protocol",
          protocol,
          "--keepalive",
        ],
        ctx.terminalProxy,
      );
      await timeout(4000);
      await expect
        .poll(
          async () => {
            const cells = await ctx.terminalProxy.cellsContainGraphics(
              0,
              0,
              4,
              2,
            );
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
  }
});

test.describe("image persistence after exit", () => {
  test.describe.configure({
    retries: 2,
  });

  for (const protocol of advancedImageProtocols) {
    test(`${protocol}`, async ({ ctx }) => {
      const ps = await runFixture(
        "simple-image.tsx",
        ["--src", "../../example/images/full.png", "--protocol", protocol],
        ctx.terminalProxy,
      );
      await ps.waitForExit();
      const cells = await ctx.terminalProxy.cellsContainGraphics(0, 0, 4, 2);
      for (const cell of cells) {
        await expect(
          cell.hasGraphic,
          `Cell (${cell.x}, ${cell.y}) should contain graphics`,
        ).toBe(true);
      }
    });
  }
});

test.describe("vertical offset", () => {
  for (const protocol of advancedImageProtocols) {
    for (const {
      label,
      appHeight,
      expectedImageLocation,
    } of verticalOffsetAppHeightCases) {
      test(`${protocol} image with ${label}`, async ({ ctx }) => {
        const ps = await runFixture(
          "vertical-offset.tsx",
          [
            "--src",
            "../../example/images/full.png",
            "--protocol",
            protocol,
            "--appHeight",
            appHeight,
          ],
          ctx.terminalProxy,
        );
        await timeout(4000);
        await expect
          .poll(
            async () => {
              const cells = await ctx.terminalProxy.cellsContainGraphics(
                expectedImageLocation[0],
                expectedImageLocation[1],
                expectedImageLocation[2],
                expectedImageLocation[3],
              );
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
    }
  }
});
