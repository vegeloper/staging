# DevOps: deploy from delivered Docker tar

Developers (or CI) already built the images. You get a **small zip** plus a **image tar** (or registry tags). **Do not build on this server.** No git and no application source are required.

**SERVER** = Linux host with Docker Engine 24+ and Compose **v2.24+**. Compose is **not** inside the image tar — it comes from the zip (or a git checkout of those few files only).

### What you should have received

| File | What it is |
| --- | --- |
| `dotone-trip-handoff.zip` | Compose bundle (sometimes already unzipped as folder `dotone-trip-handoff`) |
| `dotone-trip-images.tar` | Pre-built images. Not a zip. Or instead: two registry tags from a build service |

**After you unzip the zip into `/opt/dotone-trip`:**

| Path | Role |
| --- | --- |
| `compose.yaml` | App + Postgres + migrate/seed |
| `compose.prod.yaml` | Prod overlay: Caddy on 80/443, Postgres not public |
| `deploy/Caddyfile` | TLS reverse proxy to the app |
| `.env.example` | Template — create `.env` **here on the SERVER** |
| `scripts/generate-prod-secrets.mjs` | Generate pepper / PII / DB password (no Node install needed if Docker can run this file) |

**After `docker load` of the tar (or pull + tag from a registry):**

| Image | Role |
| --- | --- |
| `dotone-trip-app:latest` | Live site: Next.js UI + `/api` |
| `dotone-trip-migrate:latest` | Drizzle migrations + seed script. Tag as `dotone-trip-seed:latest` if Compose asks for `seed` |

**Upload:** `scp` **both** files to **`/tmp`** on the SERVER (`root@HOST:/tmp/`). Unzip the zip → **`/opt/dotone-trip`**. Load the tar from `/tmp`, then **delete** it. Never leave `dotone-trip-images.tar` under `/opt/dotone-trip`. Never put a laptop `.env` in the zip.

---

## 0. Deliverable check

- `dotone-trip-handoff.zip` (or the compose files already in `/opt/dotone-trip`)  
- `dotone-trip-images.tar` (or registry pulls for `app` + `migrate`)  
- Hostname `HOST` DNS → this server, **80/443** open  
- Secrets: Dev may send `.env` **out of band** (not Git). If they did not, **generate them yourself** in §1b. Do not invent short passwords. Do not reuse another environment’s keys.

```bash
# SERVER
curl -fsSL https://get.docker.com | sh   # skip if Docker already installed
docker compose version
```

---

## 1. SERVER — repo + env

```bash
git clone --branch <BRANCH> --single-branch <REPO_URL> /opt/dotone-trip
# or unpack the compose bundle they gave you into /opt/dotone-trip
cd /opt/dotone-trip
cp .env.example .env
```

### 1b. Secrets — generate if Dev did not hand off `.env`

Do **not** wait for a filled `.env`. Do **not** copy another server’s `AUTH_PASSWORD_PEPPER` / `PII_ENCRYPTION_KEY` / `POSTGRES_PASSWORD`. Losing `PII_ENCRYPTION_KEY` after data exists makes national IDs unreadable.

**Preferred (SERVER, no Node install)** — same generator as `npm run ops:secrets`:

```bash
cd /opt/dotone-trip
docker run --rm -v /opt/dotone-trip:/app -w /app node:22-bookworm-slim node scripts/generate-prod-secrets.mjs
```

**If Node 22+ is on a laptop (LOCAL), not the server:**

```bash
# LOCAL, repo root (or a checkout that contains scripts/generate-prod-secrets.mjs)
npm run ops:secrets
```

Prints:

```
POSTGRES_PASSWORD=          # 64 hex chars — also paste into DATABASE_URL
AUTH_PASSWORD_PEPPER=       # 32-byte Base64 — password hashing; unique per env
PII_ENCRYPTION_KEY=         # 32-byte Base64 — national ID; unique per env; do not rotate blindly
SEED_ADMIN_PASSWORD=        # login for user admin — secret store only until step 5
SEED_OPERATOR_PASSWORD=     # login for user operator
```

Save the block in the company secret store. **Never commit it. Never paste it into chat/tickets.**

**No Docker / no Node** (SERVER or LOCAL) — equivalent CSPRNG:

```bash
# 32 bytes hex (Postgres password)
openssl rand -hex 32
# 32 bytes Base64 (pepper and PII key) — run twice
openssl rand -base64 32
# 12 bytes hex (seed passwords) — run twice
openssl rand -hex 12
```

Do not use `/dev/urandom` cut short, `date`, or a human-chosen string.

Then edit `/opt/dotone-trip/.env` on the **SERVER**:

```
POSTGRES_BIND_ADDRESS=127.0.0.1
APP_ORIGIN=https://HOST
APP_HOST=HOST
TRUST_PROXY=true
DATABASE_SSL=disable
POSTGRES_PASSWORD=<generated hex>
DATABASE_URL=postgresql://dotone_app:<SAME_HEX>@127.0.0.1:5432/dotone_trip
AUTH_PASSWORD_PEPPER=<generated base64>
PII_ENCRYPTION_KEY=<generated base64>
```

Leave `SEED_*` **out** of `.env` until step 5. Leave `RESUME_HOST_PATH` unset. `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` must match.

If Postgres **already has data** from a previous launch, do **not** generate a new `POSTGRES_PASSWORD` / pepper / PII key unless you are wiping that volume on purpose.

