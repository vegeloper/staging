import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { askPath } from "./ask-path.mjs";

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

requireDocker();

const tarPath = await askPath("Where is the image tar?");
if (!existsSync(tarPath) || !statSync(tarPath).isFile()) {
  fail(`No tar file at ${tarPath}`);
}

const relativeToRepo = path.relative(process.cwd(), path.resolve(tarPath));
const insideRepo =
  existsSync("compose.yaml") &&
  relativeToRepo !== "" &&
  !relativeToRepo.startsWith("..") &&
  !path.isAbsolute(relativeToRepo);
console.log(`Loading ${tarPath}`);
run("docker", ["load", "-i", tarPath]);

if (!imagePresent(migrateImage)) {
  fail("The tar did not contain dotone-trip-migrate:latest.");
}
if (!imagePresent(seedImage)) {
  console.log("Tagging the migrate image as dotone-trip-seed.");
  run("docker", ["tag", migrateImage, seedImage]);
}
if (!imagePresent(appImage) || !imagePresent(migrateImage) || !imagePresent(seedImage)) {
  fail("Load finished, but dotone-trip-app, dotone-trip-migrate, or dotone-trip-seed is missing.");
}

console.log("Loaded dotone-trip-app, dotone-trip-migrate, and dotone-trip-seed.");
if (insideRepo) {
  console.log("Move this tar out of the repository (for example /tmp) before starting Compose. A tar left in the project folder is copied into later image builds.");
}
console.log("Next, from the repository root, run npm run setup:prod:dockerImage.");
console.log("That command writes .env, starts Caddy, and creates the admin accounts from these images. It does not build on this server.");
