# Local test → staging walkthrough

Run these **in order**. Each block is labeled **LOCAL** (your PC / PowerShell) or **VPS** (Linux SSH as root). Do not mix.

Replace:

| Placeholder | Meaning |
| --- | --- |
| `HOST` | Public hostname, no scheme. Example used: `test.purefun.lol` |
| `APP_ORIGIN` | `https://HOST` |
| `VPS_IP` | Server IPv4. Example used: `37.32.29.13` |
| `REPO_URL` | Git remote that contains this code |
| `BRANCH` | Deploy branch. Example used: `staging` |

Windows: use `curl.exe` (not `curl`). Repo root on LOCAL was the git checkout. On VPS: `/opt/dotone-trip`.

Never copy LOCAL `.env` to the VPS. Never reuse `AUTH_PASSWORD_PEPPER` / `PII_ENCRYPTION_KEY` across environments.

---

## A. LOCAL — tools

```powershell
docker compose version
docker info --format "Docker Engine {{.ServerVersion}}"
node -v
```

Need: Compose **v2.24+**, Engine **24+**, Node **22.13+**, Docker Desktop **running**.

---

## B. LOCAL — env

From repo root:

```powershell
Set-Location "<REPO_ROOT>"
Copy-Item .env.example .env
npm run ops:secrets
```

Paste into `.env` (keep `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` identical):

```
POSTGRES_BIND_ADDRESS=127.0.0.1
APP_ORIGIN=http://localhost:3000
TRUST_PROXY=false
DATABASE_SSL=disable
AUTH_PASSWORD_PEPPER=<from ops:secrets>
PII_ENCRYPTION_KEY=<from ops:secrets>
POSTGRES_PASSWORD=<from ops:secrets>
DATABASE_URL=postgresql://dotone_app:<SAME_PASSWORD>@127.0.0.1:5432/dotone_trip
```

Leave `SEED_*` commented. Save `SEED_*` from `ops:secrets` in a password manager (needed for e2e + admin login).

---

## C. LOCAL — Postgres + schema + seed

```powershell
docker compose up -d postgres
docker compose exec postgres pg_isready -U dotone_app -d dotone_trip
```

Expect: `accepting connections`.

```powershell
docker compose --profile migrate up migrate
```

Expect: `[✓] migrations applied successfully!` and exit **0**.

Put `SEED_ADMIN_PASSWORD` and `SEED_OPERATOR_PASSWORD` in `.env` for this command only:

```powershell
docker compose --profile seed up seed
```

Expect: `Seeded admin` / `Seeded operator`, exit **0**. Then **comment out `SEED_*`**.

---

## D. LOCAL — `next dev` checks

```powershell
npm ci
npx next dev --port 3000
```

**Second** PowerShell (leave `next dev` running):

```powershell
curl.exe -fsS http://localhost:3000/api/health
curl.exe -fsS http://localhost:3000/api/ready
```

Expect: `{"ok":true,"service":"web"}` and `{"ok":true,"database":"up"}`.

Browser:

1. `http://localhost:3000/forms` — forms render  
2. Submit **contact** — expect HTTP **201**  
3. `http://localhost:3000/admin/login` — user `admin` + local `SEED_ADMIN_PASSWORD`  
4. Open the new inbox row  
5. Cookie `trip_session`: HttpOnly **yes**, Secure **empty/no**, SameSite **Lax**, Path `/`

---

## E. LOCAL — tests

Dev server still on :3000.

```powershell
npm test
```

Expect: 22 passed.

First time on a PC:

```powershell
npx playwright install chromium
```

Playwright does **not** read `.env`. Password in **this shell only**:

```powershell
$env:SEED_ADMIN_PASSWORD='<local SEED_ADMIN_PASSWORD>'
npm run test:e2e
```

Expect: `1 passed` (not skipped). Close that shell afterward.

---

## F. LOCAL — production image on the laptop

Stop `next dev` (`Ctrl+C`). Port **3000** must be free.

```powershell
docker compose --profile full up --build -d
```

Expect: `dotone-trip-app` built, `migrate` exited 0, `app` started.

