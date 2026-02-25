import path from "node:path";
import process from "node:process";
import url from "node:url";
import test from "ava";
import { spawn } from "node-pty";

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

test("queryEscapeSequence - able to quit via Ctrl+C", async (t) => {
  const ps = term("ctrlc");
  void ps.write("\x03"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  t.is(exitStatus?.signal, 2);
  t.false(ps.output.includes("exited"));
});

test("queryEscapeSequence - useInput works", async (t) => {
  const ps = term("use-input", ["text"]);
  void ps.write("george");
  await ps.waitForExit();
  t.true(ps.output.includes("exited"));
});

test("queryEscapeSequence - useInput with manual ctrl+c handling works", async (t) => {
  const ps = term("use-input-ctrlc");
  void ps.write("\u0003"); // Ctrl+C
  const exitStatus = await ps.waitForExit();
  t.is(exitStatus?.signal, 0);
  t.true(ps.output.includes("exited"));
});
