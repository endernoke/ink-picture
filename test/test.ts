import path from "node:path";
import process from "node:process";
import url from "node:url";
import { spawn } from "node-pty";
import { expect, test } from "vitest";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

interface ExitStatus {
  exitCode: number | null;
  signal?: number;
}

const term = (fixture: string, args: string[] = []) => {
  let exitResolve: (exitStatus: ExitStatus) => void;

  const exitPromise = new Promise<ExitStatus>((resolve) => {
    exitResolve = resolve;
  });

  let processReadyResolve: () => void;
  const processReadyPromise = new Promise<void>((res) => {
    processReadyResolve = res;
  });

  const env: Record<string, string> = {
    ...process.env,
    NODE_NO_WARNINGS: "1",
    CI: "false",
  };

  const ps = spawn(
    "node",
    [
      "--loader=ts-node/esm",
      path.join(__dirname, `./fixtures/${fixture}.tsx`),
      ...args,
    ],
    {
      name: "xterm-color",
      cols: 100,
      cwd: __dirname,
      env,
    },
  );

  const result = {
    async write(input: string) {
      // Give TS and Ink time to start up and render UI
      await processReadyPromise;
      ps.write(input);
    },
    output: "",
    waitForExit: async () => exitPromise,
  };

  ps.onData((data) => {
    result.output += data;
    if (result.output.includes("__READY__")) {
      // Remove the ready signal from output
      result.output = result.output.replace("__READY__", "");
      // Give the process a bit more time to finish initializing and rendering
      setTimeout(() => {
        processReadyResolve();
      }, 100);
    }
  });

  ps.onExit(({ exitCode, signal }) => {
    exitResolve({ exitCode, signal });
  });

  return result;
};

test("queryEscapeSequence - able to quit via Ctrl+C", async () => {
  const ps = term("ctrlc");
  void ps.write("\x03"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  expect(exitStatus?.signal).toBe(2);
  expect(ps.output.includes("exited")).toBe(false);
});

test("queryEscapeSequence - useInput works", async () => {
  const ps = term("use-input", ["text"]);
  void ps.write("george");
  await ps.waitForExit();
  expect(ps.output.includes("exited")).toBe(true);
});

test("queryEscapeSequence - useInput with manual ctrl+c handling works", async () => {
  const ps = term("use-input-ctrlc");
  void ps.write("\u0003"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  expect(exitStatus?.signal).toBe(0);
  expect(ps.output.includes("exited")).toBe(true);
});
