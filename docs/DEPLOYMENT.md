# Production deployment

**Audience:** DevOps, backend, and frontend engineers shipping DotOne Trip.  
**Goal:** run the live domain with independently managed services, shared secrets, and a security baseline that does not depend on “we will harden it later.”

This guide is the source of truth. If a shortcut is not written here, it is not a supported production path.

Command runbooks from the local→staging dry run:

- [01 — local + staging walkthrough](01-local-and-staging-walkthrough.md)
- [02 — DevOps: build from source](02-devops-build-and-deploy.md)
- [03 — DevOps: deploy from image tar](03-devops-deploy-from-tar.md)

---

## 1. Read this first

DotOne Trip is a **Next.js App Router modular monolith**. The public site, the `/forms` intake UI, `/admin`, and `/api/*` all run in **one Node process**. PostgreSQL is a **separate** service. That split is intentional and is the FAANG-shaped topology for this stack.

| Service | Image / process | What it owns | Independent? |
| --- | --- | --- | --- |
| **Edge / TLS** | Caddy (or the company load balancer) | Certificates, HTTP→HTTPS, `X-Forwarded-*` | Yes |
| **Web** | `Dockerfile` target `runner` | UI + Route Handlers + session cookies | Yes, as long as it can reach Postgres and resume storage |
| **Migrate / seed** | `Dockerfile` target `migrator` | Schema and operator accounts | Yes — one-shot jobs |
| **Database** | `postgres:17.11-bookworm` | Submissions, sessions, encrypted national IDs | Yes |

```mermaid
flowchart LR
  Browser["Browser on the live domain"]
  Edge["TLS edge<br/>Caddy / company LB"]
  Web["Web container<br/>Next.js UI + /api"]
  DB["Postgres 17<br/>private network only"]
  Files["Resume volume<br/>not public/"]

  Browser -->|HTTPS 443| Edge
  Edge -->|HTTP app:3000<br/>X-Forwarded-Proto https| Web
  Web -->|DATABASE_URL| DB
  Web -->|UPLOAD_ROOT| Files
```

### Why the React UI is not a second origin

Do **not** host a static export (or a second Next.js app) on `www.company.com` and point `fetch("https://api.company.com")` at this backend. That split would require CORS, cookie `Domain` gymnastics, CSRF tokens, and a broken admin session. The forms already POST to same-origin `/api/forms/*`.

The supported “frontend hosted somewhere else” setups are:

1. **Web container on host A, Postgres on host B** (recommended).
2. **Company nginx/F5/Cloudflare in front**, this web container behind it, Postgres on a private subnet.
3. **Marketing WordPress / another site on a different hostname**, and this app on e.g. `trip.company.com` (complete origin, UI+API together).

Same Docker image. Same `APP_ORIGIN`. Different machines if you want them.

### Cold start vs “less than a second”

| Step | What to expect |
| --- | --- |
| First `docker compose build` | Minutes (Node 22 image + `next build`) |
| `docker compose up` with images already on the node | Postgres ready in a few seconds; web health in ~5–20s |
| Restart a **warm** `app` container | Typically 1–3 seconds to listen on `:3000` |
| Horizontal replica of a **cached** image | Near-instant create; still wait for `/api/ready` |

DevOps should bake the image in CI and ship the digest. Do not build on the production node during an incident.

---

## 2. Security baseline (non-negotiable)

Treat every item as a ship blocker, not a backlog ticket.

| Control | How this repo enforces it |
| --- | --- |
| TLS on the live hostname | `APP_ORIGIN=https://…`; Caddy (or company edge) terminates TLS; HSTS is set |
| Postgres not on the public internet | Compose production overlay **un-publishes** `:5432`. Dev binds `127.0.0.1` only |
| Secrets never in Git | `.env` is gitignored. Generate with `npm run ops:secrets` |
| CSRF / origin | Browser `Origin` must match `APP_ORIGIN`, **not** the container URL `http://app:3000` |
| Session cookie | `HttpOnly`, `Path=/`, `SameSite=Lax`, `Secure` when `APP_ORIGIN` is https |
| Passwords | Argon2id + `AUTH_PASSWORD_PEPPER`. Lockout after 5 failures |
| National ID | AES-256-GCM + blind index; **losing `PII_ENCRYPTION_KEY` loses readability** |
| Uploads | Magic-byte allowlist (PDF/DOC/DOCX), size cap, stored **outside** `public/` |
| Rate limit IP | `TRUST_PROXY=true` **only** behind a proxy that overwrites `X-Forwarded-For` |
| Container | Production overlay: `cap_drop: ALL`, `no-new-privileges`, read-only root FS |
| Headers | `nosniff`, `DENY` framing, CSP, `COOP`/`CORP` |
| Admin | Opaque `trip_session` cookie; middleware gate; same-origin PATCH |

