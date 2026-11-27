// DealLens entrypoint (Node 22, stdlib only).
// Copies app/ and screenshots/ into the grader's output directory, then
// writes /output/dossier.json with the kit's buildDossier helper.
// /output is a mount point in the grader, so it is never removed or
// re-permissioned here: only mkdirSync, then chmod the files this entry
// created inside it (0644 files, 0755 directories) so the grader, which
// collects the output as another user, can read them.
// Two runs write byte-identical output: directory entries are copied in
// sorted order and nothing in the output carries a timestamp.
import {
  chmodSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const ROOT = dirname(fileURLToPath(import.meta.url));

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function copyDir(src: string, dst: string): void {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src).sort()) {
    const from = join(src, name);
    const to = join(dst, name);
    if (lstatSync(from).isDirectory()) copyDir(from, to);
    else copyFileSync(from, to);
  }
}

function chmodTree(dir: string): void {
  chmodSync(dir, 0o755);
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (lstatSync(p).isDirectory()) chmodTree(p);
    else chmodSync(p, 0o644);
  }
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  copyDir(join(ROOT, "app"), join(OUT, "app"));
  copyDir(join(ROOT, "screenshots"), join(OUT, "screenshots"));
  const dossier = buildDossier(OUT, CAPS);
  if (dossier.length === 0) throw new Error("buildDossier returned empty bytes");
  writeFileSync(join(OUT, "dossier.json"), dossier);
  for (const name of readdirSync(OUT).sort()) {
    const p = join(OUT, name);
    if (lstatSync(p).isDirectory()) chmodTree(p);
    else chmodSync(p, 0o644);
  }
}

main();
