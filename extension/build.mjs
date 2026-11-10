// Packages the extension for every browser: node extension/build.mjs
//
//   dist/chromium/  + dist/brainly-chromium-<version>.zip   Chrome, Edge, Brave, Opera, Arc, Vivaldi (and Safari's converter)
//   dist/firefox/   + dist/brainly-firefox-<version>.zip    Firefox (desktop and Android)
//
// The source folder itself is the Chromium build, so "Load unpacked" on extension/ keeps working.
// No dependencies: Node 22+ only.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const src = dirname(fileURLToPath(import.meta.url));
const dist = join(src, "dist");
const FILES = ["api.js", "background.js", "connect.js", "icon.png", "options.html", "options.js", "popup.css", "popup.html", "popup.js"];

const base = JSON.parse(readFileSync(join(src, "manifest.json"), "utf8"));

const targets = {
  chromium: base,
  firefox: {
    ...base,
    // Firefox runs the background as an event page, not a service worker
    background: { scripts: ["background.js"], type: "module" },
    browser_specific_settings: {
      gecko: {
        id: "save-to-brain@brainly-ai",
        strict_min_version: "128.0",
        // Required by addons.mozilla.org: links and selected text are sent to your Brainly account
        data_collection_permissions: { required: ["browsingActivity", "websiteContent"] },
      },
      gecko_android: { strict_min_version: "128.0" },
    },
  },
};

/** Minimal zip writer (deflate), enough for browser stores. */
function zip(dir, out) {
  const entries = [];
  const walk = (d) => readdirSync(d).sort().forEach((name) => {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else entries.push({ name: relative(dir, p).split("\\").join("/"), data: readFileSync(p) });
  });
  walk(dir);

  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name);
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(0x00210000, 10); // 1980-01-01, so builds are reproducible
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, packed);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(0x00210000, 12);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBuf);
    offset += local.length + nameBuf.length + packed.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  writeFileSync(out, Buffer.concat([...chunks, centralBuf, end]));
}

rmSync(dist, { recursive: true, force: true });
for (const [name, manifest] of Object.entries(targets)) {
  const out = join(dist, name);
  mkdirSync(out, { recursive: true });
  for (const file of FILES) cpSync(join(src, file), join(out, file));
  writeFileSync(join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const archive = join(dist, `brainly-${name}-${base.version}.zip`);
  zip(out, archive);
  console.log(`${name.padEnd(9)} → ${relative(process.cwd(), archive)}`);
}
