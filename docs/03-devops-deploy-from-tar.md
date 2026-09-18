# DevOps: deploy from delivered Docker tar

Developers already built `dotone-trip-app:latest` and `dotone-trip-migrate:latest` and gave you a `.tar` (or you `docker load` from a registry export). **Do not build on this server.**

**SERVER** = Linux host with Docker Engine 24+ and Compose **v2.24+**. You still need the **git checkout** (or an equivalent copy) of `compose.yaml`, `compose.prod.yaml`, `deploy/Caddyfile`, `.env.example` — Compose is not inside the tar.

---

## 0. Deliverable check

- `dotone-trip-images.tar` (or two loads: `app` + `migrate`)  
- Compose files as above  
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
mkdir -p data/resumes
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

Leave `SEED_*` **out** of `.env` until step 5. `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` must match.

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

Expect: `postgres` healthy, `migrate` exit **0**, `app` healthy, `proxy` started.

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

Do not `down -v`. Do not publish `:3000` on `0.0.0.0`.
