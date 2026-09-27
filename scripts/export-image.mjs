import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

import { askPath, confirm } from "./ask-path.mjs";

const appImage = "dotone-trip-app:latest";
const migrateImage = "dotone-trip-migrate:latest";
const seedImage = "dotone-trip-seed:latest";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function imagePresent(name) {
  const result = spawnSync("docker", ["image", "inspect", name], { stdio: "ignore" });
  return result.status === 0;
}

function requireDocker() {
  const result = spawnSync("docker", ["compose", "version"], { stdio: "inherit" });
  if (result.error || result.status !== 0) {
    fail("Docker Compose is required. Install Docker Engine 24+ and Compose v2.24+, and start the Docker daemon.");
  }
}

function destinationFile(resolved) {
  const looksLikeDirectory = resolved.endsWith(path.sep) || resolved.endsWith("/");
  if (looksLikeDirectory) return path.join(resolved, "dotone-trip-images.tar");
  try {
    if (statSync(resolved).isDirectory()) return path.join(resolved, "dotone-trip-images.tar");
  } catch {
    // The file does not exist yet.
  }
  return resolved.toLowerCase().endsWith(".tar") ? resolved : `${resolved}.tar`;
}

if (!existsSync("compose.yaml") || !existsSync("Dockerfile")) {
  fail("Run this from the repository root.");
}

requireDocker();

if (!imagePresent(appImage) || !imagePresent(migrateImage)) {
  if (!existsSync(".env")) {
    fail("The app image is not built yet, and this folder has no .env. Compose needs .env before it can build. On this PC run npm run setup:fresh once, then run the export again.");
  }
  console.log("App image is missing. Building app and migrate first.");
  run("docker", ["compose", "--profile", "full", "build", "app", "migrate"]);
}

if (!imagePresent(appImage) || !imagePresent(migrateImage)) {
  fail("Build finished but dotone-trip-app or dotone-trip-migrate is still missing.");
}

run("docker", ["tag", migrateImage, seedImage]);

const chosen = await askPath("Where should the image tar be saved?");
const outputPath = destinationFile(chosen);
if (existsSync(outputPath)) {
  const ok = await confirm(`${outputPath} already exists. Overwrite it? [y/N]: `);
  if (!ok) fail("Export cancelled.");
}
mkdirSync(path.dirname(outputPath), { recursive: true });

console.log(`Saving ${appImage}, ${migrateImage}, and ${seedImage}.`);
console.log("This can take several minutes.");
run("docker", ["save", "-o", outputPath, appImage, migrateImage, seedImage]);

const sizeMb = Math.round(statSync(outputPath).size / (1024 * 1024));
console.log(`Wrote ${outputPath} (${sizeMb} MB).`);
console.log("Copy that file to the VPS, then from the repository root run npm run docker:load.");
console.log("After the load finishes, run npm run setup:prod:dockerImage.");
