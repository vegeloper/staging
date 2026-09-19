# DevOps: build from source and deploy

**Where:** build machine = **LOCAL or CI (≥4 GB RAM)**. Runtime = **SERVER** (Linux + Docker Engine 24+ / Compose v2.24+).  
Do not `next build` on a 1 GB node.

Topology: one web container (UI + `/api`) + Postgres + one-shot migrate/seed + Caddy (`compose.prod.yaml`). Browsers talk only to `https://HOST`. Never split UI and API origins.

**No git / no source / images from CI?** You do not need this repo on the SERVER. Ask for two files and follow `docs/03-devops-deploy-from-tar.md`:

| File | Put on SERVER | Contains |
| --- | --- | --- |
| `dotone-trip-handoff.zip` | `/tmp` → unzip to **`/opt/dotone-trip`** | `compose.yaml`, `compose.prod.yaml`, `deploy/Caddyfile`, `.env.example`, `scripts/generate-prod-secrets.mjs` (optional: this runbook / `docs/03-*.md`) |
| `dotone-trip-images.tar` | `/tmp` → `docker load` → **delete** | `dotone-trip-app:latest` (UI + `/api`) and `dotone-trip-migrate:latest` (SQL + seed). Tag migrate as `dotone-trip-seed:latest` if needed |

Create `.env` **on the SERVER** from `.env.example`. Do not ship LOCAL `.env`. Do not leave the tar under `/opt/dotone-trip`. Registry instead of a tar: pull those two image names and tag `:latest`; you still need the zip on `/opt/dotone-trip`.

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

`HOST` = hostname only (`trip.company.com`). `APP_ORIGIN` = `https://HOST` (no trailing slash). Leave `RESUME_HOST_PATH` unset so Compose uses named volume `dotone-trip-resumes-data`.

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

If `RUN npm ci` fails with `npm error code ECONNRESET` / `network aborted` (and leftover `ENOTEMPTY` cleanup warnings): the npm registry connection dropped mid-install. This is **not** a bad `package-lock.json` or a broken Dockerfile. The failed layer is **not** cached as success. Retry the **same** `docker compose … build`. It often works on the second run. Do **not** change the lockfile. `--no-cache` only after two or three identical network failures. If the log later shows `npm run build` / `exporting to image`, the install already succeeded.

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

Same `ECONNRESET` / `npm ci` retry rule as above.

---

## 5. SERVER — first start (empty volume)

DNS `HOST` → this machine. Ports **80/443** open. Postgres must **not** be published (`compose.prod.yaml` uses `ports: !reset []`).

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Use `--build` only for Ship C. Expect: `postgres` healthy, `resume-init` exit **0**, `migrate` exit **0**, `app` healthy, `proxy` started.

Career PDFs write to volume `dotone-trip-resumes-data`. `resume-init` chowns the mount to uid **1000** on `up` — no manual `chown`. Leave `RESUME_HOST_PATH` unset. If an old `.env` still has `RESUME_HOST_PATH=./data/resumes`, contact/admin can work while `POST /api/forms/careers` returns **500**. Logs: `Cannot write resume to /app/data/resumes (EACCES)`. Confirm:

```bash
docker compose -f compose.yaml -f compose.prod.yaml exec app sh -c "ls -ld /app/data/resumes; touch /app/data/resumes/.write-test && rm /app/data/resumes/.write-test"
```

Broken: `root root` + `Permission denied`. Fixed: `node node`. Then (do **not** `--no-deps` — that skips `resume-init`):

