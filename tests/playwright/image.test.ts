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

const basicImageProtocols = ["ascii", "braille", "halfBlock"];
const advancedImageProtocols = ["sixel", "iterm2", "kitty"];
const imageProtocols = [...basicImageProtocols, ...advancedImageProtocols];

test.describe("basic rendering", () => {
  test("renders standalone image", async ({ ctx }) => {
    const ps = await runFixture(
      "simple-image.tsx",
      [
        "--src",
        "../../example/images/full.png",
        "--width",
        "4",
        "--height",
        "2",
      ],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    expect(bufferOutput).toMatch(/^\u2584{4}\s*\n\u2584{4}\s*$/);
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

// Skipping for now because there's currently a bug in xterm.js that does not overwrite image with text
// See https://github.com/xtermjs/xterm.js/issues/5860
test.describe
  .skip("image persistence after exit", () => {
    test.describe.configure({
      retries: 2,
    });

    for (const protocol of advancedImageProtocols) {
      test.fail(`${protocol}`, async ({ ctx }) => {
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

test.describe("percentage sizing", () => {
  test("100% size image", async ({ ctx }) => {
    const ps = await runFixture(
      "percentage-size.tsx",
      [
        "--src",
        "../../example/images/full.png",
        "--width",
        "100%",
        "--height",
        "100%",
        "--parentWidth",
        "4",
        "--parentHeight",
        "2",
      ],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    // expect 2 lines of 4 half-block chars each
    expect(bufferOutput).toMatch(/^\u2584{4}[ \t]*(\n\u2584{4}[ \t]*){1}\s*$/);
  });

  test("50% size image", async ({ ctx }) => {
    const ps = await runFixture(
      "percentage-size.tsx",
      [
        "--src",
        "../../example/images/full.png",
        "--width",
        "50%",
        "--height",
        "50%",
        "--parentWidth",
        "4",
        "--parentHeight",
        "2",
      ],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    // expect 1 line of 2 half-block chars
    expect(bufferOutput).toMatch(/^\u2584{2}\s*$/);
  });

  test("percentage width", async ({ ctx }) => {
    const ps = await runFixture(
      "percentage-size.tsx",
      [
        "--src",
        "../../example/images/full.png",
        "--width",
        "100%",
        "--height",
        "2",
        "--parentWidth",
        "4",
        "--parentHeight",
        "2",
      ],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    // expect 2 lines of 4 half-block chars each, since height is fixed at 2 lines but width is 100% of parent
    expect(bufferOutput).toMatch(/^\u2584{4}\s*\n\u2584{4}\s*$/);
  });

  test("percentage height", async ({ ctx }) => {
    const ps = await runFixture(
      "percentage-size.tsx",
      [
        "--src",
        "../../example/images/full.png",
        "--width",
        "4",
        "--height",
        "100%",
        "--parentWidth",
        "4",
        "--parentHeight",
        "2",
      ],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    // expect 2 lines of 4 half-block chars each, since width is fixed at 4 chars but height is 100% of parent
    expect(bufferOutput).toMatch(/^\u2584{4}\s*\n\u2584{4}\s*$/);
  });
});

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

test.describe("vertical offset", () => {
  // kitty is sometimes flaky for some mysterious reason
  test.describe.configure({
    retries: 2,
  });
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

// Skipping for now because there's currently a bug in xterm.js that does not overwrite image with text
// See https://github.com/xtermjs/xterm.js/issues/5860
test.describe
  .skip("background color", () => {
    for (const protocol of ["sixel", "iterm2"]) {
      test(`restores background color after ${protocol} image cleanup`, async ({
        ctx,
      }) => {
        const ps = await runFixture(
          "background-color.tsx",
          [
            "--src",
            "../../example/images/full.png",
            "--protocol",
            protocol,
            "--bgColor",
            "red",
          ],
          ctx.terminalProxy,
        );
        await ps.waitForExit();
        const cells = await ctx.terminalProxy.getCellsBgColor(0, 0, 4, 2);
        for (const cell of cells) {
          await expect(
            cell.color === 0xff0000,
            `Cell (${cell.x}, ${cell.y}) should have the correct background color`,
          ).toBe(true);
        }
      });
    }
  });
