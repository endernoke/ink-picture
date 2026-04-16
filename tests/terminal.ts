import path from "node:path";
import process from "node:process";
import url from "node:url";
import { Browser, JSHandle, Page } from "@playwright/test";
import { type IImageAddonOptions, ImageAddon } from "@xterm/addon-image";
import { Terminal } from "@xterm/xterm";
import { spawn } from "node-pty";
import { ReactNode } from "react";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const imageAddonSettings: IImageAddonOptions = {
  enableSizeReports: true,
  pixelLimit: 16777216,
  sixelSupport: true,
  sixelScrolling: true,
  sixelPaletteLimit: 256,
  sixelSizeLimit: 25000000,
  storageLimit: 128,
  showPlaceholder: true,
  iipSupport: true,
  iipSizeLimit: 20000000,
  // kittySupport: true,
  // kittySizeLimit: 20000000,
};

class EventEmitter<T> {
  private _listeners = new Set<(event: T) => void>();

  public on(listener: (event: T) => void): () => void {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  public emit(event: T): void {
    for (const listener of this._listeners.values()) {
      listener(event);
    }
  }
}

class TerminalProxy {
  private _page: Page;
  private _onDataEmitter = new EventEmitter<string>();
  private _isOnDataBridgeInitialized = false;
  private static readonly _onDataBridgeFunctionName = "__terminalProxyOnData";

  constructor(page: Page) {
    this._page = page;
  }

  private async initializeOnDataBridge(): Promise<void> {
    if (this._isOnDataBridgeInitialized) {
      return;
    }

    await this._page.exposeFunction(
      TerminalProxy._onDataBridgeFunctionName,
      (data: string) => {
        this._onDataEmitter.emit(data);
      },
    );

    await this._page.evaluate(
      ([term, functionName]) => {
        (term as Terminal).onData((data) => {
          // biome-ignore lint/suspicious/noExplicitAny: window is a client-side global
          (window as any)[functionName as string](data);
        });
      },
      [await this.getTerm(), TerminalProxy._onDataBridgeFunctionName],
    );

    this._isOnDataBridgeInitialized = true;
  }

  public async onData(callback: (data: string) => void): Promise<() => void> {
    await this.initializeOnDataBridge();
    return this._onDataEmitter.on(callback);
  }

  getTerm(): Promise<JSHandle<Terminal>> {
    return this._page.evaluateHandle("window.term");
  }

  getImageAddon(): Promise<JSHandle<ImageAddon>> {
    return this._page.evaluateHandle("window.imageAddon");
  }

  public async write(data: string): Promise<void> {
    return this._page.evaluate(
      ([term, data]) => {
        return new Promise<void>((resolve) => {
          (term as Terminal).write(data as string | Uint8Array, resolve);
        });
      },
      [
        await this.getTerm(),
        typeof data === "string" ? data : new Uint8Array(data),
      ],
    );
  }

  public async getBufferLine(line: number): Promise<string> {
    return this._page.evaluate(
      ([term, line]) => {
        const bufferLine = (term as Terminal).buffer.active.getLine(
          line as number,
        );
        if (!bufferLine) {
          return "";
        }
        return bufferLine.translateToString();
      },
      [await this.getTerm(), line],
    );
  }

  public async getBufferAsString(): Promise<string> {
    return this._page.evaluate(
      ([term]) => {
        let bufferString = "";
        for (let i = 0; i <= (term as Terminal).buffer.active.cursorY; i++) {
          const line = (term as Terminal).buffer.active.getLine(i);
          if (line) {
            bufferString += `${line.translateToString()}\n`;
          }
        }
        return bufferString;
      },
      [await this.getTerm()],
    );
  }

  public async getImageAtBufferCell(
    x: number,
    y: number,
  ): Promise<HTMLCanvasElement | undefined> {
    return this._page.evaluate(
      ([imageAddon, x, y]) => {
        return (imageAddon as ImageAddon).getImageAtBufferCell(
          x as number,
          y as number,
        );
      },
      [await this.getImageAddon(), x, y],
    );
  }