If the build dies at `RUN npm ci` with `npm error code ECONNRESET` / `network aborted` (often plus `ENOTEMPTY` cleanup noise): the registry dropped the connection. This is **not** a lockfile, TypeScript, or Compose bug. A failed `npm ci` layer is **not** cached as success. Retry the **same** command — it often succeeds the second time. Do **not** edit `package-lock.json` or the Dockerfile. Use `--no-cache` only if two or three retries still fail the same way. Same rule for later `docker compose --profile full build` (§P.1) and VPS/CI builds (§K).

```powershell
curl.exe -fsS http://127.0.0.1:3000/api/health
curl.exe -fsS http://127.0.0.1:3000/api/ready
```

Browser: `http://127.0.0.1:3000/forms`.

Do **not** use `compose.prod.yaml` on the laptop (Caddy/TLS).

If `next build` fails TypeScript, fix app types before going to a VPS (`tsconfig` must exclude `tests/`).

---

## G. LOCAL — push code the VPS will clone

Commit and push the branch you will deploy (example: `staging`). Do not push `.env`.

---

## H. LOCAL + DNS — before SSH

- A record: `HOST` → `VPS_IP`  
- Cloudflare (if used): **DNS only** (grey cloud) so Caddy can issue Let’s Encrypt  
- VPS inbound **80** and **443** (security group / panel). UFW may be inactive.

---

## I. VPS — Docker

```bash
ssh root@VPS_IP
curl -fsSL https://get.docker.com | sh
docker compose version
```

Need Compose **v2.24+**. Do **not** `apt install docker.io`. Node is **not** required on the VPS.

---

## J. VPS — clone + env (new secrets)

Git clone is **optional**. Runtime does not need `app/` on the server. For a zip of compose + Caddy + images only, skip this clone and use **§Q**.

```bash
git clone --branch BRANCH --single-branch REPO_URL /opt/dotone-trip
cp /opt/dotone-trip/.env.example /opt/dotone-trip/.env
docker run --rm -v /opt/dotone-trip:/app -w /app node:22-bookworm-slim node scripts/generate-prod-secrets.mjs
```


Save the printed secrets off-server. `nano /opt/dotone-trip/.env`:

```
POSTGRES_BIND_ADDRESS=127.0.0.1
APP_ORIGIN=https://HOST
APP_HOST=HOST
TRUST_PROXY=true
DATABASE_SSL=disable
POSTGRES_PASSWORD=<new>
DATABASE_URL=postgresql://dotone_app:<SAME>@127.0.0.1:5432/dotone_trip
AUTH_PASSWORD_PEPPER=<new>
PII_ENCRYPTION_KEY=<new>
```

Uncomment `APP_HOST`. Leave `SEED_*` commented until seed.

```bash
ufw status
cd /opt/dotone-trip
```

Resume PDFs go in the Docker volume `dotone-trip-resumes-data` (writable by uid **1000**). Do **not** bind-mount a root-owned `./data/resumes` — `POST /api/forms/careers` then returns **500**. Emergency if the live box still uses a host bind:

```bash
# VPS — only if compose still bind-mounts ./data/resumes
mkdir -p /opt/dotone-trip/data/resumes
chown -R 1000:1000 /opt/dotone-trip/data/resumes
chmod 775 /opt/dotone-trip/data/resumes
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build --force-recreate app
```

`--force-recreate app` restarts only the web container so it remounts `/app/data/resumes`. `chown` on the host is not enough while the old root-owned mount is still attached. Expect `POST /api/forms/careers` **201** after this. Edge (no Caddy): add `-f compose.edge.yaml` and `up` only `app`.

---

## K. Build: pick one path

### K1 — VPS has **≥4 GB RAM** (build on server)

```bash
# VPS
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --build
```

First `next build` takes minutes. Do not Ctrl+C unless stuck 15+ minutes with no new lines. `ECONNRESET` on `RUN npm ci` is a dropped registry connection — retry; see §F.

### K2 — VPS is **1 GB / 1 CPU** (do **not** build there)

`next build` dies: `JavaScript heap out of memory` during TypeScript. Swap does **not** fix the Node heap cap.

```powershell
# LOCAL — after section F succeeded
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest
scp "$env:USERPROFILE\Desktop\dotone-trip-images.tar" root@VPS_IP:/tmp/
```

```bash
# VPS — tar in /tmp, never inside /opt/dotone-trip
docker load -i /tmp/dotone-trip-images.tar
rm -f /tmp/dotone-trip-images.tar
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```


Optional 2 GB swap if you still try a small-box build (not enough for `next build` on 1 GB):