Change host later: edit `APP_ORIGIN` + `APP_HOST` only, then step 3 `up -d --no-build`. No new secrets. No seed.

---

## 2. SERVER — load images

Put the tar in **`/tmp`**, not `/opt/dotone-trip` (Compose build context would copy it).

```bash
docker load -i /tmp/dotone-trip-images.tar
docker image ls | grep dotone-trip
rm -f /tmp/dotone-trip-images.tar
```

Need names:

- `dotone-trip-app:latest`  
- `dotone-trip-migrate:latest`  

Seed uses image `dotone-trip-seed` if Compose builds it; if that tag is missing after load:

```bash
docker tag dotone-trip-migrate:latest dotone-trip-seed:latest
```

---

## 3. SERVER — first up (creates empty Postgres volume)

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Expect: `postgres` healthy, `resume-init` exit **0**, `migrate` exit **0**, `app` healthy, `proxy` started.

Career PDFs live in volume `dotone-trip-resumes-data`. `resume-init` chowns uid **1000** on every `up -d --no-build`. Leave `RESUME_HOST_PATH` unset. Copying an old `.env.example` with `RESUME_HOST_PATH=./data/resumes` makes that bind `root:root`; other forms work, careers **500**, logs `EACCES` on `/app/data/resumes`. Confirm:

```bash
docker compose -f compose.yaml -f compose.prod.yaml exec app sh -c "ls -ld /app/data/resumes; touch /app/data/resumes/.write-test && rm /app/data/resumes/.write-test"
```

Broken: `root root` + `Permission denied`. Fixed: `node node`. Re-run `up -d --no-build` **without** `--no-deps` so `resume-init` runs. Emergency if compose has no `resume-init`:

```bash
mkdir -p /opt/dotone-trip/data/resumes
chown -R 1000:1000 /opt/dotone-trip/data/resumes
chmod 775 /opt/dotone-trip/data/resumes
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build --force-recreate app
```

Do not `down -v`. Do not `:ro` on `/app/data/resumes`. Do not harden `resume-init` with `cap_drop` / `read_only`. Edge: add `-f compose.edge.yaml`; `app` still starts `resume-init`.

If migrate exits 1 but `docker compose ... logs migrate` already shows `[✓] migrations applied successfully!`, the job container is stale; schema is OK. Continue if `/api/ready` is green.

```bash
curl -fsS https://HOST/api/health
curl -fsS https://HOST/api/ready
```

---

## 4. Do not do these

```bash
docker compose --profile full up --build          # compiles on this host
docker compose --profile seed up seed             # stops Postgres / network conflict
docker compose down -v                           # deletes postgres_data
```

Jobs against a **running** stack:

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml --profile seed run --rm --no-deps seed
```

---

## 5. SERVER — seed once

Use the `SEED_*` values from **this environment’s** `ops:secrets` / openssl output (step 1b). Add them to `.env` for this command only:

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile seed run --rm --no-deps seed
```

Expect: `Seeded admin` / `Seeded operator`. **Delete `SEED_*` from `.env`.** Keep passwords in the secret store.

Re-seed only to rotate `admin`/`operator`. It overwrites those two hashes.

---

## 6. Live test

- `https://HOST/forms`  
- Submit contact  
- `https://HOST/admin/login` — `admin` + seed password  
- Cookie `trip_session`: HttpOnly **true**, Secure **true**, SameSite **Lax**

```bash
docker compose -f compose.yaml -f compose.prod.yaml logs -f app proxy postgres
```

---

## 7. Next image tar (same DB)

```bash
docker load -i /tmp/dotone-trip-images.tar
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

No seed. No `down -v`.

If you are using `compose.edge.yaml` (no Caddy) instead of the default setup, modify **both** commands like this:

```bash
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full up -d --no-build postgres migrate app
```

Key changes:
- Add `-f compose.edge.yaml` to **both** commands.
- In the `up` command, bring up **only** `postgres migrate app` (not the full stack).

If `POST /api/forms/careers` is **500** after a new tar (`EACCES` in `logs app`): §3 — `up -d --no-build` so `resume-init` runs; do not `--no-deps`; do not `down -v`.

---

## 8. No Caddy / Cloudflare / nginx

Caddy is the `proxy` service in `compose.prod.yaml`. Skip it if Cloudflare is **proxied** (orange) or the company already has nginx/F5.

`.env`: `APP_ORIGIN=https://HOST`, `TRUST_PROXY=true`. Always.

**Stop Caddy + bind app to loopback** — write `/opt/dotone-trip/compose.edge.yaml`:

```yaml
services:
  app:
    ports:
      - "127.0.0.1:3000:3000"
```

```bash
# SERVER
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full stop proxy
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full up -d --no-build postgres migrate app
```

**Cloudflare orange:** do not run Caddy Let’s Encrypt. SSL **Full (strict)** + origin cert on nginx, or **Full**. Avoid **Flexible**. Origin = `127.0.0.1:3000` behind nginx.

**nginx** (host): `proxy_pass http://127.0.0.1:3000;` plus `Host`, `X-Forwarded-Proto https`, `X-Forwarded-For`. See `docs/02-devops-build-and-deploy.md` §9 for the server block.

Later releases: same `-f compose.edge.yaml` on **both** migrate and `up` — see §7. Do not `down -v`. Do not publish `:3000` on `0.0.0.0`.
