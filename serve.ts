// Local static server for previewing app/ and taking screenshots.
// Build-only helper, not part of the graded entry.
// Usage: node serve.ts [--port 8123]  ->  http://localhost:8123/
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const APP = join(ROOT, "app");
const arg = process.argv.find((a) => a.startsWith("--port="));
const PORT = Number(arg ? arg.slice(7) : 8123) || 8123;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const file = normalize(join(APP, path));
  if (!file.startsWith(APP)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  try {
    if (!statSync(file).isFile()) throw new Error("not a file");
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(PORT, () => {
  console.log(`serving app/ at http://localhost:${PORT}/`);
});