```bash
# VPS
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && free -h
```

### K3 — GitHub Actions / registry (short)

Build on a **runner ≥4 GB**, push images, pull on the VPS. Do not `next build` on a 1 GB node.

```yaml
# idea only — job steps
docker compose -f compose.yaml -f compose.prod.yaml --profile full build
docker tag dotone-trip-app:latest $REGISTRY/dotone-trip-app:$GITHUB_SHA
docker tag dotone-trip-migrate:latest $REGISTRY/dotone-trip-migrate:$GITHUB_SHA
docker push $REGISTRY/dotone-trip-app:$GITHUB_SHA
docker push $REGISTRY/dotone-trip-migrate:$GITHUB_SHA
```

```bash
# VPS
docker pull $REGISTRY/dotone-trip-app:$SHA
docker pull $REGISTRY/dotone-trip-migrate:$SHA
docker tag $REGISTRY/dotone-trip-app:$SHA dotone-trip-app:latest
docker tag $REGISTRY/dotone-trip-migrate:$SHA dotone-trip-migrate:latest
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Prefer **digest** over `:latest` when the company registry allows it.

---

## L. VPS — prove HTTPS (after K)

```powershell
# LOCAL
curl.exe -fsS https://HOST/api/health
curl.exe -fsS https://HOST/api/ready
```

Expect the same JSON as local. Certificate errors → DNS not pointing, orange cloud, or 80/443 blocked.

---

## M. VPS — seed (do this exactly)

**Wrong** (stops Postgres / fights the `full` stack):

```bash
docker compose --profile seed up seed
```

**Right** — same compose files as production, do not recreate Postgres:

```bash
# VPS — add SEED_* to .env first (this environment’s secrets file, not LOCAL .env)
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile seed run --rm --no-deps seed
```

Expect: `Seeded admin` / `Seeded operator`. Compose v5 `run` has **no** `--no-build`.

Then **delete `SEED_*` from `.env`**. Do not restart the stack for that.

If `up --no-build` later reports migrate exit 1 but logs already show `[✓] migrations applied`:

```bash
# VPS — re-apply only; do not use this as a habit (can recreate Postgres)
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm migrate
```

Prefer `--no-deps` for jobs when Postgres is already healthy.

---

## N. LOCAL browser — staging live

1. `https://HOST/forms` — padlock + forms  
2. Submit contact  
3. `https://HOST/admin/login` — `admin` + **this env’s** `SEED_ADMIN_PASSWORD`  
4. Inbox row matches  
5. Cookie `trip_session`: HttpOnly **true**, Secure **true**, SameSite **Lax**, Path `/`, Domain `HOST`

---

## O. Company live subdomain (next, not done in this test)

New host, **new** `ops:secrets`. Do not reuse staging pepper / PII / DB password.

1. DNS `NEW_HOST` → production IP. **Grey cloud** if Caddy does TLS; **orange cloud** only if Caddy is **stopped** (see below)  
2. **VPS** `.env`: `APP_ORIGIN=https://NEW_HOST`, `APP_HOST=NEW_HOST`, `TRUST_PROXY=true`  
3. Images: K1, K2, or K3  
4. Edge: Caddy (`compose.prod.yaml` `proxy`) **or** company nginx/Cloudflare — not both ACME  
5. Seed once with section M  
6. `curl.exe` `/api/health` and `/api/ready` on `https://NEW_HOST`  
7. Forms + admin + Secure cookie  

**Caddy (grey DNS):** `compose.yaml` + `compose.prod.yaml` `--profile full` `up -d --no-build`.

**Cloudflare orange or existing nginx:** stop `proxy`; publish app only on loopback; nginx `proxy_pass http://127.0.0.1:3000`. Commands and nginx snippet: `docs/02-devops-build-and-deploy.md` §9.

Handoff without git on the VPS: **§Q** (compose + Caddy + images zip/tar). Git clone is optional.

Handoff files if they build from source: `Dockerfile`, `compose.yaml`, `compose.prod.yaml`, `deploy/Caddyfile`, `.env.example`, `docs/DEPLOYMENT.md`, plus `docs/02-devops-build-and-deploy.md` or `docs/03-devops-deploy-from-tar.md`.

---

## P. Later releases (site already live)

Do **not** generate new secrets. Do **not** seed. Do **not** `compose down -v`. Postgres volume stays.