  public async cellsContainGraphics(
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<Array<{ x: number; y: number; hasGraphic: boolean }>> {
    return this._page.evaluate(
      ([imageAddon, x, y, width, height]) => {
        const results: Array<{ x: number; y: number; hasGraphic: boolean }> =
          [];

        for (let row = y as number; row < (height as number); row++) {
          for (let col = x as number; col < (width as number); col++) {
            results.push({
              x: col,
              y: row,
              hasGraphic: Boolean(
                (imageAddon as ImageAddon).getImageAtBufferCell(col, row),
              ),
            });
          }
        }

        return results;
      },
      [await this.getImageAddon(), x, y, width, height],
    );
  }

  async getCols(): Promise<number> {
    return this._page.evaluate(
      ([term]) => (term as Terminal).cols,
      [await this.getTerm()],
    );
  }
}

export interface TestContext {
  browser: Browser;
  page: Page;
  termHandle: JSHandle<Terminal>;
  terminalProxy: TerminalProxy;
}

export async function createTestContext(
  browser: Browser,
): Promise<TestContext> {
  const page = await browser.newPage();
  await page.goto("/");
  await page.evaluate(`
    const element = document.getElementById('terminal');
    window.term = new window.Terminal({
      rows: 50,
      cols: 100,
      allowProposedApi: true,
      convertEol: true,
    });
    window.imageAddon = new window.ImageAddon.ImageAddon(${JSON.stringify(imageAddonSettings)});
    window.term.loadAddon(window.imageAddon);
    window.term.open(element);
  `);

  const terminalProxy = new TerminalProxy(page);

  return {
    browser,
    page,
    termHandle: await page.evaluateHandle("window.term"),
    terminalProxy,
  };
}

interface ExitStatus {
  exitCode: number | null;
  signal?: number;
}

export async function createTerminalProcess({
  file,
  args,
  terminalProxy,
}: {
  file: string;
  args: string[];
  terminalProxy: TerminalProxy;
}) {
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
    TS_NODE_TRANSPILE_ONLY: "1",
  };

  const cols = await terminalProxy.getCols();

  const pty = spawn(file, args, {
    name: "xterm-256color",
    cols: cols,
    cwd: __dirname,
    env,
  });

  const result = {
    async write(input: string) {
      // Give TS and Ink time to start up and render UI
      await processReadyPromise;
      pty.write(input);
    },
    output: "",
    waitForExit: async () => exitPromise,
  };

  // Write queue to ensure all terminal writes finish before resolving exit status
  let pendingTerminalWrites = Promise.resolve();

  pty.onData((data) => {
    // Keep writes ordered and make sure exit waits for all pending writes.
    pendingTerminalWrites = pendingTerminalWrites
      // .catch(() => {
      //   // Keep the write queue alive if an earlier write failed.
      // })
      .then(async () => {
        await terminalProxy.write(data);
        result.output += data;
        if (result.output.includes("__READY__")) {
          // Remove the ready signal from output
          result.output = result.output.replace("__READY__", "");
          processReadyResolve();
          // Give the process a bit more time to finish initializing and rendering
          // setTimeout(() => {
          //   processReadyResolve();
          // }, 100);
        }
      });
  });

  const disposeTerminalListener = await terminalProxy.onData((data) => {
    pty.write(data);
  });

  pty.onExit(({ exitCode, signal }) => {
    void pendingTerminalWrites
      // .catch(() => {
      //   // Swallow write errors so the exit promise still resolves.
      // })
      .finally(() => {
        disposeTerminalListener();
        exitResolve({ exitCode, signal });
      });
  });

  return result;
}

export async function runFixture(
  fixture: string,
  args: string[],
  terminalProxy: TerminalProxy,
): Promise<{
  write: (input: string) => Promise<void>;
  output: string;
  waitForExit: () => Promise<ExitStatus>;
}> {
  const fixturePath = path.join(__dirname, "fixtures", fixture);
  return createTerminalProcess({
    file: "node",
    args: ["--loader=ts-node/esm", fixturePath, ...args],
    terminalProxy,
  });
}
