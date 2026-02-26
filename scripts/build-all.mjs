#!/usr/bin/env node
/**
 * Build CapstoneHub and all lab apps into a single dist/ for deployment.
 * Labs are built with base /labs/<slug>/ and output to CapstoneHub/dist/labs/<slug>/
 */
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, rmSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const HUB_DIST = join(ROOT, "CapstoneHub", "dist");

const LABS = [
  { name: "ExposureLAB", path: "ExposureLAB", slug: "exposure" },
  { name: "BitDepthVisualizer", path: "BitDepthVisualizer", slug: "bit-depth" },
  { name: "DemosaicLab", path: "DemosaicLab", slug: "demosaic" },
  { name: "ImageLab", path: "ImageLab", slug: "image" },
  { name: "PhotonSimulation", path: "PhotonSimulation", slug: "photon-sim" },
];

function run(cmd, args, cwd = ROOT, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("Building CapstoneHub...");
run("npm", ["run", "build"], join(ROOT, "CapstoneHub"));

if (!existsSync(HUB_DIST)) {
  console.error("CapstoneHub dist/ not found after build.");
  process.exit(1);
}

const labsDir = join(HUB_DIST, "labs");
if (!existsSync(labsDir)) mkdirSync(labsDir, { recursive: true });

for (const lab of LABS) {
  const labPath = join(ROOT, lab.path);
  const labPkg = join(labPath, "package.json");
  if (!existsSync(labPath) || !existsSync(labPkg)) {
    console.log(`\nSkipping ${lab.name} (directory or package.json not found)`);
    continue;
  }
  const labNodeModules = join(labPath, "node_modules");
  const labLock = join(labPath, "package-lock.json");

  // Always do a clean install: remove stale node_modules and lockfile
  // so npm resolves a consistent dependency tree for this platform.
  if (existsSync(labNodeModules)) rmSync(labNodeModules, { recursive: true, force: true });
  if (existsSync(labLock)) unlinkSync(labLock);

  console.log(`\nInstalling deps for ${lab.name}...`);
  run("npm", ["install", "--no-package-lock"], labPath);

  const outDir = join(labsDir, lab.slug);
  const base = `/labs/${lab.slug}/`;
  console.log(`\nBuilding ${lab.name} → ${base}`);
  run("node", [
    join(labNodeModules, "vite", "bin", "vite.js"),
    "build", "--base", base, "--outDir", outDir,
  ], labPath);
}

console.log("\n✓ All builds complete. Output: CapstoneHub/dist/");
