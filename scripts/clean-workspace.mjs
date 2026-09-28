import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";

import { assertRepoRoot, removeNodeModules } from "./clean-node-modules.mjs";

const mode = process.argv[2];
if (mode !== "local" && mode !== "slate") {
  console.error("Use: node scripts/clean-workspace.mjs local|slate");
  process.exit(1);
}

const root = process.cwd();
const lockfile = "package-lock.json";

assertRepoRoot();

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function restoreLockfile() {
  const lockPath = path.join(root, lockfile);
  const git = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, encoding: "utf8" });
  if (git.status !== 0) {
    if (!existsSync(lockPath)) {
      console.error("package-lock.json is missing. npm ci cannot run without the lockfile from this repository.");
      process.exit(1);
    }
    console.log("Kept package-lock.json. npm ci needs it, so it was not deleted.");
    return;
  }

  const tracked = spawnSync("git", ["ls-files", "--error-unmatch", lockfile], { cwd: root, stdio: "ignore" });
  if (tracked.status !== 0) {
    if (!existsSync(lockPath)) {
      console.error("package-lock.json is missing and is not in git. npm ci cannot run.");
      process.exit(1);
    }
    console.log("Kept package-lock.json. npm ci needs it, so it was not deleted.");
    return;
  }

  const same = spawnSync("git", ["diff", "--quiet", "HEAD", "--", lockfile], { cwd: root });
  if (!existsSync(lockPath) || same.status !== 0) {
    run("git", ["checkout", "HEAD", "--", lockfile]);
    console.log("Restored package-lock.json from git. npm ci needs it, so it was not deleted.");
    return;
  }
  console.log("package-lock.json already matches git. Left it in place.");
}

async function removeLocalFile(name) {
  const full = path.join(root, name);
  if (!existsSync(full)) return;
  await rm(full, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`Removed ${name}`);
}

function stopStackAndVolumes() {
  console.log("Stopping containers and deleting Docker volumes for this project. The database, media, resumes, and virus definitions on this machine will be deleted.");
  const env = { ...process.env };
  if (!existsSync(path.join(root, ".env"))) {
    env.POSTGRES_DB ??= "dotone_trip";
    env.POSTGRES_USER ??= "dotone_app";
    env.POSTGRES_PASSWORD ??= "unused-for-down";
    env.AUTH_PASSWORD_PEPPER ??= "unused-for-down";
    env.PII_ENCRYPTION_KEY ??= "unused-for-down";
    env.APP_ORIGIN ??= "http://localhost:3000";
  }
  run(
    "docker",
    ["compose", "--profile", "full", "--profile", "migrate", "--profile", "seed", "down", "--remove-orphans", "-v"],
    env,
  );
}

if (mode === "slate") stopStackAndVolumes();

try {
  const modules = await removeNodeModules();
  console.log(modules === "absent" ? "node_modules is already gone." : "Removed node_modules.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

await removeLocalFile(".env");
await removeLocalFile(".env.local");
await removeLocalFile(".next");
restoreLockfile();

if (mode === "local") {
  console.log("Local files are cleared. Docker containers and volumes were kept.");
  console.log("A new .env will not match an old database volume. For a real fresh start, run npm run clean:slate and then npm run setup:fresh.");
} else {
  console.log("Containers, volumes, .env, and node_modules are gone. package-lock.json is the copy from git.");
  console.log("Run npm run setup:fresh.");
}
