import { expect, test } from "@playwright/test";
import {
  createTerminalProcess,
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

test("queryEscapeSequence: interrupt via Ctrl+C", async () => {
  const ps = await runFixture("ctrlc", [], ctx.terminalProxy);
  void ps.write("\x03"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  expect(exitStatus?.signal).toBe(2);
  expect(ps.output.includes("exited")).toBe(false);
});

test("queryEscapeSequence: useInput", async () => {
  const ps = await runFixture("use-input", ["text"], ctx.terminalProxy);
  void ps.write("george");
  await ps.waitForExit();
  expect(ps.output.includes("exited")).toBe(true);
});

test("queryEscapeSequence: useInput with manual ctrl+c handling", async () => {
  const ps = await runFixture("use-input-ctrlc", [], ctx.terminalProxy);
  void ps.write("\x03"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  expect(exitStatus?.signal).toBe(0);
  expect(ps.output.includes("exited")).toBe(true);
});
