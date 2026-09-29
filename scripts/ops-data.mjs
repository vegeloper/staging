import { spawn, spawnSync } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const mode = process.argv[2];
const modes = ["backup", "slot-up", "slot-restore", "slot-down"];
if (!modes.includes(mode)) {
  console.error("Use: node scripts/ops-data.mjs backup|slot-up|slot-restore|slot-down");
  process.exit(1);
}

const root = process.cwd();
const primaryFiles = ["compose.yaml"];
const slotFiles = ["compose.yaml", "compose.slot.yaml"];
const slotEnvPath = path.join(root, ".env.slot");

function assertRepo() {
  if (!existsSync(path.join(root, "compose.yaml")) || !existsSync(path.join(root, "package.json"))) {
    console.error("Run this from the repository root.");
    process.exit(1);
  }
}

function readEnvFile(file) {
  const values = {};
  if (!existsSync(file)) return values;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function run(args, env) {
  const result = spawnSync("docker", args, { cwd: root, stdio: "inherit", env: env ?? process.env });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function composeArgs(files, envFile, args) {
  const full = ["compose"];
  for (const file of files) full.push("-f", file);
  if (envFile) full.push("--env-file", envFile);
  full.push(...args);
  return full;
}

function requirePrimaryEnv() {
  const env = readEnvFile(path.join(root, ".env"));
  if (!env.POSTGRES_USER || !env.POSTGRES_DB || !env.POSTGRES_PASSWORD) {
    console.error(".env is missing database settings. Run this from a checkout that already started.");
    process.exit(1);
  }
  return env;
}

function stamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function streamToFile(args, destination) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
    const output = createWriteStream(destination);
    child.on("error", reject);
    child.stdout.on("error", reject);
    output.on("error", reject);
    child.stdout.pipe(output);
    child.on("close", (code) => {
      output.close();
      if (code === 0) resolve();
      else reject(new Error(`docker exited ${code}`));
    });
  });
}

function fileToStream(args, source) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { cwd: root, stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", reject);
    createReadStream(source)
      .on("error", reject)
      .pipe(child.stdin)
      .on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker exited ${code}`));
    });
  });
}

function volumeExists(name) {
  const result = spawnSync("docker", ["volume", "inspect", name], { stdio: "ignore" });
  return result.status === 0;
}

function archiveVolume(volume, directory, file) {
  if (!volumeExists(volume)) {
    console.log(`Skip ${volume}. It is not on this machine.`);
    return;
  }
  run([
    "run",
    "--rm",
    "-v",
    `${volume}:/from:ro`,
    "-v",
    `${directory}:/to`,
    "busybox:1.37",
    "tar",
    "-C",
    "/from",
    "-cf",
    `/to/${file}`,
    ".",
  ]);
  console.log(`Saved ${file} from ${volume}.`);
}

function extractVolume(volume, directory, file) {
  const archive = path.join(directory, file);
  if (!existsSync(archive)) {
    console.log(`Skip ${file}. It is not in this backup.`);
    return;
  }
  run(["volume", "create", volume]);
  run([
    "run",
    "--rm",
    "-v",
    `${volume}:/to`,
    "-v",
    `${directory}:/from:ro`,
    "busybox:1.37",
    "tar",
    "-C",
    "/to",
    "-xf",
    `/from/${file}`,
  ]);
  console.log(`Restored ${file} into ${volume}.`);
}

async function backup() {
  const env = requirePrimaryEnv();
  const directory = path.join(root, "backups", stamp());
  mkdirSync(directory, { recursive: true });
  const user = env.POSTGRES_USER;
  const db = env.POSTGRES_DB;
  console.log(`Writing backup to ${directory}`);
  await streamToFile(
    composeArgs(primaryFiles, null, [
      "exec",
      "-T",
      "postgres",
      "pg_dump",
      "-U",
      user,
      "-d",
      db,
      "-Fc",
      "--no-owner",
      "--no-acl",
    ]),
    path.join(directory, "database.dump"),
  );
  console.log("Saved database.dump.");
  archiveVolume("dotone-trip-resumes-data", directory, "resumes.tar");
  archiveVolume("dotone-trip-media-data", directory, "media.tar");
  archiveVolume("dotone-trip-clamav-data", directory, "clamav.tar");
  archiveVolume("dotone-trip-caddy-data", directory, "caddy-data.tar");
  archiveVolume("dotone-trip-caddy-config", directory, "caddy-config.tar");
  writeFileSync(path.join(directory, "env.copy"), readFileSync(path.join(root, ".env")));
  const counts = spawnSync(
    "docker",
    composeArgs(primaryFiles, null, [
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      user,
      "-d",
      db,
      "-At",
      "-c",
      "select 'posts='||count(*) from content_posts union all select 'media='||count(*) from media_assets union all select 'submissions='||count(*) from submissions union all select 'resumes='||count(*) from job_applications;",
    ]),
    { cwd: root, encoding: "utf8" },
  );
  const summary = [
    `created=${new Date().toISOString()}`,
    "database=database.dump",
    "files=resumes.tar media.tar clamav.tar",
    "secrets=env.copy",
    counts.stdout?.trim() || "counts=unavailable",
  ].join("\n");
  writeFileSync(path.join(directory, "MANIFEST.txt"), `${summary}\n`);
  console.log(summary);
  console.log("Move env.copy to the password store. Do not commit backups/.");
}

function writeSlotEnv() {
  if (existsSync(slotEnvPath)) {
    console.log(".env.slot already exists. Ports and secrets were left as they are.");
    return;
  }
  const source = readFileSync(path.join(root, ".env"), "utf8");
  const values = readEnvFile(path.join(root, ".env"));
  let text = source;
  const set = (key, value) => {
    if (new RegExp(`^${key}=`, "m").test(text)) text = text.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
    else text += `\n${key}=${value}\n`;
  };
  set("APP_BIND_ADDRESS", "127.0.0.1");
  set("APP_PORT", "3001");
  set("APP_ORIGIN", "http://127.0.0.1:3001");
  set("POSTGRES_BIND_ADDRESS", "127.0.0.1");
  set("POSTGRES_PORT", "5433");
  set("TRUST_PROXY", "false");
  set("SLOT_PREFIX", "dotone-trip-slot");
  set("RESUME_HOST_PATH", "resumes_data");
  set("MEDIA_HOST_PATH", "media_data");
  const password = values.POSTGRES_PASSWORD;
  const user = values.POSTGRES_USER || "dotone_app";
  const db = values.POSTGRES_DB || "dotone_trip";
  if (password) set("DATABASE_URL", `postgresql://${user}:${password}@127.0.0.1:5433/${db}`);
  writeFileSync(slotEnvPath, text);
  console.log("Wrote .env.slot from .env with ports 3001, 5433, and 3311. Secrets were copied, not regenerated.");
}

