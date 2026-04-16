import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoRoot = __dirname;
const nodeModulesRoot = path.join(__dirname, "..", "..", "node_modules");

function serveFile(filePath: string, res: http.ServerResponse): void {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    } else {
      const ext = path.extname(filePath);
      const contentType =
        ext === ".html"
          ? "text/html"
          : ext === ".css"
            ? "text/css"
            : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
}

function startServer(): void {
  const server = http.createServer((req, res) => {
    const url = req.url || "/";

    if (url === "/") {
      serveFile(path.join(demoRoot, "test.html"), res);
    } else if (url.startsWith("/node_modules/")) {
      const modulePath = path.join(
        nodeModulesRoot,
        url.replace("/node_modules/", ""),
      );
      serveFile(modulePath, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  const port = parseInt(process.env.PORT ?? "3000", 10);
  const host = os.platform() === "win32" ? "127.0.0.1" : "0.0.0.0";

  console.log(`App listening to http://${host}:${port}`);
  server.listen(port, host);
}

startServer();
