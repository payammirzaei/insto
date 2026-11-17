/**
 * Zero-dependency static server for Railway.
 * Serves the landing site, release artifacts, and /health.
 * Binds to process.env.PORT (Railway) or 8080 locally.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");
const releaseDir = join(root, "release");
const distDir = join(root, "dist");
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".zip": "application/zip",
  ".xpi": "application/x-xpinstall",
  ".map": "application/json; charset=utf-8",
};

function safeJoin(base, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const cleaned = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = join(base, cleaned);
  if (!full.startsWith(base + sep) && full !== base) return null;
  return full;
}

async function sendFile(res, filePath, { downloadName } = {}) {
  const s = await stat(filePath);
  if (!s.isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
  const headers = {
    "Content-Type": type,
    "Content-Length": s.size,
    "Cache-Control": type.startsWith("text/html")
      ? "no-cache"
      : "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
  if (downloadName) {
    headers["Content-Disposition"] = `attachment; filename="${downloadName}"`;
  }
  res.writeHead(200, headers);
  createReadStream(filePath).pipe(res);
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = url.pathname;

    if (path === "/health" || path === "/healthz") {
      json(res, 200, {
        ok: true,
        service: "onlyfriends",
        version: process.env.npm_package_version || "0.1.1",
        hasRelease: existsSync(releaseDir),
        hasDist: existsSync(distDir),
      });
      return;
    }

    if (path === "/api/release") {
      let files = [];
      if (existsSync(releaseDir)) {
        const { readdir } = await import("node:fs/promises");
        files = (await readdir(releaseDir)).filter((f) => !f.startsWith("."));
      }
      json(res, 200, { files, downloadBase: "/download/" });
      return;
    }

    if (path.startsWith("/download/")) {
      const name = path.slice("/download/".length);
      if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bad request");
        return;
      }
      const filePath = join(releaseDir, name);
      if (!existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Release artifact not found. Run npm run package during build.");
        return;
      }
      await sendFile(res, filePath, { downloadName: name });
      return;
    }

    // Static site
    let rel = path === "/" ? "/index.html" : path;
    let filePath = safeJoin(siteDir, rel);
    if (!filePath) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bad path");
      return;
    }
    if (!existsSync(filePath)) {
      // SPA-ish fallback for clean URLs
      const fallback = join(siteDir, "index.html");
      if (existsSync(fallback) && !extname(rel)) {
        await sendFile(res, fallback);
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const st = await stat(filePath);
    if (st.isDirectory()) {
      filePath = join(filePath, "index.html");
    }
    await sendFile(res, filePath);
  } catch (err) {
    console.error("[onlyfriends-serve]", err);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
});

server.listen(port, host, () => {
  console.log(`[onlyfriends] listening on http://${host}:${port}`);
  console.log(`[onlyfriends] site=${siteDir}`);
  console.log(`[onlyfriends] release=${releaseDir}`);
});