| Change | Extra step |
| --- | --- |
| UI / client / API only | rebuild `app` image, roll `app` |
| `db/schema.ts` / `drizzle/*.sql` | new **`dotone-trip-migrate`** image (§P.5 / §Q.5), migrate **before** new `app` |
| `scripts/db-seed.mjs` | new migrate image (same Dockerfile target), then **seed once** — resets `admin`/`operator` hashes |

### 1. LOCAL — develop and prove

```powershell
# repo root, Postgres already up from section C
npx next dev --port 3000
npm test
$env:SEED_ADMIN_PASSWORD='<this env admin password>'
npm run test:e2e
```

If schema changed:

```powershell
npm run db:generate
# review new files under drizzle/ — do not hand-edit applied SQL
git add drizzle db/schema.ts
```

Commit, push `BRANCH`. Stop `next dev`. Rebuild images:

```powershell
docker compose --profile full build
```

`ECONNRESET` / `network aborted` on `RUN npm ci`: retry the same command. See §F. Do **not** use `compose.prod.yaml` on the laptop.

### 2. Ship images (same as K)

**Strong SERVER (≥4 GB)** — pull git, build there:

```bash
# VPS / SERVER
cd /opt/dotone-trip
git fetch && git checkout BRANCH && git pull
docker compose -f compose.yaml -f compose.prod.yaml --profile full build
```

`ECONNRESET` on `RUN npm ci`: retry. See §F.

**Small SERVER** — tar from LOCAL (do not `next build` on 1 GB). No `git pull` if you ship a new **migrate** image (SQL is inside it). Only scp compose/Caddy if those files changed (§Q).

```powershell
# LOCAL
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest
scp "$env:USERPROFILE\Desktop\dotone-trip-images.tar" root@VPS_IP:/tmp/
```

```bash
# VPS
docker load -i /tmp/dotone-trip-images.tar
rm -f /tmp/dotone-trip-images.tar
```

**Registry:** push/pull/tag as in K3. No git on SERVER unless you build there.

### 3. VPS — migrate then roll (running stack)

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

`--no-deps` so Postgres/`app` are not recreated. UI-only: migrate is a no-op (`[✓]`) — still safe.

If you are using `compose.edge.yaml` (no Caddy) instead of the default setup, modify **both** commands like this:

```bash
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full up -d --no-build postgres migrate app
```

Key changes:
- Add `-f compose.edge.yaml` to **both** commands.
- In the `up` command, bring up **only** `postgres migrate app` (not the full stack).

If `POST /api/forms/careers` is **500** after a roll (root-owned bind): fix perms then recreate `app` — same block as §J.

### 4. LOCAL — smoke the live host

```powershell
curl.exe -fsS https://HOST/api/health
curl.exe -fsS https://HOST/api/ready
```

Browser: changed page + one form or admin path you touched.

### Avoid

```bash
docker compose --profile seed up seed          # resets admin/operator hashes
docker compose down -v                        # deletes submissions
docker compose --profile full up --build      # on a 1 GB box — OOM
# do not replace .env / PII_ENCRYPTION_KEY / AUTH_PASSWORD_PEPPER
```

Rollback web: `docker load` / retag the **previous** `dotone-trip-app` image, then `up -d --no-build`. Do not roll back a destructive SQL migration without a tested down-migration.

### 5. LOCAL + VPS — new migrate image (schema or seed)

`migrate` and `seed` are the **same** image (`Dockerfile` target `migrator`). It already contains `drizzle/*.sql` and `scripts/db-seed.mjs`. Copying those files onto the VPS does **nothing**. You must **rebuild and load** `dotone-trip-migrate`.

Build **only** the migrator (no `next build`) when SQL/seed changed and the UI did not:

```powershell
# LOCAL — repo root, Docker Desktop up
# 1) schema: generate SQL, apply on local Postgres first
npm run db:generate
# open drizzle/ — new 00xx_*.sql only; do not edit already-applied files
docker compose --profile migrate up migrate
# expect [✓] migrations applied successfully!
```

```powershell
# LOCAL — 2) bake the new migrator (profile required)
docker compose --profile migrate build migrate
docker image ls dotone-trip-migrate
```

If the Next app also reads new columns, rebuild **app** too:

```powershell
docker compose --profile full build
```

