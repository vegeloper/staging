import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const target = path.join(root, "node_modules");

export function assertRepoRoot() {
  if (!existsSync(path.join(root, "package.json")) || !existsSync(path.join(root, "compose.yaml"))) {
    console.error("Run this from the repository root.");
    process.exit(1);
  }
}

function keepPids() {
  return new Set([process.pid, process.ppid].filter((pid) => Number.isInteger(pid) && pid > 0));
}

function stopProjectNode() {
  const keep = keepPids();
  if (process.platform === "win32") {
    const rootLiteral = `'${root.replaceAll("'", "''")}'`;
    const keepList = [...keep].join(",");
    const command = [
      `$keep = @(${keepList})`,
      `$root = ${rootLiteral}`,
      "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" |",
      "Where-Object { $keep -notcontains $_.ProcessId -and $_.CommandLine -like ('*' + $root + '*') } |",
      "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
    ].join(" ");
    spawnSync("powershell.exe", ["-NoProfile", "-Command", command], { stdio: "ignore" });
    return;
  }

  const listing = spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" });
  if (listing.status !== 0 || !listing.stdout) return;
  for (const line of listing.stdout.split("\n")) {
    const match = /^(\d+)\s+(.*)$/.exec(line.trim());
    if (!match) continue;
    const pid = Number(match[1]);
    const args = match[2];
    if (keep.has(pid) || !args.includes(root) || !args.includes("node")) continue;
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process already exited.
    }
  }
}

async function removeModulesDir() {
  await rm(target, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
}

export async function removeNodeModules() {
  if (!existsSync(target)) return "absent";
  try {
    await removeModulesDir();
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code !== "EPERM" && code !== "EBUSY" && code !== "ENOTEMPTY" && code !== "EACCES") throw error;
    console.log("node_modules is locked. Stopping other Node processes started in this folder, then trying again.");
    stopProjectNode();
    await new Promise((resolve) => setTimeout(resolve, 600));
    await removeModulesDir();
  }
  if (existsSync(target)) {
    throw new Error("Could not delete node_modules. Close Cursor and any terminal in this folder, then run the command again.");
  }
  return "removed";
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  assertRepoRoot();
  try {
    const result = await removeNodeModules();
    console.log(
      result === "absent"
        ? "node_modules is already gone. .env and package-lock.json were kept. Run npm run setup:update."
        : "Removed node_modules. .env and package-lock.json were kept. Run npm run setup:update.",
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
