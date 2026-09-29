# Backup and restore

This runbook saves the database and the file volumes, then proves the backup by restoring it into a second instance on another port. The live stack keeps running on its own volumes. Use the same commands on a laptop, on staging, and on production. On production, copy the backup off the server. Do not restore over the live volumes as a test.

Staging install steps are in [05-staging-environment.md](05-staging-environment.md). Production checks are in [06-production-server.md](06-production-server.md).

## Contents

1. [Command sheet](#command-sheet)
2. [What is saved](#what-is-saved)
3. [Build a staging site and change data](#build-a-staging-site-and-change-data)
4. [Take the backup](#take-the-backup)
5. [Start a second instance](#start-a-second-instance)
6. [Restore into that instance](#restore-into-that-instance)
7. [Prove the restore](#prove-the-restore)
8. [Stop the second instance](#stop-the-second-instance)
9. [Change ports](#change-ports)
10. [Production copies](#production-copies)
11. [Restoring onto the live volumes](#restoring-onto-the-live-volumes)

## Command sheet

```bash
npm run ops:backup
npm run ops:slot:up
npm run ops:slot:restore
npm run ops:slot:restore -- backups/20260929-083000
npm run ops:slot:down
npm run ops:slot:down -- --wipe
```

| Command | Effect |
| --- | --- |
| `npm run ops:backup` | Writes `backups/<timestamp>/` with `database.dump`, `resumes.tar`, `media.tar`, `clamav.tar`, optional Caddy archives, `env.copy`, and `MANIFEST.txt` |
| `npm run ops:slot:up` | Creates `.env.slot` once, from `.env`, and starts a second stack on `127.0.0.1:3001` |
| `npm run ops:slot:restore` | Loads the newest backup, or the folder you pass, into the second stack |
| `npm run ops:slot:down` | Stops the second stack and keeps its volumes |
| `npm run ops:slot:down -- --wipe` | Stops the second stack and deletes only `dotone-trip-slot-*` volumes |

The live project name stays `dotone-trip`. The second project name is `dotone-trip-slot`.

## What is saved

A full restore needs every line below. Missing one of them looks like a working site with broken pictures, missing PDFs, or logins that fail.

| Piece | Where it lives | Why it is required |
| --- | --- | --- |
| Posts, theme, accounts, submissions | Postgres dump | CMS and forms |
| Scan engine and scan result | `media_assets` in that dump | ClamAV's volume does not store these rows |
| Originals and thumbnails | `dotone-trip-media-data` | Paths in `storage_key` and `thumbnail_key` |
| Career PDFs | `dotone-trip-resumes-data` | `resume_storage_key` on job applications |
| ClamAV signatures | `dotone-trip-clamav-data` | The scanner becomes ready without downloading definitions again |
| `AUTH_PASSWORD_PEPPER` and `PII_ENCRYPTION_KEY` | `env.copy` | Passwords and national IDs were encrypted with these keys |
| Database password | `env.copy` | The slot cluster is created with this password and the app connects with it. The dump does not contain the password |
| Caddy data | `caddy-data.tar` when that volume exists | Certificates. The slot does not restore this file |

`npm run ops:backup` uses `pg_dump` in custom format. It does not tar the raw Postgres data directory. The second instance creates its own empty cluster, then `pg_restore` loads the dump. File volumes are tar archives.

`backups/` and `.env.slot` are gitignored. `env.copy` is a secret. Move it to the password store and do not leave it on a shared disk.

## Build a staging site and change data

Do this on staging before you trust the backup scripts. Production is not the place for the first drill.

1. Install staging with [05-staging-environment.md](05-staging-environment.md) until `https://STAGING_HOST/api/ready` succeeds and an admin can sign in.
2. In the media library, upload one PNG and one short video. Each row must show a ClamAV result.
3. Create a news post and an article that use those library files. Publish them.
4. Submit `/contact-us`.
5. Submit a career form with a PDF resume.
6. If you have a driver form, submit one. The national ID is encrypted with `PII_ENCRYPTION_KEY`. The restore is wrong if that key changes.
7. Record the counts:

```bash
docker compose -f compose.yaml -f compose.prod.yaml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) as posts from content_posts; select count(*) as media from media_assets; select count(*) as submissions from submissions; select count(*) as resumes from job_applications;"'
```

On a laptop stack, drop `-f compose.prod.yaml`.

Leave this stack running. The backup reads it. The second instance must not replace it.

## Take the backup

```bash
npm run ops:backup
```

The command prints a folder such as `backups/20260929-083000` and the counts. Check that these files exist:

```bash
ls -lh backups/20260929-083000
```

Expect `database.dump`, `resumes.tar`, `media.tar`, `clamav.tar`, `env.copy`, and `MANIFEST.txt`. If Caddy has run on this machine, `caddy-data.tar` and `caddy-config.tar` are there too.

Copy the folder off the server. Keep `env.copy` with the same access rules as `.env`.

The live site stays up. The command does not stop containers.

## Start a second instance

```bash
npm run ops:slot:up
```

The first run writes `.env.slot`:

| Setting | Slot value | Live value stays |
| --- | --- | --- |
| `APP_PORT` | `3001` | `3000`, or unpublished behind Caddy |
| `APP_ORIGIN` | `http://127.0.0.1:3001` | `https://HOST` |
| `POSTGRES_PORT` | `5433` | `5432`, or unpublished |
| `TRUST_PROXY` | `false` | `true` on production |
| `SLOT_PREFIX` | `dotone-trip-slot` | project `dotone-trip` |
| Pepper, PII key, database password | Copied | Unchanged |

`APP_ORIGIN` must stay `http://127.0.0.1:3001` for this slot. The app rejects a non-local `http://` origin when `NODE_ENV` is production. Do not point the company DNS name at port 3001.

`RESUME_HOST_PATH` and `MEDIA_HOST_PATH` are set to the named volumes `resumes_data` and `media_data`. The slot must not bind-mount the live `./data` directories.

The slot does not use `compose.prod.yaml`, so it does not bind 80 or 443. It also does not publish ClamAV on the host. The live publisher `127.0.0.1:3310` stays with the live stack. The slot app talks to its own `clamav` name.

Wait until the slot is up. The first start still waits for ClamAV if `clamav.tar` has not been restored yet. You can restore immediately after Postgres is healthy. `ops:slot:restore` does that wait itself.

Open `http://127.0.0.1:3001/api/ready` on the server, or tunnel it:

```bash
ssh -L 3001:127.0.0.1:3001 user@STAGING_HOST
```

## Restore into that instance

```bash
npm run ops:slot:restore -- backups/20260929-083000
```

Omit the path to use the newest folder under `backups/`.

The command:

1. Stops the slot app so it is not writing files.
2. Extracts `resumes.tar`, `media.tar`, and `clamav.tar` into `dotone-trip-slot-resumes-data`, `dotone-trip-slot-media-data`, and `dotone-trip-slot-clamav-data`.
3. Starts slot Postgres and waits until it accepts connections.
4. Runs `pg_restore --clean --if-exists` into the slot database.
5. Starts the slot stack again so `resume-init` and `media-init` set ownership to uid 1000.

It does not read or write `dotone-trip-postgres-data` or the other live volume names.

## Prove the restore

```bash
curl -fsS http://127.0.0.1:3001/api/health
curl -fsS http://127.0.0.1:3001/api/ready
docker compose -f compose.yaml -f compose.slot.yaml --env-file .env.slot exec -T app \
  node -e "const n=require('net');const s=n.connect(3310,'clamav');s.on('connect',()=>s.write('zPING\0'));s.on('data',d=>{console.log(d.toString());process.exit(0)});s.on('error',e=>{console.error(e.message);process.exit(1)})"
docker compose -f compose.yaml -f compose.slot.yaml --env-file .env.slot exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) as posts from content_posts; select count(*) as media from media_assets; select count(*) as submissions from submissions; select count(*) as resumes from job_applications;"'
```

The counts match the numbers you wrote down before the backup. `PONG` means the slot app can see its own scanner.

In the browser at `http://127.0.0.1:3001`:

1. Sign in as `admin` with the same admin password as the source stack. The password hash depends on the pepper in `.env.slot`, which was copied.
2. Open the media item. The image loads. The scan result is the one you saw before the backup.
3. Open the public post. Its image loads.
4. Open the career submission and download the PDF.
5. Open the contact submission and confirm the message text.

The live site on `https://STAGING_HOST` still shows the same data, because it was not restored over. Changing a post on port 3001 must not change the live site.

## Stop the second instance

When the drill is finished:

```bash
npm run ops:slot:down
```

Containers for `dotone-trip-slot` stop. Live containers keep running. Slot volumes remain, so you can start the slot again with `npm run ops:slot:up` without another restore.

To remove the drill data:

```bash
npm run ops:slot:down -- --wipe
```

That deletes only volumes whose names start with the slot prefix. It does not pass `-v` to the live project.

Confirm:

```bash
docker ps --format '{{.Names}}' | grep slot || echo "no slot containers"
docker volume ls | grep slot || echo "no slot volumes"
docker ps --format '{{.Names}}' | grep dotone-trip
```

The last command still lists the live `dotone-trip-app-1`, `dotone-trip-postgres-1`, and the other live services.

## Change ports

Edit `.env.slot` only. Do not edit the live `.env` to move the slot.

| Goal | Change |
| --- | --- |
| Site on port 3010 | `APP_PORT=3010` and `APP_ORIGIN=http://127.0.0.1:3010` |
| Postgres on port 5434 | `POSTGRES_PORT=5434` and the port inside `DATABASE_URL` |
| Different volume names | `SLOT_PREFIX=dotone-trip-drill2` and the same value in `name:` inside `compose.slot.yaml` |

`DATABASE_URL` in `.env.slot` is for tools on the host. The app container builds its own URL from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and the hostname `postgres`. Changing `POSTGRES_PORT` changes the published host port only.

Apply the edits:

```bash
npm run ops:slot:down
npm run ops:slot:up
```

A new `SLOT_PREFIX` is a new set of volumes. Restore again if you need the data there. Do not set `SLOT_PREFIX=dotone-trip`. The script refuses that value because it is the live project.

## Production copies

On the live server, run `npm run ops:backup` before `setup:prod:update` and on a schedule you can explain to the team. Daily is a reasonable start. Copy `backups/<timestamp>/` to storage that is not this disk.

Keep at least one copy from before the latest release, so a bad deploy can be compared with the previous data. Test that copy with `ops:slot:up` and `ops:slot:restore` on staging, or on the production host only as a slot on `127.0.0.1:3001`. Do not attach that slot to the public DNS name.

After the slot proof, `npm run ops:slot:down -- --wipe` so the extra database password and files are not left running.

## Restoring onto the live volumes

This is a maintenance window, not the drill. You already proved the files with a slot.

1. Tell users the site will be down.
2. `npm run ops:backup` once more, to a new folder, so you can undo the restore.
3. `npm run docker:down:keep`
4. Restore `resumes.tar` and `media.tar` into `dotone-trip-resumes-data` and `dotone-trip-media-data` with the same `busybox` `tar` pattern `ops:slot:restore` uses. Do not restore those tars into the slot volumes by mistake.
5. Start Postgres only:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d postgres
```

6. `pg_restore` the chosen `database.dump` into that Postgres. The pepper and PII key in the current `.env` must be the ones from that backup's `env.copy`. If they differ, stop and put the matching `.env` back before you start the app.
7. `docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d`
8. Run the production checks in [06-production-server.md](06-production-server.md).

Do not use `docker compose down -v` in this procedure. That deletes the volumes you are trying to fill.
