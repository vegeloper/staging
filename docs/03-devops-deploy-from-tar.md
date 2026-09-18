# DevOps: deploy from delivered Docker tar

Developers already built `dotone-trip-app:latest` and `dotone-trip-migrate:latest` and gave you a `.tar` (or you `docker load` from a registry export). **Do not build on this server.**

**SERVER** = Linux host with Docker Engine 24+ and Compose **v2.24+**. You still need the **git checkout** (or an equivalent copy) of `compose.yaml`, `compose.prod.yaml`, `deploy/Caddyfile`, `.env.example` — Compose is not inside the tar.

---

## 0. Deliverable check

- `dotone-trip-images.tar` (or two loads: `app` + `migrate`)  
- Compose files as above  
- Hostname `HOST` DNS → this server, **80/443** open  
- Secrets from `ops:secrets` (or the env file Dev handed you **out of band** — not Git)

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

If you do not have Node:

```bash
docker run --rm -v /opt/dotone-trip:/app -w /app node:22-bookworm-slim node scripts/generate-prod-secrets.mjs
```

Edit `.env`:

```
POSTGRES_BIND_ADDRESS=127.0.0.1
APP_ORIGIN=https://HOST
APP_HOST=HOST
TRUST_PROXY=true
DATABASE_SSL=disable
POSTGRES_PASSWORD=<secret>
DATABASE_URL=postgresql://dotone_app:<SAME>@127.0.0.1:5432/dotone_trip
AUTH_PASSWORD_PEPPER=<secret>
PII_ENCRYPTION_KEY=<secret>
```

Leave `SEED_*` unset until step 5.

Change host later: edit `APP_ORIGIN` + `APP_HOST` only, then step 4 `up -d --no-build`. No seed.

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

Add to `.env`: `SEED_ADMIN_PASSWORD`, `SEED_OPERATOR_PASSWORD`.

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