```powershell
# LOCAL — 3) ship migrate-only (or both if you also rebuilt app)
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-migrate.tar" dotone-trip-migrate:latest
scp "$env:USERPROFILE\Desktop\dotone-trip-migrate.tar" root@VPS_IP:/tmp/
# if app rebuilt:
# docker save -o "$env:USERPROFILE\Desktop\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest
# scp ... /tmp/
```

```bash
# VPS — 4) load, then migrate while app/postgres stay up
docker load -i /tmp/dotone-trip-migrate.tar
docker tag dotone-trip-migrate:latest dotone-trip-seed:latest
rm -f /tmp/dotone-trip-migrate.tar
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm --no-deps migrate
```

Expect `[✓] migrations applied successfully!`. **Then** roll `app` only if you shipped a new app image:

```bash
# VPS
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Order: **new migrate image → run migrate → then new app**. Old `app` + new columns is OK if the migration is additive. New `app` + old schema can 500.

**Seed script change** (`scripts/db-seed.mjs` — still only `admin`/`operator` upserts, not form rows):

```powershell
# LOCAL
docker compose --profile migrate build migrate
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-migrate.tar" dotone-trip-migrate:latest
scp "$env:USERPROFILE\Desktop\dotone-trip-migrate.tar" root@VPS_IP:/tmp/
```

```bash
# VPS — overwrites admin/operator password hashes. Put SEED_* in .env for this command only.
docker load -i /tmp/dotone-trip-migrate.tar
docker tag dotone-trip-migrate:latest dotone-trip-seed:latest
rm -f /tmp/dotone-trip-migrate.tar
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile seed run --rm --no-deps seed
# then delete SEED_* from .env
```

Do **not** seed on every UI release. Form submissions are not seed data.

**Avoid:** `scp drizzle/` to the VPS; `up seed` without the prod overlay; `down -v`; skipping local `docker compose --profile migrate up migrate` before shipping.

---

## Q. Handoff without GitHub on the VPS

Use this when DevOps has **no git**, **no source tree**, or prefers images from a laptop / CI / build service. Runtime is the **images**. A clone of `app/`, `package.json`, `Dockerfile`, or tests is **not** required if you `up --no-build`.

**What you give DevOps (two files, not the repo):**

| File | What it is |
| --- | --- |
| `dotone-trip-handoff.zip` | Small compose bundle. After unzip it is a folder of the same name (or the files below). |
| `dotone-trip-images.tar` | Pre-built Docker images. Not a zip. Do not put this inside the zip. |

**Inside the zip / folder:**

| Path | Role |
| --- | --- |
| `compose.yaml` | App + Postgres + migrate/seed |
| `compose.prod.yaml` | Prod overlay: Caddy on 80/443, Postgres not public |
| `deploy/Caddyfile` | TLS reverse proxy to the app |
| `.env.example` | Env template only — **create `.env` on the SERVER** |
| `scripts/generate-prod-secrets.mjs` | Generate pepper / PII / DB password on the SERVER |
| `docs/03-devops-deploy-from-tar.md` | Optional runbook (this path in full) |

**Inside the tar (after `docker load`):**

| Image | Role |
| --- | --- |
| `dotone-trip-app:latest` | Live site: Next.js UI + `/api` |
| `dotone-trip-migrate:latest` | Drizzle SQL + seed script. Tag as `dotone-trip-seed:latest` if Compose asks for it |

**Where they go on the SERVER:** upload **both** files to **`/tmp`** (`scp … root@VPS_IP:/tmp/`). Unzip the zip into **`/opt/dotone-trip`**. `docker load` the tar from `/tmp`, then **delete** the tar. Never leave `dotone-trip-images.tar` under `/opt/dotone-trip` (Compose would copy it as build context). Never put LOCAL `.env` in the zip.

CI / registry instead of a tar: skip `dotone-trip-images.tar`; pull and tag the same two images as `:latest`. You still need the zip contents on `/opt/dotone-trip`. Full SERVER steps: this section and `docs/03-devops-deploy-from-tar.md`.

| On SERVER | Not on SERVER |
| --- | --- |
| `dotone-trip-app` + `dotone-trip-migrate` images | `app/`, `components/`, `node_modules` |
| `compose.yaml`, `compose.prod.yaml` | `Dockerfile` (only if they **build** on the box) |
| `deploy/Caddyfile` | Playwright, `tests/` |
| `.env` (created on SERVER) | LOCAL `.env` |
| volume `dotone-trip-resumes-data` (career PDFs) | root-owned `./data/resumes` bind (causes careers **500**) |
| optional: `scripts/generate-prod-secrets.mjs`, `compose.edge.yaml`, `docs/03-*.md` | |

Schema SQL and `db-seed.mjs` live **inside** `dotone-trip-migrate` (baked at `docker compose --profile migrate build migrate`). A new `.sql` or seed edit on disk on the VPS is ignored. Full command path: **§P.5**.

### 1. LOCAL — pack the bundle (after §F images exist)

```powershell
$bundle = "$env:USERPROFILE\Desktop\dotone-trip-handoff"
New-Item -ItemType Directory -Force -Path "$bundle\deploy","$bundle\scripts" | Out-Null
Copy-Item compose.yaml, compose.prod.yaml, .env.example -Destination $bundle
Copy-Item deploy\Caddyfile -Destination "$bundle\deploy\"
Copy-Item scripts\generate-prod-secrets.mjs -Destination "$bundle\scripts\"
# optional
Copy-Item docs\03-devops-deploy-from-tar.md -Destination $bundle -ErrorAction SilentlyContinue
Compress-Archive -Path "$bundle\*" -DestinationPath "$env:USERPROFILE\Desktop\dotone-trip-handoff.zip" -Force
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest
```

Give DevOps: `dotone-trip-handoff.zip` + `dotone-trip-images.tar` (or a registry tag). Not the source tree. Not `.env`.

```powershell
scp "$env:USERPROFILE\Desktop\dotone-trip-handoff.zip" "$env:USERPROFILE\Desktop\dotone-trip-images.tar" root@VPS_IP:/tmp/
```

### 2. VPS — unpack, secrets, load, up

```bash
mkdir -p /opt/dotone-trip
apt-get install -y unzip   # skip if unzip exists
unzip -o /tmp/dotone-trip-handoff.zip -d /opt/dotone-trip
cp /opt/dotone-trip/.env.example /opt/dotone-trip/.env
cd /opt/dotone-trip
docker run --rm -v /opt/dotone-trip:/app -w /app node:22-bookworm-slim node scripts/generate-prod-secrets.mjs
```

Fill `.env` as in §J (`APP_ORIGIN`, `APP_HOST`, matching `POSTGRES_PASSWORD` / `DATABASE_URL`, new pepper + PII). Then:

```bash
docker load -i /tmp/dotone-trip-images.tar
docker tag dotone-trip-migrate:latest dotone-trip-seed:latest
rm -f /tmp/dotone-trip-images.tar /tmp/dotone-trip-handoff.zip
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

