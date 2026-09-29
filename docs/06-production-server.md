# Production server

This is the server whose DNS name is the public company subdomain. Browsers use `https://HOST`. Staging is a different machine and a different hostname. Do the staging checks in [05-staging-environment.md](05-staging-environment.md) before the first production install of a release. Backup steps are in [07-backup-and-restore.md](07-backup-and-restore.md).

## Contents

1. [Command sheet](#command-sheet)
2. [What production is](#what-production-is)
3. [Prerequisites](#prerequisites)
4. [Before install](#before-install)
5. [Install](#install)
6. [Verification](#verification)
7. [A later release](#a-later-release)
8. [Commands that must not run here](#commands-that-must-not-run-here)

## Command sheet

`HOST` is the public hostname only, such as `trip.example.com`. The directory is the one that contains `compose.yaml`.

```bash
dig +short HOST
docker compose version
npm run docker:load
npm run setup:prod:dockerImage
npm run setup:prod
npm run setup:prod:update
curl -fsS https://HOST/api/health
curl -fsS https://HOST/api/ready
npm run ops:backup
npm run docker:down:keep
```

Do not run `clean:slate`, `clean:local`, or `docker:down:remove` on this server.

## What production is

Caddy on this host obtains a certificate for `HOST` and proxies to the app. `APP_ORIGIN` is `https://HOST`. `TRUST_PROXY` is `true`. `APP_HOST` is `HOST` with no scheme.

Postgres and ClamAV have no host ports in `compose.prod.yaml`. The app has no public port 3000. SSH and the Docker socket are the admin path.

The database password, `AUTH_PASSWORD_PEPPER`, and `PII_ENCRYPTION_KEY` are created on this server and stay with this server's volumes. Copying staging's `.env` onto production makes production depend on staging secrets. Generate a new `.env` here.

## Prerequisites

| Check | Required |
| --- | --- |
| DNS A and, if you use IPv6, AAAA | `HOST` points at this server before the certificate request |
| Ports | 80 and 443 open to the internet. 5432 and 3000 are not open |
| Docker Engine | 24 or newer |
| Docker Compose | v2.24 or newer |
| Node.js | 22.13 or newer for the `npm run setup:*` scripts |
| Disk | Database, media, resumes, ClamAV signatures, and Caddy data |
| Time | The clock is correct. A wrong clock breaks TLS |

```bash
dig +short HOST
timedatectl
docker --version
docker compose version
node -v
ss -ltnp | grep -E ':80|:443' || true
```

`dig` must return this server. Ports 80 and 443 must be free. If a previous web server owns them, stop it before `setup:prod`.

## Before install

1. Confirm the release commit passed the staging checks, including a backup restore drill.
2. Put the git checkout or the image tar on this server. Do not leave the tar inside the repository directory.
3. There is no `.env` yet on a first install. If `.env` exists from a previous attempt, do not delete it until you know the volumes are empty. A second `setup:prod` is refused when `.env` is already complete. Use `setup:prod:update`.
4. Take a backup with `npm run ops:backup` if any volume already has data. Copy `env.copy` to the password store and delete it from the server disk after that copy succeeds.
5. Agree a maintenance window for a replacement. `setup:prod:update` recreates containers. It does not delete volumes.

## Install

### First install, build on this server

DNS already points here.

```bash
cd /opt/staging
npm run setup:prod
```

Enter `HOST`, then accept `https://HOST`. Wait until the command prints the site URL and the three passwords. Store the passwords. The first ClamAV download can take several minutes.

### First install from a tar built elsewhere

```bash
npm run docker:load
npm run setup:prod:dockerImage
```

`docker:load` asks for the tar path and does not start the site. `setup:prod:dockerImage` writes `.env`, starts Caddy, and does not build.

### The site is already installed

```bash
git pull
npm run ops:backup
npm run setup:prod:update
```

The backup runs first so a bad release can be restored. `setup:prod:update` keeps the pepper, the PII key, and the database password.

## Verification

Run every item below on the public URL. A local `curl` to `127.0.0.1` does not prove Caddy or DNS.

### TLS and headers

```bash
curl -fsSI https://HOST | head -n 25
echo | openssl s_client -servername HOST -connect HOST:443 2>/dev/null | openssl x509 -noout -subject -dates
```

The certificate subject must match `HOST`. The status line is HTTP/2 or HTTP/1.1 200 for `/`. `strict-transport-security` is present. `http://HOST` redirects to `https://HOST`.

### Process and dependencies

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full ps
curl -fsS https://HOST/api/health
curl -fsS https://HOST/api/ready
docker network inspect dotone-trip-backend --format '{{.Internal}}'
docker compose -f compose.yaml -f compose.prod.yaml exec -T app \
  node -e "const n=require('net');const s=n.connect(3310,'clamav');s.on('connect',()=>s.write('zPING\0'));s.on('data',d=>{console.log(d.toString());process.exit(0)});s.on('error',e=>{console.error(e.message);process.exit(1)})"
```

Health returns `{"ok":true,"service":"web"}`. Ready returns `{"ok":true,"database":"up"}`. `Internal` is `false`. The node command prints `PONG`.

`docker ps` must not show `0.0.0.0:5432` or `0.0.0.0:3000`. Postgres and the app are reachable from Caddy and from the Docker networks, not from the public internet.

### Login and cookies

Open `https://HOST/admin/login`. Sign in as `admin`. The session cookie `trip_session` is HttpOnly, Secure, and SameSite=Lax. Signing in over `http://` must not be possible on this host.

### Upload and forms

1. Upload a small PNG in the media library. It is stored only after ClamAV accepts it. The row shows the scan engine and result.
2. Submit the contact form on `/contact-us`. The admin inbox shows it.
3. Submit a career application with a PDF. Download that PDF from the submission in the admin. It opens as the same file.
4. Publish one post that uses the uploaded image. The public page loads the image from `/media/file/...`.

If the upload says the scanner is unavailable, follow the ClamAV section in [DEPLOYMENT.md](DEPLOYMENT.md). Do not delete volumes to "fix" it.

### Log review

```bash
docker compose -f compose.yaml -f compose.prod.yaml logs --tail 100 app proxy postgres
```

Look for repeated restarts, `EAI_AGAIN clamav`, and `EACCES` on `/app/data/resumes` or `/app/data/media`. A clean install has none of those after the ready check passes.

## A later release

```bash
npm run ops:backup
git pull
npm run setup:prod:update
curl -fsS https://HOST/api/ready
```

Repeat the login, one media upload, and one public page. If the new release is bad, put the previous image back and start the stack again without `-v`. The database volume is still the current data. Roll back a SQL migration only when that migration has a tested down path. The backup from the start of this section is the copy you can restore into a slot, not a reason to wipe production.

`npm run docker:down:keep` stops the site and keeps images and volumes. Start again with `npm run setup:prod:update` or:

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d
```

## Commands that must not run here

| Command | Why |
| --- | --- |
| `npm run clean:slate` | Deletes `.env` and the database, media, resume, and ClamAV volumes |
| `npm run clean:local` | Deletes `.env`. The existing volume will not accept a new password |
| `npm run docker:down:remove` | Deletes volumes and images |
| `docker compose down -v` | Same data loss |
| `npm run setup:fresh` | Laptop stack. It does not start Caddy and it refuses a finished `.env` |
| `npm run setup:prod` on a server that already has `.env` | Refused on purpose. Use `setup:prod:update` |
| `internal: true` on the backend network | The app cannot resolve `clamav` |

`npm run clean:modules` is allowed. It deletes only `node_modules` on the host, then you run `npm run setup:prod:update`.

If the Docker engine returns HTTP 500 and will not list containers:

```bash
sudo systemctl restart docker
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d
```

That keeps the volumes.
