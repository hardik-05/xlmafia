// Copies the pdf.js worker into /public so the secure viewer can load it
// same-origin (no CDN, keeps a strict CSP possible). Runs on postinstall,
// predev and prebuild. Safe to run repeatedly; a no-op if the source is
// missing (e.g. before `npm install`).
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.mjs",
];

const dest = join(root, "public", "pdf.worker.min.mjs");
mkdirSync(join(root, "public"), { recursive: true });

const src = candidates.map((c) => join(root, c)).find((p) => existsSync(p));
if (!src) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found yet; skipping.");
  process.exit(0);
}

copyFileSync(src, dest);
console.log(`[copy-pdf-worker] ${src} -> ${dest}`);