function slotPrefix() {
  const values = readEnvFile(slotEnvPath);
  const prefix = values.SLOT_PREFIX || "dotone-trip-slot";
  if (prefix === "dotone-trip") {
    console.error("SLOT_PREFIX must not be dotone-trip. That name is the live stack.");
    process.exit(1);
  }
  return prefix;
}

function slotUp() {
  requirePrimaryEnv();
  writeSlotEnv();
  slotPrefix();
  console.log("Starting the second instance. It does not use ports 80, 443, 3000, 5432, or 3310.");
  run(
    composeArgs(slotFiles, ".env.slot", ["--profile", "full", "up", "-d", "--build"]),
  );
  const values = readEnvFile(slotEnvPath);
  console.log(`Second instance: http://127.0.0.1:${values.APP_PORT || "3001"}`);
}

async function waitPostgres() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const result = spawnSync(
      "docker",
      composeArgs(slotFiles, ".env.slot", ["exec", "-T", "postgres", "pg_isready", "-U", readEnvFile(slotEnvPath).POSTGRES_USER || "dotone_app"]),
      { cwd: root, stdio: "ignore" },
    );
    if (result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.error("The slot Postgres did not become ready.");
  process.exit(1);
}

async function slotRestore() {
  requirePrimaryEnv();
  if (!existsSync(slotEnvPath)) writeSlotEnv();
  const prefix = slotPrefix();
  const requested = process.argv[3];
  const backupDir = requested
    ? path.resolve(root, requested)
    : latestBackup();
  if (!existsSync(path.join(backupDir, "database.dump"))) {
    console.error(`No database.dump in ${backupDir}`);
    process.exit(1);
  }
  console.log(`Restoring ${backupDir} into ${prefix}. The live dotone-trip volumes are not changed.`);
  run(composeArgs(slotFiles, ".env.slot", ["--profile", "full", "stop", "app"]));
  extractVolume(`${prefix}-resumes-data`, backupDir, "resumes.tar");
  extractVolume(`${prefix}-media-data`, backupDir, "media.tar");
  extractVolume(`${prefix}-clamav-data`, backupDir, "clamav.tar");
  run(composeArgs(slotFiles, ".env.slot", ["--profile", "full", "up", "-d", "postgres"]));
  await waitPostgres();
  const values = readEnvFile(slotEnvPath);
  await fileToStream(
    composeArgs(slotFiles, ".env.slot", [
      "exec",
      "-T",
      "postgres",
      "pg_restore",
      "-U",
      values.POSTGRES_USER,
      "-d",
      values.POSTGRES_DB,
      "--clean",
      "--if-exists",
      "--no-owner",
      "--exit-on-error",
    ]),
    path.join(backupDir, "database.dump"),
  );
  console.log("Database restore finished.");
  run(composeArgs(slotFiles, ".env.slot", ["--profile", "full", "up", "-d"]));
  console.log(`Check http://127.0.0.1:${values.APP_PORT || "3001"}/api/ready and the admin library.`);
}

function latestBackup() {
  const parent = path.join(root, "backups");
  if (!existsSync(parent)) {
    console.error("No backups/ directory. Run npm run ops:backup first.");
    process.exit(1);
  }
  const dirs = readdirSync(parent)
    .map((name) => path.join(parent, name))
    .filter((full) => statSync(full).isDirectory())
    .sort();
  if (!dirs.length) {
    console.error("backups/ has no timestamp folder.");
    process.exit(1);
  }
  return dirs[dirs.length - 1];
}

function slotDown() {
  if (!existsSync(slotEnvPath)) {
    console.error(".env.slot is missing. There is no second instance to stop.");
    process.exit(1);
  }
  slotPrefix();
  const wipe = process.argv.includes("--wipe");
  const args = ["--profile", "full", "--profile", "migrate", "--profile", "seed", "down", "--remove-orphans"];
  if (wipe) {
    console.log("Stopping the second instance and deleting only its volumes.");
    args.push("-v");
  } else {
    console.log("Stopping the second instance. Its volumes stay. The live stack is not stopped.");
  }
  run(composeArgs(slotFiles, ".env.slot", args));
}

assertRepo();

if (mode === "backup") await backup();
else if (mode === "slot-up") slotUp();
else if (mode === "slot-restore") await slotRestore();
else slotDown();
