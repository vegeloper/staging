import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const mode = process.argv[2];
if (mode !== "fresh" && mode !== "update") {
  console.error("Use: node scripts/setup-machine.mjs fresh|update");
  process.exit(1);
}

const hex = (bytes) => randomBytes(bytes).toString("hex");
const b64 = (bytes) => randomBytes(bytes).toString("base64");

function readEnvFile(path) {
  const values = {};
  if (!existsSync(path)) return values;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function envLooksReady(values) {
  const password = values.POSTGRES_PASSWORD ?? "";
  const pepper = values.AUTH_PASSWORD_PEPPER ?? "";
  const key = values.PII_ENCRYPTION_KEY ?? "";
  return (
    password.length >= 32 &&
    !password.includes("replace-with") &&
    pepper.length >= 16 &&
    key.length >= 16 &&
    (values.DATABASE_URL ?? "").includes(password)
  );
}

function writeFreshEnv() {
  if (!existsSync(".env.example")) {
    console.error(".env.example is missing. Run this from the repository root.");
    process.exit(1);
  }
  if (existsSync(".env")) {
    const current = readEnvFile(".env");
    if (envLooksReady(current)) {
      console.error("This checkout already has a .env. Run npm run setup:update.");
      console.error("setup:fresh would create a second database password and rotate the admin accounts.");
      process.exit(1);
    }
    console.error(".env exists but is still the example. Delete it or finish the values, then run this again.");
    process.exit(1);
  }

  const password = hex(32);
  const pepper = b64(32);
  const key = b64(32);
  let text = readFileSync(".env.example", "utf8");
  text = text.replaceAll("replace-with-64-char-hex", password);
  text = text.replace(/^AUTH_PASSWORD_PEPPER=.*$/m, `AUTH_PASSWORD_PEPPER=${pepper}`);
  text = text.replace(/^PII_ENCRYPTION_KEY=.*$/m, `PII_ENCRYPTION_KEY=${key}`);
  writeFileSync(".env", text);
  console.log("Wrote .env with a database password and encryption keys. Do not commit it.");
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function requireDocker() {
  const result = spawnSync("docker", ["compose", "version"], { stdio: "inherit" });
  if (result.error || result.status !== 0) {
    console.error("Docker Compose is required. Install Docker Engine 24+ and Compose v2.24+, and start the Docker daemon.");
    process.exit(1);
  }
}

async function waitReady() {
  const values = readEnvFile(".env");
  const port = values.APP_PORT || "3000";
  const url = `http://127.0.0.1:${port}/api/ready`;
  const deadline = Date.now() + 12 * 60 * 1000;
  console.log(`Waiting for ${url}. The first ClamAV start downloads virus definitions and can take several minutes.`);
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log("The site is up.");
        return;
      }
    } catch {
      // The app container is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  console.error("The site did not become ready. Run npm run docker:logs and check the clamav service.");
  process.exit(1);
}

requireDocker();

if (mode === "fresh") {
  console.log("Fresh setup: .env, dependencies, database, media volume, virus scanner, and admin accounts.");
  writeFreshEnv();
  run("npm", ["ci"]);
  run("docker", ["compose", "--profile", "full", "up", "-d", "--build"]);
  await waitReady();
  console.log("Creating admin, operator, and creator. Save the passwords printed next. They are not written to a file.");
  run("docker", ["compose", "--profile", "seed", "run", "--rm", "--build", "seed", "npm", "run", "db:bootstrap"]);
  const port = readEnvFile(".env").APP_PORT || "3000";
  console.log(`Open http://127.0.0.1:${port}/admin/login`);
  console.log("Usernames are admin, operator, and creator. Running this bootstrap again rotates all three passwords.");
} else {
  if (!existsSync(".env") || !envLooksReady(readEnvFile(".env"))) {
    console.error("No ready .env in this checkout. On a new machine run npm run setup:fresh.");
    process.exit(1);
  }
  console.log("Update: install dependencies, apply migrations, and recreate the app with the media volume and ClamAV. Passwords stay as they are.");
  run("npm", ["ci"]);
  run("docker", ["compose", "--profile", "full", "up", "-d", "--build"]);
  await waitReady();
  console.log("Update finished. Admin passwords were not changed. The app starts only after ClamAV is healthy, so media uploads can run.");
}