**Never:**

- Publish Postgres on `0.0.0.0:5432`.
- Set `TRUST_PROXY=true` when the app is reachable directly from the internet.
- Reuse `PII_ENCRYPTION_KEY` or `AUTH_PASSWORD_PEPPER` across staging and production.
- Commit `SEED_*` passwords.
- Put resumes under `public/` or a CDN.
- Disable TLS “just for the first launch.”
- Run `db:seed` against production on a schedule (it resets admin/operator password hashes).

---

## 3. Prerequisites

- Docker Engine 24+ and **Compose v2.24+** (the production overlay uses `!reset`)
- Node 22.13+ only on laptops; production runs the image
- DNS A/AAAA record for the live hostname pointing at the edge
- Inbound **80/443** on the edge. No inbound 5432. No inbound 3000 from the internet
- Disk for `postgres_data` and the resume volume
- Outbound 80/443 from the edge if Caddy is obtaining Let’s Encrypt certificates

Windows laptops: use Docker Desktop, run Compose from the repo root in PowerShell. Production servers should be Linux.

---

## 4. Repository files you will use

| Path | Role |
| --- | --- |
| `Dockerfile` | `migrator` (jobs) and `runner` (web) |
| `compose.yaml` | Local / baseline services |
| `compose.prod.yaml` | Hardened overlay + Caddy |
| `deploy/Caddyfile` | TLS reverse proxy |
| `.env.example` | Template — copy, never commit the copy |
| `scripts/generate-prod-secrets.mjs` | `npm run ops:secrets` |
| `scripts/db-migrate.mjs` / `scripts/db-seed.mjs` | Schema and operator users |

---

## 5. Step-by-step: first production launch

### Step 1 — Copy env and generate secrets

On the production host, from the repo root:

```bash
cp .env.example .env
npm run ops:secrets
```

Paste the printed values into `.env`. Then set the public origin:

```bash
APP_ORIGIN=https://trip.example.com
APP_HOST=trip.example.com
POSTGRES_BIND_ADDRESS=127.0.0.1
TRUST_PROXY=true
DATABASE_SSL=disable
```

Use your real hostname. `APP_ORIGIN` is a full URL (scheme + host, no trailing path). `APP_HOST` is hostname only for Caddy.

If the company load balancer already terminates TLS and forwards to this host, skip the Caddy service (Step 5b) and still set `APP_ORIGIN` to the **https** URL browsers use.

**PowerShell** (same commands work in modern PowerShell). If `cp` is missing: `Copy-Item .env.example .env`.

### Step 2 — Confirm Postgres is not public

`.env` must keep:

```bash
POSTGRES_BIND_ADDRESS=127.0.0.1
```

The production overlay removes host ports for Postgres entirely. Do not add `ports: ["5432:5432"]` back.

### Step 3 — Build images in CI or on a bastion

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full build
```

Tag and push to the company registry if you have one. Promote **digests**, not `:latest`, when you can.

### Step 4 — Start Postgres independently (optional smoke)

You can bring the database up with nothing else:

```bash
docker compose up -d postgres
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Leave it running. Web and jobs attach later on the `backend` network.

### Step 5 — Apply schema (required before web)

```bash
docker compose --profile migrate up migrate
```

This container exits `0` when migrations have been applied. Re-running is safe (Drizzle keeps a journal).

### Step 5b — TLS edge + web together (default production)

DNS must already point at this machine.

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d
```

What this starts:

- `postgres` — private network only
- `migrate` — runs once, then exits
- `app` — Next.js UI + API (no public `:3000`)
- `proxy` — Caddy on **80/443**, automatic HTTPS

### Step 6 — Seed operator accounts (once)

Seeding **upserts** `admin` and `operator` and sets their password hashes. Add `SEED_CREATOR_PASSWORD` in the same command when this environment needs the content-creator login (`creator`). Do this once per environment, or when a human asks to rotate those passwords.

```bash
# in .env, for this one command only
SEED_ADMIN_PASSWORD='…strong unique…'
SEED_OPERATOR_PASSWORD='…strong unique…'
SEED_CREATOR_PASSWORD='…strong unique…'

docker compose --profile seed up seed
```

If you already launched `--profile full`, Postgres is up; seed only needs the database. Then **remove the seed passwords from `.env`**.

Default usernames are `admin`, `operator`, and, when the creator password is set, `creator`. There is no public registration. `creator` can draft news and articles. `admin` approves or rejects them. `operator` stays on the submission inbox.

### Step 7 — Prove the live domain

```bash
curl -fsS https://trip.example.com/api/health
curl -fsS https://trip.example.com/api/ready
```

Browser checks:

1. `https://trip.example.com/forms` — all four forms render, header and footer present.
2. Submit the contact form with a real mailbox on a trusted provider.
3. `https://trip.example.com/admin/login` — sign in, find that row, open the detail page.
4. Confirm the session cookie is `Secure` and `HttpOnly`.

