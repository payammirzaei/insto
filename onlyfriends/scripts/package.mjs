/**
 * Packages dist/ into an unsigned ZIP for source review / signing input.
 *
 * IMPORTANT: An unsigned ZIP/XPI is NOT installable on release Firefox for Android.
 * Stable Android installs require a Mozilla-signed XPI (AMO or self-distribution signing).
 * Temporary loading via about:debugging works on Firefox Desktop only.
 */
import { createHash } from "node:crypto";
import { readFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const outDir = join(root, "release");

async function listFiles(dir, base = dir, acc = []) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await listFiles(p, base, acc);
    else if (!name.endsWith(".map")) acc.push(p);
  }
  return acc;
}

/** Minimal ZIP (store) writer — no external deps. */
async function writeZip(files, outPath) {
  const chunks = [];
  const central = [];
  let offset = 0;

  function u16(n) {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(n, 0);
    return b;
  }
  function u32(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n, 0);
    return b;
  }

  for (const file of files) {
    const data = await readFile(file);
    const name = relative(dist, file).replace(/\\/g, "/");
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      data,
    ]);
    chunks.push(local);
    central.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBuf,
      ])
    );
    offset += local.length;
  }

  const centralDir = Buffer.concat(central);
  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);

  const zip = Buffer.concat([...chunks, centralDir, end]);
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, zip);
  return zip;
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

const files = await listFiles(dist);
if (files.length === 0) {
  console.error("dist/ is empty — run npm run build first");
  process.exit(1);
}

const zipPath = join(outDir, "onlyfriends-0.1.1-unsigned.zip");
const zip = await writeZip(files, zipPath);
const sha = createHash("sha256").update(zip).digest("hex");

const readme = `OnlyFriends packaging output
=============================

File: ${relative(root, zipPath)}
SHA-256: ${sha}

This archive is UNSIGNED.

Firefox Desktop (temporary test):
  about:debugging → This Firefox → Load Temporary Add-on → select dist/manifest.json

Firefox Android (stable install):
  Requires a Mozilla-signed XPI. An unsigned ZIP cannot be installed on release Firefox for Android.
  Options: AMO unlisted/self-distribution signing, or other Mozilla signing paths —
  do not misrepresent this ZIP as installable on release Android.

Do not submit to AMO or publish without explicit approval.
`;

await writeFile(join(outDir, "PACKAGING_NOTES.txt"), readme);
console.log(`Packed ${files.length} files → ${zipPath}`);
console.log(`SHA-256: ${sha}`);
console.log(
  "Unsigned — not installable on release Firefox Android without Mozilla signing."
);