```bash
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

Emergency if this `compose.yaml` has no `resume-init`:

```bash
mkdir -p /opt/dotone-trip/data/resumes
chown -R 1000:1000 /opt/dotone-trip/data/resumes
chmod 775 /opt/dotone-trip/data/resumes
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build --force-recreate app
```

Do not `down -v`. Do not `:ro` on `/app/data/resumes`. Do not `cap_drop` / `read_only` on `resume-init`. Edge: add `-f compose.edge.yaml`; list `postgres migrate app` — Compose still starts `resume-init` because `app` depends on it.

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

If you are using `compose.edge.yaml` (no Caddy) instead of the default setup, modify **both** commands like this:

```bash
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full run --rm --no-deps migrate
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full up -d --no-build postgres migrate app
```

Key changes:
- Add `-f compose.edge.yaml` to **both** commands.
- In the `up` command, bring up **only** `postgres migrate app` (not the full stack).

If `POST /api/forms/careers` is **500** after a roll (`EACCES` in `logs app`): §5 — `up -d --no-build` so `resume-init` runs; do not `--no-deps`; do not `down -v`.

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

---

## 9. Edge: Caddy vs Cloudflare vs nginx

Default in `compose.prod.yaml` is **Caddy** on host **80/443** (Let’s Encrypt). `APP_ORIGIN` is always the **browser** URL (`https://HOST`). `TRUST_PROXY=true` only behind an edge that **overwrites** `X-Forwarded-For`.

Required upstream headers (any proxy):

```
Host: HOST
X-Forwarded-Proto: https
X-Forwarded-For: <client ip>
```

Never publish Postgres. Never publish `app:3000` on `0.0.0.0`.

### Caddy + DNS-only (grey cloud) — what staging used

Cloudflare / DNS manager: **proxy OFF**. Caddy owns TLS.

```bash
# SERVER
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

### Stop Caddy (keep hardened app/postgres)

`compose.prod.yaml` **un-publishes** app ports. Host nginx/Cloudflare origin needs `127.0.0.1:3000` again. Create `/opt/dotone-trip/compose.edge.yaml` (do not commit secrets):

```yaml
services:
  app:
    ports:
      - "127.0.0.1:3000:3000"
```

```bash
# SERVER — stop Caddy; do not start proxy
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full stop proxy
docker compose -f compose.yaml -f compose.prod.yaml -f compose.edge.yaml --profile full up -d --no-build postgres migrate app
```

Port 80/443 on the host must be **free** for nginx/Cloudflare origin (or CF only talks to 443 on nginx). Later releases: same `-f compose.edge.yaml` on **both** migrate and `up` — see §7.

### Cloudflare orange cloud (proxied)

Do **not** run Caddy ACME. Orange cloud + Caddy on 80/443 = failed certificates / double proxy.

| Cloudflare SSL/TLS | Origin |
| --- | --- |
| **Full (strict)** | nginx (or other) HTTPS with a valid cert (origin CA or public) |
| **Full** | HTTPS on origin, cert can be self-signed |
| **Flexible** | origin HTTP only — avoid if you can |

DNS: orange cloud ON. `.env` still `APP_ORIGIN=https://HOST`, `TRUST_PROXY=true`. Cookie `Secure` follows `APP_ORIGIN`, not CF mode.

Then use “Stop Caddy” + nginx (below). Origin port in CF: 80 (Flexible) or 443 (Full / Full strict).

### Host nginx (already on the machine)

Point at loopback only:

```nginx
# /etc/nginx/sites-available/dotone-trip
server {
    listen 80;
    listen 443 ssl http2;          # omit listen 443 if CF Flexible
    server_name HOST;
    # ssl_certificate     /path/to/fullchain.pem;
    # ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

If Cloudflare terminates TLS and origin is HTTP, force proto (do not send `http` to the app for URL/CSRF):

```nginx
proxy_set_header X-Forwarded-Proto https;
```

```bash
# SERVER
sudo ln -s /etc/nginx/sites-available/dotone-trip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Same pattern for Caddy-as-company-unit, Traefik, F5: `proxy_pass` / pool = `127.0.0.1:3000`, those three headers, `TRUST_PROXY=true`.

### Avoid

- Grey-cloud Caddy **and** orange cloud at once  
- `TRUST_PROXY=true` with app reachable on the public internet  
- `compose.yaml --profile full` in production without locking `POSTGRES_BIND_ADDRESS=127.0.0.1` (Postgres would still be published on loopback — never `0.0.0.0`)  
- `down -v` when swapping the edge  
- Changing only nginx `server_name` and not `APP_ORIGIN` / `APP_HOST`  