HTTPS + seed: §L then §M. Do not `up --build`. Do not leave the tar under `/opt/dotone-trip`.

If career PDF upload returns **500**, the upload dir is not writable by uid 1000. Use the §J `chown` + `--force-recreate app` block (do not `down -v`).

### 3. Later release — images only (compose/Caddy unchanged)

```powershell
# LOCAL — after §P.1 rebuild
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest
scp "$env:USERPROFILE\Desktop\dotone-trip-images.tar" root@VPS_IP:/tmp/
```

```bash
# VPS — no git
docker load -i /tmp/dotone-trip-images.tar
rm -f /tmp/dotone-trip-images.tar
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

UI-only: new `app` is enough; old migrate + `run migrate` is a no-op. Schema or seed-script change: **§P.5** (rebuild `migrate`, `docker save` that image, `run --rm --no-deps migrate` **before** rolling `app`; seed only if `db-seed.mjs` changed).

### 4. Compose or Caddyfile changed

```powershell
# LOCAL
scp compose.yaml root@VPS_IP:/opt/dotone-trip/compose.yaml
scp compose.prod.yaml root@VPS_IP:/opt/dotone-trip/compose.prod.yaml
scp deploy\Caddyfile root@VPS_IP:/opt/dotone-trip/deploy/Caddyfile
```

Then §Q.3 `up -d --no-build` (and `reload`/recreate `proxy` if Caddyfile changed).

### Avoid

- Cloning the whole repo “just in case” on a 1 GB disk if you already have images  
- Building on the VPS without the full tree (`Dockerfile` + source) — use images instead  
- Copying LOCAL `.env` into the zip
