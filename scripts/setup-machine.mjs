import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const mode = process.argv[2];
const modes = ["fresh", "update", "prod", "prod-update", "prod-image"];
if (!modes.includes(mode)) {
  console.error("Use: node scripts/setup-machine.mjs fresh|update|prod|prod-update|prod-image");
  process.exit(1);
}

const fromImage = mode === "prod-image";
const prod = mode === "prod" || mode === "prod-update" || fromImage;
const composeFiles = prod ? ["-f", "compose.yaml", "-f", "compose.prod.yaml"] : [];

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

function isHostname(value) {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(value);
}

function prodLooksReady(values) {
  const host = values.APP_HOST ?? "";
  return envLooksReady(values) && values.TRUST_PROXY === "true" && isHostname(host) && values.APP_ORIGIN === `https://${host}`;
}

function applyProdPublic(text, host, origin) {
  let next = text.replace(/^TRUST_PROXY=.*$/m, "TRUST_PROXY=true");
  next = next.replace(/^APP_ORIGIN=.*$/m, `APP_ORIGIN=${origin}`);
  if (/^# ?APP_HOST=.*$/m.test(next)) {
    next = next.replace(/^# ?APP_HOST=.*$/m, `APP_HOST=${host}`);
  } else if (/^APP_HOST=.*$/m.test(next)) {
    next = next.replace(/^APP_HOST=.*$/m, `APP_HOST=${host}`);
  } else {
    next += `\nAPP_HOST=${host}\n`;
  }
  return next;
}

async function askPublicSite() {
  if (!input.isTTY) {
    console.error("Run this from a terminal. It has to ask for the public hostname.");
    process.exit(1);
  }
  const rl = createInterface({ input, output });
  try {
    let host = "";
    while (!isHostname(host)) {
      host = (await rl.question("Public hostname (example: trip.example.com): ")).trim().toLowerCase();
      if (!isHostname(host)) console.error("Enter the hostname only. No https:// and no path.");
    }
    const suggested = `https://${host}`;
    let origin = "";
    while (origin !== suggested) {
      const answer = (await rl.question(`Public URL [${suggested}]: `)).trim();
      origin = (answer || suggested).replace(/\/$/, "");
      if (origin !== suggested) {
        console.error(`APP_ORIGIN must be ${suggested} so it matches APP_HOST for Caddy.`);
      }
    }
    return { host, origin };
  } finally {
    rl.close();
  }
}

function writeFreshEnv(transform) {
  if (!existsSync(".env.example")) {
    console.error(".env.example is missing. Run this from the repository root.");
    process.exit(1);
  }
  if (existsSync(".env")) {
    const current = readEnvFile(".env");
    if (envLooksReady(current)) {
      console.error(
        fromImage
          ? "This checkout already has a .env. npm run setup:prod:dockerImage is only for the first install from a loaded image."
          : `This checkout already has a .env. Run npm run ${prod ? "setup:prod:update" : "setup:update"}.`,
      );
      console.error("A fresh setup would create a second database password and rotate the admin accounts.");
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
  if (transform) text = transform(text);
  writeFileSync(".env", text);
  console.log("Wrote .env with a database password and encryption keys. Do not commit it.");
}

function run(command, args) {
  // Node on Windows returns EINVAL if it spawns npm.cmd directly.
  // One shell command string resolves the npm shim. docker.exe does not need that.
  const result =
    process.platform === "win32" && command === "npm"
      ? spawnSync([command, ...args].join(" "), { stdio: "inherit", shell: true })
      : spawnSync(command, args, { stdio: "inherit" });
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

function appIsReady() {
  if (!prod) {
    const values = readEnvFile(".env");
    const port = values.APP_PORT || "3000";
    return fetch(`http://127.0.0.1:${port}/api/ready`).then((response) => response.ok).catch(() => false);
  }
  const result = spawnSync(
    "docker",
    [
      "compose",
      ...composeFiles,
      "exec",
      "-T",
      "app",
      "node",
      "-e",
      "fetch('http://127.0.0.1:3000/api/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
    ],
    { stdio: "ignore" },
  );
  return result.status === 0;
}

async function waitReady() {
  const values = readEnvFile(".env");
  const port = values.APP_PORT || "3000";
  const where = prod ? "the app container" : `http://127.0.0.1:${port}/api/ready`;
  const deadline = Date.now() + 12 * 60 * 1000;
  console.log(`Waiting for ${where}. The first ClamAV start downloads virus definitions and can take several minutes.`);
  while (Date.now() < deadline) {
    if (await appIsReady()) {
      console.log("The site is up.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  console.error("The site did not become ready. Check the clamav service, then the app logs.");
  process.exit(1);
}

function compose(args) {
  run("docker", ["compose", ...composeFiles, ...args]);
}

function imagePresent(name) {
  const result = spawnSync("docker", ["image", "inspect", name], { stdio: "ignore" });
  return result.status === 0;
}

function shippedImagesReady() {
  if (imagePresent("dotone-trip-migrate:latest") && !imagePresent("dotone-trip-seed:latest")) {
    const tagged = spawnSync("docker", ["tag", "dotone-trip-migrate:latest", "dotone-trip-seed:latest"], {
      stdio: "inherit",
    });
    if (tagged.status !== 0) process.exit(tagged.status ?? 1);
  }
  return ["dotone-trip-app:latest", "dotone-trip-migrate:latest", "dotone-trip-seed:latest"].every(imagePresent);
}

requireDocker();

if (mode === "fresh" || mode === "prod" || fromImage) {
  if (fromImage && !shippedImagesReady()) {
    console.error("The app, migrate, and seed images are not loaded. Run npm run docker:load first.");
    process.exit(1);
  }
  if (prod) {
    console.log(
      fromImage
        ? "Production from loaded images: .env, Caddy, HTTPS origin, database, media volume, virus scanner, and admin accounts. The server will not build."
        : "Production setup: .env, Caddy, HTTPS origin, database, media volume, virus scanner, and admin accounts. This server will build the images.",
    );
    const site = await askPublicSite();
    writeFreshEnv((text) => applyProdPublic(text, site.host, site.origin));
  } else {
    console.log("Fresh setup: .env, dependencies, database, media volume, virus scanner, and admin accounts.");
    writeFreshEnv();
  }
  run("npm", ["ci"]);
  compose(["--profile", "full", "up", "-d", fromImage ? "--no-build" : "--build"]);
  await waitReady();
  console.log("Creating admin, operator, and creator. Save the passwords printed next. They are not written to a file.");
  compose([
    "--profile",
    "seed",
    "run",
    "--rm",
    fromImage ? "--no-build" : "--build",
    "--no-deps",
    "seed",
    "npm",
    "run",
    "db:bootstrap",
  ]);
  if (prod) {
    const host = readEnvFile(".env").APP_HOST;
    console.log(`Open https://${host}`);
    console.log(`Admin login: https://${host}/admin/login`);
    console.log("Caddy serves ports 80 and 443. DNS for this hostname must point at this server before the certificate is issued.");
  } else {
    const port = readEnvFile(".env").APP_PORT || "3000";
    console.log(`Open http://127.0.0.1:${port}/admin/login`);
  }
  console.log("Usernames are admin, operator, and creator. Running this bootstrap again rotates all three passwords.");
} else if (mode === "prod-update") {
  if (!existsSync(".env") || !envLooksReady(readEnvFile(".env"))) {
    console.error("No ready .env in this checkout. On a new server run npm run setup:prod.");
    process.exit(1);
  }
  if (!prodLooksReady(readEnvFile(".env"))) {
    const site = await askPublicSite();
    const text = applyProdPublic(readFileSync(".env", "utf8"), site.host, site.origin);
    writeFileSync(".env", text);
    console.log("Set APP_ORIGIN, APP_HOST, and TRUST_PROXY. Existing secrets were kept.");
  }
  console.log("Production update: install dependencies, apply migrations, and recreate the stack with Caddy. Passwords stay as they are.");
  run("npm", ["ci"]);
  compose(["--profile", "full", "up", "-d", "--build"]);
  await waitReady();
  const host = readEnvFile(".env").APP_HOST;
  console.log(`Update finished. Open https://${host}`);
  console.log("Admin passwords were not changed. The app starts only after ClamAV is healthy, so media uploads can run.");
} else {
  if (!existsSync(".env") || !envLooksReady(readEnvFile(".env"))) {
    console.error("No ready .env in this checkout. On a new machine run npm run setup:fresh.");
    process.exit(1);
  }
  console.log("Update: install dependencies, apply migrations, and recreate the app with the media volume and ClamAV. Passwords stay as they are.");
  run("npm", ["ci"]);
  compose(["--profile", "full", "up", "-d", "--build"]);
  await waitReady();
  console.log("Update finished. Admin passwords were not changed. The app starts only after ClamAV is healthy, so media uploads can run.");
}
