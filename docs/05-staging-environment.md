# Staging environment

Company staging is a server that is not the public production DNS name. Use it to install the same Docker stack the live site uses, exercise the CMS and the public forms, and rehearse backup and restore. The live subdomain is covered in [06-production-server.md](06-production-server.md). Backup and the second instance are covered in [07-backup-and-restore.md](07-backup-and-restore.md).

## Contents

1. [Command sheet](#command-sheet)
2. [What this server is](#what-this-server-is)
3. [Prerequisites](#prerequisites)
4. [Before install](#before-install)
5. [Install](#install)
6. [After install](#after-install)
7. [Checks](#checks)
8. [A second instance](#a-second-instance)
9. [Hand off to production](#hand-off-to-production)

## Command sheet

Run these from the repository root. On this project that directory on the current server is `/opt/staging`. Another machine may use `/opt/dotone-trip`. Use the directory that contains `compose.yaml`.

```bash
docker --version
docker compose version
node -v
git status
npm run setup:prod
npm run setup:prod:update
curl -fsS https://STAGING_HOST/api/health
curl -fsS https://STAGING_HOST/api/ready
npm run ops:backup
npm run ops:slot:up
npm run ops:slot:down
```

`STAGING_HOST` is the staging hostname, for example `staging.example.com`. It is not the public production name.

## What this server is

Staging runs the production Compose files: `compose.yaml` and `compose.prod.yaml`. Caddy answers ports 80 and 443. The app, Postgres, and ClamAV are not published to the internet. The app is on the `edge` and `backend` networks. Postgres and ClamAV are on `backend` only.

Do not mark `backend` as `internal: true`. That combination makes the name `clamav` fail inside the app, and media uploads are refused.

Named volumes hold the data:

| Volume | Contents |
| --- | --- |
| `dotone-trip-postgres-data` | Database, including posts, media rows, form submissions, scan results, and accounts |
| `dotone-trip-resumes-data` | Career PDF files |
| `dotone-trip-media-data` | Media library originals and thumbnails |
| `dotone-trip-clamav-data` | ClamAV signature files, not the scan results |
| `dotone-trip-caddy-data` | Certificates |
| `dotone-trip-caddy-config` | Caddy state |

Scan results live in the `media_assets` table (`scan_engine`, `scan_result`). Restoring only the ClamAV volume does not restore those rows.

## Prerequisites

Check these before the first install. Stop if one of them fails.

```bash
docker --version
docker compose version
node -v
ss -ltnp | grep -E ':80|:443' || true
df -h /
free -h
```

| Check | Required |
| --- | --- |
| Docker Engine | 24 or newer |
| Docker Compose | v2.24 or newer (`ports: !reset` needs it) |
| Node.js | 22.13 or newer, only because `npm run setup:prod` is a Node script |
| DNS | `STAGING_HOST` points at this server |
| Firewall | Inbound 22, 80, and 443. No inbound 5432 or 3000 from the internet |
| Disk | Room for Postgres, media, resumes, and about 200 MB of ClamAV signatures, plus growth |
| Git | A clean checkout of the branch you intend to stage |

`docker compose version` must print v2.24 or higher. `node -v` must print v22.13 or higher. Ports 80 and 443 must be free before the first Caddy start. If `ss` shows another web server on those ports, stop that server or staging will not obtain a certificate.

Confirm DNS from outside this machine:

```bash
dig +short STAGING_HOST
```

The answer must be this server's public address.

## Before install

1. SSH in as a user who can run Docker.
2. Clone the branch into the chosen directory. Do not copy a laptop `.env`.
3. `git status` must be clean aside from untracked files you expect.
4. Decide the public URL. It must be `https://STAGING_HOST` with no path and no trailing slash.
5. If this machine already ran an older copy, read [07-backup-and-restore.md](07-backup-and-restore.md) and take a backup before you replace it.
6. Do not run `npm run clean:slate` or `npm run docker:down:remove` if this staging server already holds data you need. Those commands delete volumes.

A new empty server has no `.env`. `npm run setup:prod` creates it and asks for the hostname.

## Install

From the repository root:

```bash
git pull
npm run setup:prod
```

The command asks for the hostname, then the URL. Answer `STAGING_HOST` and accept `https://STAGING_HOST`. It writes `.env` with `TRUST_PROXY=true`, `APP_HOST`, and `APP_ORIGIN`, builds the images, and starts Caddy. The first ClamAV start downloads signatures and can take several minutes. Leave the command running until it prints that the site is up and then prints the admin passwords.

Save those passwords in the team password store. They are not written to `.env`.

If the images were built on another machine:

```bash
npm run docker:load
npm run setup:prod:dockerImage
```

`docker:load` only loads the tar. `setup:prod:dockerImage` does not build. Later source updates on this server use:

```bash
git pull
npm run setup:prod:update
```

That keeps the database password and the encryption keys.

## After install

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full ps
docker compose -f compose.yaml -f compose.prod.yaml exec -T app node -e "const n=require('net');const s=n.connect(3310,'clamav');s.on('connect',()=>s.write('zPING\0'));s.on('data',d=>{console.log(d.toString());process.exit(0)});s.on('error',e=>{console.error(e.message);process.exit(1)})"
curl -fsS https://STAGING_HOST/api/health
curl -fsS https://STAGING_HOST/api/ready
```

Expect every long-running service to be healthy or exited 0 for the one-shot init and migrate jobs. The node command must print `PONG`. Health must return `{"ok":true,"service":"web"}`. Ready must return `{"ok":true,"database":"up"}`.

Then sign in at `https://STAGING_HOST/admin/login` as `admin` with the password from the install output.

## Checks

Run this list after every staging install and again after a restore drill. Record the date and the git commit.

### Edge and process

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full ps
curl -fsSI https://STAGING_HOST | head -n 20
docker network inspect dotone-trip-backend --format '{{.Internal}}'
```

`Internal` must be `false`. The HTTPS response must include `strict-transport-security`. Postgres must not show a public `0.0.0.0:5432` mapping. In production Compose the database has no host port.

### Application and database

```bash
curl -fsS https://STAGING_HOST/api/health
curl -fsS https://STAGING_HOST/api/ready
```

Open `/admin/login`. Admin sees every tab, including media and submissions. Operator sees the submission inbox. Creator sees posts and media.

### Virus scanner

The `PONG` command in [After install](#after-install) must succeed from inside the app container. Then, as creator or admin, upload a small PNG in `/admin/media`. The file appears only after the scan. The detail shows a ClamAV result. A second copy of the same file reuses the existing row.

### Public forms and files

1. Submit `/contact-us`. The inbox at `/admin/submissions` shows the row.
2. Open an organizational job and send a small PDF. The submission stores the file. Download it from the admin submission page and confirm it is the same PDF.
3. Publish a news or article post that uses a media-library image. The public page renders that image.
4. Change the theme color, publish it, and reload the public homepage. The color changes without a new image build.

### Data you will restore later

After those edits, note the counts. The backup drill compares them:

```bash
docker compose -f compose.yaml -f compose.prod.yaml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) as posts from content_posts; select count(*) as media from media_assets; select count(*) as submissions from submissions; select count(*) as resumes from job_applications;"'
```

The database user and name come from the container. Do not paste `.env` into the ticket.

### Failure signs

| What you see | What to do |
| --- | --- |
| `npm ci` reports `EPERM` or `EBUSY` | `npm run clean:modules`, then `npm run setup:prod:update`. Do not delete `.env` |
| `setup:prod` says `.env` already exists | `npm run setup:prod:update` |
| Upload says the scanner is unavailable | ClamAV is still downloading signatures, or the app cannot resolve `clamav`. See [DEPLOYMENT.md](DEPLOYMENT.md) |
| `/api/ready` is 503 | Postgres is down or `DATABASE_URL` does not match the volume |
| Certificate is not issued | DNS does not point here, or ports 80 and 443 are closed |

## A second instance

Do not clone the repo a second time and run `setup:prod` again on this host. Both copies would use the volume names `dotone-trip-postgres-data`, `dotone-trip-media-data`, and `dotone-trip-resumes-data`, and both would try to bind ports 80 and 443.

The second instance is a restore drill. It uses `compose.slot.yaml`, listens on `127.0.0.1:3001`, and stores data in `dotone-trip-slot-*` volumes. It does not start Caddy. Reach it with an SSH tunnel if you are not on the server:

```bash
ssh -L 3001:127.0.0.1:3001 user@STAGING_HOST
```

Then open `http://127.0.0.1:3001` on your computer. The full drill is in [07-backup-and-restore.md](07-backup-and-restore.md).

```bash
npm run ops:backup
npm run ops:slot:up
npm run ops:slot:restore
npm run ops:slot:down
```

`ops:slot:down -- --wipe` deletes only the slot volumes.

## Hand off to production

Staging is ready to inform production when all of the following are true:

1. The checks in this document passed on the commit you will ship.
2. A backup from [07-backup-and-restore.md](07-backup-and-restore.md) was taken and a slot restore showed the same posts, media, submissions, and resume file.
3. `npm run docker:export` produced a tar from that commit, or the production host will build with `npm run setup:prod` from that same commit.
4. Production `.env` will be new secrets, not a copy of the staging `.env`. The staging pepper and database password must not be reused.
5. The production DNS name is not pointed at this staging server.

Take the tar, the commit id, and the test notes to the production runbook. Do not take the staging database unless the product owner has asked for a content copy. A normal production install starts empty and gets its own admin passwords.