### Step 8 — Lock the host

- Firewall: allow 80/443 (and 22 from the bastion). Deny 3000 and 5432 from WAN.
- Disk: monitor the resume bind mount and `postgres_data`.
- Backups: see [§8](#8-backups-and-restore).

---

## 6. Running each layer independently

### Web on a different host than Postgres

This is the supported “backend somewhere else” topology.

1. Run Postgres (Compose or managed, e.g. company HA Postgres) on the data network.
2. Create the app role with a unique password. Do **not** use a superuser in `DATABASE_URL`.
3. Require TLS to Postgres when it crosses a host boundary:

   ```bash
   DATABASE_URL=postgresql://dotone_app:SECRET@db.internal:5432/dotone_trip
   DATABASE_SSL=require
   ```

4. On the web host, run **only** the runner image:

   ```bash
   docker run --rm -d --name trip-web \
     --read-only --tmpfs /tmp --tmpfs /app/.next/cache \
     -e NODE_ENV=production \
     -e HOSTNAME=0.0.0.0 \
     -e PORT=3000 \
     -e DATABASE_URL \
     -e DATABASE_SSL=require \
     -e APP_ORIGIN=https://trip.example.com \
     -e UPLOAD_ROOT=/app/data/resumes \
     -e AUTH_PASSWORD_PEPPER \
     -e PII_ENCRYPTION_KEY \
     -e TRUST_PROXY=true \
     -v /var/trip/resumes:/app/data/resumes \
     -p 127.0.0.1:3000:3000 \
     registry.internal/dotone-trip-web@sha256:…
   ```

5. Point the company load balancer at `127.0.0.1:3000` (or the overlay network). Set `X-Forwarded-Proto: https` and `X-Forwarded-For` from the **client**, overwriting any inbound spoofed value.

The UI “hosted somewhere else” is this web container (or several replicas of it). Browsers never talk to Postgres.

### Company edge instead of Caddy

Skip the `proxy` service. Keep app on **127.0.0.1:3000** (see `docs/02-devops-build-and-deploy.md` §9: `compose.edge.yaml`). Terminate TLS on F5 / nginx / Cloudflare.

Required forwarded headers:

- `Host: trip.example.com`
- `X-Forwarded-Proto: https`
- `X-Forwarded-For: <client ip>` (set by the edge, not trusted from the client)

Set `TRUST_PROXY=true` and `APP_ORIGIN=https://trip.example.com`.

**Cloudflare:** grey cloud = Caddy Let’s Encrypt. Orange cloud = **stop Caddy**; CF SSL **Full (strict)** (or Full); origin nginx → `127.0.0.1:3000`. Do not run Caddy ACME and orange cloud together.

### Local laptop (not production)

```bash
docker compose up -d postgres
# wait until healthy
npx next dev --port 3000
```

Use `.env` with `APP_ORIGIN=http://localhost:3000` and `TRUST_PROXY=false`.

Full local stack including the production image:

```bash
docker compose --profile full up --build
```

---

## 7. Database jobs: migrate, seed, new data

| Job | Command | When |
| --- | --- | --- |
| Migrate | `docker compose --profile migrate up migrate` | Every release that includes `drizzle/*.sql` |
| Seed operators | `docker compose --profile seed up seed` | New environment, or password reset of `admin`/`operator` |
| App-generated data | Public forms and `/admin` | Continuous — this is not a seed |

**Schema change workflow**

1. Edit `db/schema.ts` on a branch.
2. `npm run db:generate` (creates SQL under `drizzle/`).
3. Review the SQL. Never hand-edit applied files.
4. Merge. Production: **migrate job first**, then roll the web image.
5. Keep an old web replica only if the migration is backward-compatible.

**Seed behaviour** (`scripts/db-seed.mjs`)

- Upserts usernames `admin` and `operator`.
- Upserts `creator` only when `SEED_CREATOR_PASSWORD` is set. A non-interactive run without that variable skips the content creator.
- Re-hashes passwords with the current `AUTH_PASSWORD_PEPPER`.
- If `SEED_ADMIN_PASSWORD` or `SEED_OPERATOR_PASSWORD` is omitted, it prompts (TTY only). Compose must pass env vars.

The news and article catalog is not part of `db:seed`. The first request to `/blog` or `/admin/content` after migration copies the current static feed into `content_posts` once. Later edits stay in the CMS, including deletions. A creator can add a post before that copy; the original feed is still inserted for any slug that is still free.

---

## 8. Backups and restore

Postgres volume name: `dotone-trip-postgres-data`.

**Logical backup (preferred)**

```bash
docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  > "trip-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Copy resume files at the same time (`RESUME_HOST_PATH`). National IDs are ciphertext; the dump is useless without `PII_ENCRYPTION_KEY`.

**Restore**

```bash
docker compose exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  < trip-YYYYMMDD.dump
```

Practice restore on staging every quarter. A backup that was never restored is not a backup.

Encrypt dumps at rest (company KMS / age / GPG). Do not email dump files.

---

## 9. Health, logs, and scaling

| Probe | URL | Meaning |
| --- | --- | --- |
| Liveness | `GET /api/health` | Process is up (no DB) |
| Readiness | `GET /api/ready` | Can `SELECT 1` on Postgres |

The edge should **not** require `/api/ready` for every HTML request. Use it on the load-balancer backend pool.

Logs (production overlay): JSON files, 10 MB × 5.

```bash
docker compose -f compose.yaml -f compose.prod.yaml logs -f app proxy postgres
```

**Multiple web replicas**

- Sessions live in Postgres — no sticky sessions for login.
- Resume files are **local disk**. Two web replicas need a **shared volume** (NFS, or a later object store). Until that exists, run **one** web replica, or pin uploads to a dedicated instance.
- In-memory rate limits are per process. Replicas do not share buckets (fail-open for traffic, not a data-loss bug). Put a WAF / edge rate limit in front for production abuse.

---

## 10. Release checklist

Copy this into the change ticket.

- [ ] Image built in CI, scanned, tagged with git SHA
- [ ] `drizzle/` SQL reviewed; migrate job succeeded on staging
- [ ] Staging `APP_ORIGIN` is the staging https hostname
- [ ] `ops:secrets` values are in the production secret store, not chat
- [ ] `TRUST_PROXY` matches the real edge
- [ ] Postgres not reachable from WAN (`nmap` / security group)
- [ ] `/api/health` and `/api/ready` green on the live hostname
- [ ] Contact form → admin inbox on production (one test row, then close it)
- [ ] Resume download (if a career test file was used) is `Content-Disposition: attachment`
- [ ] Backup ran after first production seed
- [ ] Seed passwords removed from the server env

Rollback: keep the previous web image digest. `docker compose ... up -d` the old digest. **Do not** roll back a destructive SQL migration unless you have a tested down-migration.

---

## 11. Environment reference

| Variable | Production |
| --- | --- |
| `APP_ORIGIN` | `https://trip.example.com` — must match the browser origin |
| `APP_HOST` | `trip.example.com` — Caddy site name |
| `DATABASE_URL` | App and jobs only; never the browser |
| `DATABASE_SSL` | `require` if Postgres is not on the same Docker network |
| `AUTH_PASSWORD_PEPPER` | 32-byte Base64, unique per environment |
| `PII_ENCRYPTION_KEY` | 32-byte Base64; **rotation without re-encrypting rows bricks national IDs** |
| `UPLOAD_ROOT` | `/app/data/resumes` in the container |
| `MAX_RESUME_BYTES` | Default `5242880` |
| `TRUST_PROXY` | `true` behind Caddy / company LB |
| `SEED_ADMIN_PASSWORD` | Set only while running the seed job |
| `SEED_OPERATOR_PASSWORD` | Set only while running the seed job |
| `SEED_CREATOR_PASSWORD` | Set only while seeding the `creator` account |

---

## 12. Incident notes

| Symptom | Likely cause |
| --- | --- |
| Admin PATCH `403` on the live domain | `APP_ORIGIN` is still `http://localhost:3000` or missing https |
| Login succeeds then immediately logs out | Cookie `Secure` with an http origin, or `APP_ORIGIN` host mismatch |
| All clients share one rate-limit bucket | `TRUST_PROXY=false` behind a proxy, or proxy not setting `X-Forwarded-For` |
| Rate limit easy to bypass | `TRUST_PROXY=true` without a trusted edge (clients spoof `X-Forwarded-For`) |
| `/api/ready` 503 | Postgres down, wrong `DATABASE_URL`, or `DATABASE_SSL` mismatch |
| National IDs garbage in admin | Wrong `PII_ENCRYPTION_KEY` |
| Forms work, admin empty | Looking at a different database than the web container |

---

## 13. Command cheat sheet

```bash
# Secrets
npm run ops:secrets

# Database only
docker compose up -d postgres

# Schema
docker compose --profile migrate up migrate

# Operator users (once)
docker compose --profile seed up seed

# Full production (TLS + web + db)
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --build

# Follow web logs
docker compose -f compose.yaml -f compose.prod.yaml logs -f app

# Stop without deleting data
docker compose -f compose.yaml -f compose.prod.yaml --profile full stop
```

Postgres data survives `stop` and `down` unless you pass `-v`. **Never** `-v` on production.

---

Questions about placing a form on a marketing page are unrelated to this runbook: import the existing component from `components/forms/` into that Next.js page. The API origin stays this app.
