# DevOps: build from source and deploy

**Where:** build machine = **LOCAL or CI (≥4 GB RAM)**. Runtime = **SERVER** (Linux + Docker Engine 24+ / Compose v2.24+).  
Do not `next build` on a 1 GB node.

Topology: one web container (UI + `/api`) + Postgres + one-shot migrate/seed + Caddy (`compose.prod.yaml`). Browsers talk only to `https://HOST`. Never split UI and API origins.

---

## 1. SERVER — Docker

```bash
curl -fsSL https://get.docker.com | sh
docker compose version
```

Do not `apt install docker.io`.

---

## 2. SERVER — code

```bash
git clone --branch <BRANCH> --single-branch <REPO_URL> /opt/dotone-trip
cd /opt/dotone-trip
mkdir -p data/resumes
cp .env.example .env
```

---

## 3. SERVER — secrets (once per environment)

```bash
docker run --rm -v /opt/dotone-trip:/app -w /app node:22-bookworm-slim node scripts/generate-prod-secrets.mjs
```

Store output in the company secret store. **Never commit `.env`.**

`nano /opt/dotone-trip/.env`:

```
POSTGRES_BIND_ADDRESS=127.0.0.1
APP_ORIGIN=https://HOST
APP_HOST=HOST
TRUST_PROXY=true
DATABASE_SSL=disable
POSTGRES_PASSWORD=<generated>
DATABASE_URL=postgresql://dotone_app:<SAME_PASSWORD>@127.0.0.1:5432/dotone_trip
AUTH_PASSWORD_PEPPER=<generated>
PII_ENCRYPTION_KEY=<generated>
```

`HOST` = hostname only (`trip.company.com`). `APP_ORIGIN` = `https://HOST` (no trailing slash).

Changing domain later = change **both** `APP_ORIGIN` and `APP_HOST`, then:

```bash
# SERVER
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

No migrate/seed for a hostname-only change. Wrong `APP_ORIGIN` → admin **403** / login cookie drop.

`TRUST_PROXY=true` only behind Caddy or a company LB that **overwrites** `X-Forwarded-For`.

---

## 4. Build images (LOCAL or CI — not a tiny SERVER)

```bash
# LOCAL or CI, repo root, after a dummy/local .env exists for compose interpolation
docker compose -f compose.yaml -f compose.prod.yaml --profile full build
```

Produces `dotone-trip-app:latest` (target `runner`) and `dotone-trip-migrate:latest` (target `migrator`). Seed uses the **same** migrator image.

### Ship A — registry

```bash
docker tag dotone-trip-app:latest <REGISTRY>/dotone-trip-app:<GIT_SHA>
docker tag dotone-trip-migrate:latest <REGISTRY>/dotone-trip-migrate:<GIT_SHA>
docker push <REGISTRY>/dotone-trip-app:<GIT_SHA>
docker push <REGISTRY>/dotone-trip-migrate:<GIT_SHA>
```

```bash
# SERVER
docker pull <REGISTRY>/dotone-trip-app:<GIT_SHA>
docker pull <REGISTRY>/dotone-trip-migrate:<GIT_SHA>
docker tag <REGISTRY>/dotone-trip-app:<GIT_SHA> dotone-trip-app:latest
docker tag <REGISTRY>/dotone-trip-migrate:<GIT_SHA> dotone-trip-migrate:latest
```

### Ship B — tar (no registry)

```powershell
# LOCAL
docker save -o dotone-trip-images.tar dotone-trip-app:latest dotone-trip-migrate:latest
scp dotone-trip-images.tar root@<SERVER_IP>:/tmp/
```

```bash
# SERVER
docker load -i /tmp/dotone-trip-images.tar
rm -f /tmp/dotone-trip-images.tar
# never leave the tar inside /opt/dotone-trip
```

### Ship C — build on SERVER only if RAM ≥4 GB

```bash
# SERVER
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full build
```

---

## 5. SERVER — first start (empty volume)

DNS `HOST` → this machine. Ports **80/443** open. Postgres must **not** be published (`compose.prod.yaml` uses `ports: !reset []`).

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Use `--build` only for Ship C. Expect: `postgres` healthy, `migrate` exit **0**, `app` healthy, `proxy` started.

```bash
curl -fsS https://HOST/api/health
curl -fsS https://HOST/api/ready
```

---

## 6. SERVER — seed **once**

Set `SEED_ADMIN_PASSWORD` and `SEED_OPERATOR_PASSWORD` in `.env` for this command only.

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile seed run --rm --no-deps seed
```

Expect: `Seeded admin` / `Seeded operator`. Then **remove `SEED_*` from `.env`**.

**Do not:**

```bash
docker compose --profile seed up seed
```

That uses only `compose.yaml`, **stops Postgres**, and can fight the live `app` network.

**Do not** put seed on a schedule. Re-running seed **resets** `admin`/`operator` password hashes.

Compose v5: `run` has no `--no-build`.

---

## 7. App release (schema + image) without wiping DB

Volume `dotone-trip-postgres-data` survives `compose stop` and `compose down` **unless** you pass `-v`. **Never `-v` on production.**

```bash
# SERVER — new images already loaded/tagged as :latest
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Order: **migrate first**, then roll `app`. Do not recreate Postgres. Do not seed unless rotating operator passwords.

Rollback web: retag previous app digest and `up -d --no-build`. Do not roll back a destructive SQL migration without a tested down-migration.

---

## 8. Live check

- `https://HOST/forms`  
- Submit contact  
- `https://HOST/admin/login` (`admin` + seed password from the secret store)  
- Cookie `trip_session`: HttpOnly, **Secure**, SameSite=Lax  

Logs:

```bash
docker compose -f compose.yaml -f compose.prod.yaml logs -f app proxy postgres
```

Stop without deleting data:

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full stop
```
