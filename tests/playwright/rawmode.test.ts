import { test as base, expect } from "@playwright/test";
import { createTestContext, runFixture, TestContext } from "./terminal";

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

test("queryEscapeSequence: interrupt via Ctrl+C", async ({ ctx }) => {
  const ps = await runFixture("ctrlc", [], ctx.terminalProxy);
  void ps.write("\x03"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  expect(exitStatus?.signal).toBe(2);
  expect(ps.output.includes("exited")).toBe(false);
});

test("queryEscapeSequence: useInput", async ({ ctx }) => {
  const ps = await runFixture("use-input", ["text"], ctx.terminalProxy);
  void ps.write("george");
  await ps.waitForExit();
  expect(ps.output.includes("exited")).toBe(true);
});

test("queryEscapeSequence: useInput with manual ctrl+c handling", async ({
  ctx,
}) => {
  const ps = await runFixture("use-input-ctrlc", [], ctx.terminalProxy);
  void ps.write("\x03"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  expect(exitStatus?.signal).toBe(0);
  expect(ps.output.includes("exited")).toBe(true);
});

test.describe("TerminalInfoProvider", () => {
  test("detects sixel graphics support", async ({ ctx }) => {
    const ps = await runFixture(
      "terminal-info-provider",
      [],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    expect(ps.output.includes("sixel")).toBe(true);
  });
  test("detects kitty graphics support", async ({ ctx }) => {
    const ps = await runFixture(
      "terminal-info-provider",
      [],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    expect(ps.output.includes("kitty")).toBe(true);
  });
  test("doesn't produce any horizontal offset", async ({ ctx }) => {
    const ps = await runFixture("box-border", [], ctx.terminalProxy);
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    // Expect
    // 1|+-+
    // 2|| |
    // 3|+-+
    expect(bufferOutput).toMatch(/^\+-\+\s*\n\| \|\s*\n\+-\+\s*$/);
  });
  test("allows overriding terminal info", async ({ ctx }) => {
    const ps = await runFixture(
      "terminal-info-override.tsx",
      [],
      ctx.terminalProxy,
    );
    await ps.waitForExit();
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    expect(bufferOutput.includes("color")).toBe(false);
  });
  test("useTerminalInfo without provider returns default info", async ({
    ctx,
  }) => {
    const ps = await runFixture(
      "no-terminal-info-provider.tsx",
      [],
      ctx.terminalProxy,
    );
    const exitStatus = await ps.waitForExit();
    // Expect no error even if without a provider
    expect(exitStatus?.exitCode).toBe(0);
    const bufferOutput = await ctx.terminalProxy.getBufferAsString();
    expect(bufferOutput.includes("default")).toBe(true);
  });
});
