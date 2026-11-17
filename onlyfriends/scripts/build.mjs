import * as esbuild from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");

async function ensureIcons() {
  const iconsDir = join(dist, "icons");
  await mkdir(iconsDir, { recursive: true });
  // Minimal valid PNG (48x48 teal rounded square) generated as base64.
  // Real product can replace with designed assets; these keep packaging self-contained.
  const png48 = await generatePngIcon(48, [15, 118, 110]);
  const png96 = await generatePngIcon(96, [15, 118, 110]);
  await writeFile(join(iconsDir, "icon-48.png"), png48);
  await writeFile(join(iconsDir, "icon-96.png"), png96);
}

/** Tiny uncompressed RGB PNG writer (no deps). */
async function generatePngIcon(size, rgb) {
  const { deflateSync } = await import("node:zlib");
  const [r, g, b] = rgb;
  const row = Buffer.alloc(1 + size * 3);
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) {
    const o = y * (1 + size * 3);
    raw[o] = 0;
    for (let x = 0; x < size; x++) {
      const margin = Math.floor(size * 0.12);
      const inside =
        x >= margin && x < size - margin && y >= margin && y < size - margin;
      const i = o + 1 + x * 3;
      if (inside) {
        raw[i] = r;
        raw[i + 1] = g;
        raw[i + 2] = b;
      } else {
        raw[i] = 247;
        raw[i + 1] = 245;
        raw[i + 2] = 242;
      }
    }
  }
  const compressed = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcSrc = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcSrc), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

async function copyStatic() {
  await mkdir(dist, { recursive: true });
  const manifest = JSON.parse(
    await readFile(join(root, "src", "manifest.json"), "utf8")
  );
  await writeFile(join(dist, "manifest.json"), JSON.stringify(manifest, null, 2));
  await cp(join(root, "src", "popup", "popup.html"), join(dist, "popup.html"));
  await cp(join(root, "src", "popup", "popup.css"), join(dist, "popup.css"));
  await cp(join(root, "src", "content", "page.css"), join(dist, "page.css"));
  await ensureIcons();
}

const buildOptions = {
  bundle: true,
  format: "iife",
  target: ["es2020"],
  sourcemap: true,
  logLevel: "info",
  outdir: dist,
  entryPoints: {
    background: join(root, "src/background/background.ts"),
    content: join(root, "src/content/content.ts"),
    popup: join(root, "src/popup/popup.ts"),
  },
};

await copyStatic();

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching…");
} else {
  await esbuild.build(buildOptions);
  const hash = createHash("sha256")
    .update(await readFile(join(dist, "content.js")))
    .digest("hex")
    .slice(0, 12);
  console.log(`Build complete → dist/ (content.js ${hash})`);
}
