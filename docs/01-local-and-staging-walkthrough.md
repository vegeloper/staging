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
cd /opt/dotone-trip && mkdir -p data/resumes
```

---

## K. Build: pick one path

### K1 — VPS has **≥4 GB RAM** (build on server)

```bash
# VPS
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --build
```

First `next build` takes minutes. Do not Ctrl+C unless stuck 15+ minutes with no new lines.

### K2 — VPS is **1 GB / 1 CPU** (do **not** build there)

`next build` dies: `JavaScript heap out of memory` during TypeScript. Swap does **not** fix the Node heap cap.

```powershell
# LOCAL — after section F succeeded
docker save -o "$env:USERPROFILE\Desktop\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest
scp "$env:USERPROFILE\Desktop\dotone-trip-images.tar" root@VPS_IP:/opt/dotone-trip/
```

```bash
# VPS
docker load -i /opt/dotone-trip/dotone-trip-images.tar
cd /opt/dotone-trip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
rm -f /opt/dotone-trip/dotone-trip-images.tar
```

Leave the `.tar` in `/opt/dotone-trip` only until `docker load` finishes. A leftover tar is copied into image builds (~1 GB context).

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

1. DNS `NEW_HOST` → production (or staging) IP; 80/443 open; DNS-only if using Caddy  
2. **VPS** `.env`: `APP_ORIGIN=https://NEW_HOST`, `APP_HOST=NEW_HOST`, `TRUST_PROXY=true`  
3. Images: K1, K2, or K3  
4. `compose.yaml` + `compose.prod.yaml` `--profile full` `up -d` (`--build` only on a strong box)  
5. Seed once with section M  
6. `curl.exe` `/api/health` and `/api/ready` on `https://NEW_HOST`  
7. Forms + admin + Secure cookie  

Handoff files: `Dockerfile`, `compose.yaml`, `compose.prod.yaml`, `deploy/Caddyfile`, `.env.example`, `docs/DEPLOYMENT.md`, plus `docs/02-devops-build-and-deploy.md` or `docs/03-devops-deploy-from-tar.md`.
