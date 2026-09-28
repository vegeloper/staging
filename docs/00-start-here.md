# Start here

Two commands cover a new computer and a computer that already ran this repo. Both use Docker. Run them from the repository root.

You need Git, Node.js 22.13 or newer, Docker Engine 24 or newer, and Docker Compose v2.24 or newer. Start Docker before either command.

The site listens on `http://127.0.0.1:3000`. The admin login is `http://127.0.0.1:3000/admin/login`.

## Fresh clone

```bash
git clone <repo-url>
cd <repo-directory>
npm run setup:fresh
```

That command does all of the following:

1. Creates `.env` from `.env.example` and fills the database password and the two encryption keys. If `.env` already exists, it stops. Use the update command instead.
2. Runs `npm ci`.
3. Builds and starts the stack: Postgres, migrations (including the media library), the resume volume, the media volume, ClamAV, and the web app.
4. Waits until `http://127.0.0.1:3000/api/ready` answers. The first ClamAV start downloads virus definitions and can take several minutes. Leave the command running.
5. Confirms the app container can open the name `clamav` on port 3310 and gets `PONG`. Setup stops if that name does not resolve. A media upload would otherwise be refused.
6. Creates the admin accounts and prints three passwords once. They are not saved in `.env` or in a file.

Save these usernames and the printed passwords in a password manager:

| Username | Role |
| --- | --- |
| `admin` | Full console, including theme, copyright, and media |
| `operator` | Submission inbox only |
| `creator` | Posts and the media library |

Do not commit `.env`. Do not run `setup:fresh` again on the same machine. A second bootstrap rotates all three passwords.

## Already cloned

Use this after `git pull` when the checkout has run before, including after the media-library changes.

```bash
git pull
npm run setup:update
```

That command:

1. Refuses to run when `.env` is missing. A new machine uses `setup:fresh`.
2. Runs `npm ci`.
3. Rebuilds and starts the stack again. New SQL migrations apply. The media volume and ClamAV start if they were not there yet.
4. Waits for `/api/ready`, then confirms the app container can reach ClamAV by the name `clamav`.
5. Does not change admin passwords and does not rewrite `.env`.

Existing Postgres data, resumes, and uploaded media stay on their Docker volumes.

## After either command

1. Open `http://127.0.0.1:3000`.
2. Open `http://127.0.0.1:3000/admin/login` and sign in as `admin`.
3. Confirm the tabs you should see, including پروفایل. Admin sees every tab. Operator sees درخواست‌ها and پروفایل. Creator sees مطالب، رسانه، and پروفایل.
4. On a fresh ClamAV volume, wait until the clamav container is healthy before uploading media. Until then an upload shows a red “scanner unavailable” toast and the file is not stored. Setup already requires a `PONG` from inside the app container before it finishes.

Useful follow-ups:

| Command | When |
| --- | --- |
| `npm run docker:logs` | The site did not become ready |
| `npm run docker:down` | Stop the stack. Volumes are kept |
| `npm run docker:down:keep` | Stop app, Postgres, ClamAV, Caddy, and one-shot jobs. Images and volumes stay |
| `npm run docker:bootstrap` | Rotate `admin`, `operator`, and `creator` on purpose. This prints new passwords and the old ones stop working |
| `npm run clean:modules` | `npm ci` failed with `EPERM` while deleting `node_modules`. Then run `setup:update` |
| `npm run clean:local` | Remove a broken local checkout’s files, then decide whether the old database volume should stay |
| `npm run clean:slate` | Wipe this laptop and start over. Then run `setup:fresh` |

## When setup is stuck

`setup:fresh` stops when `.env` already exists. That checkout uses `setup:update`.

If `setup:update` or `npm ci` stops with `EPERM` on a file under `node_modules` (often `lightningcss.win32-x64-msvc.node`), Windows has that file open. From the repository root:

```bash
npm run clean:modules
npm run setup:update
```

`clean:modules` deletes only `node_modules`. `.env` and `package-lock.json` stay, on Windows and on Linux. If it still says the folder is locked, close Cursor and any terminal in this folder, then run `clean:modules` again.

| Command | Removes | Leaves |
| --- | --- | --- |
| `npm run clean:modules` | `node_modules` | `.env`, `package-lock.json`, containers, volumes |
| `npm run clean:local` | `.env`, `.env.local`, `node_modules`, `.next` | Containers and volumes. If `package-lock.json` differs from git, it is restored |
| `npm run clean:slate` | The same files, then the containers and Docker volumes (database, media, resumes, virus definitions) | The git copy of `package-lock.json` |

`package-lock.json` is not deleted. `npm ci` fails without it.

`clean:local` does not change the database volume. A new `.env` from `setup:fresh` will not match that volume. For a real fresh start:

```bash
npm run clean:slate
npm run setup:fresh
```

`clean:slate` and `npm run docker:down:remove` delete the database, resumes, media, and virus definitions. Use them on a laptop you mean to wipe. Do not run them on the live server.

## Optional: edit with hot reload

The Docker app does not reload when you edit files. To work with `npm run dev`:

1. `docker compose stop app` so port 3000 is free. Leave Postgres and ClamAV running.
2. Install `ffmpeg` and put it on your `PATH`. Thumbnails are made with it. The Docker image already has it; the host dev server does not.
3. `npm run dev`
4. ClamAV is published on `127.0.0.1:3310`. With `CLAMAV_HOST` unset, the dev server uses that port when a local ClamAV socket is not present.

When you want the Docker site again, stop `npm run dev` and run `npm run setup:update`.

## Production server

`setup:fresh` is the laptop stack. It does not start Caddy and it leaves `TRUST_PROXY=false`.

On the PC that builds the image:

```bash
npm run docker:export
```

That builds `dotone-trip-app` and `dotone-trip-migrate` when they are not already built, tags the seed image, asks whether the save path is absolute or relative, and writes the `.tar` there.

Copy the tar to the VPS. From the repository root on the server:

```bash
npm run docker:load
npm run setup:prod:dockerImage
```

`docker:load` asks for the tar path, loads the three images, and stops. `setup:prod:dockerImage` then asks for the public hostname and URL, writes `.env` with `APP_HOST`, `APP_ORIGIN=https://that-host`, and `TRUST_PROXY=true`, and starts Caddy from those images. It does not build on the server. DNS for that hostname must already point at the server.

To build on the VPS from the git checkout instead, skip the tar and run `npm run setup:prod`.

After a later `git pull` on the same server:

```bash
npm run setup:prod:update
```

That keeps the database password and encryption keys. It asks for the hostname only when `APP_HOST`, `APP_ORIGIN`, or `TRUST_PROXY` is not already set for HTTPS. All three production commands use `compose.yaml` and `compose.prod.yaml`, and they do not finish until the app container gets `PONG` from `clamav:3310`.

`setup:prod` and `setup:prod:update` build on the server. `setup:prod:dockerImage` uses the loaded tar and does not build. The ClamAV network rules are in the compose files, so both paths get them. Do not set `internal: true` on the `backend` network. The app is on `edge` and `backend` at the same time, and Docker DNS then fails the name `clamav` with `EAI_AGAIN`. Uploads are refused. An `/etc/hosts` line inside the container is lost on the next app restart.

If a server that is already up shows the scanner error, do not run `docker compose down -v` and do not recreate the network while Postgres or ClamAV is still attached to it. From the directory that contains `compose.yaml` (this server uses `/opt/staging`):

```bash
docker network inspect dotone-trip-backend --format '{{.Internal}}'
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
docker exec dotone-trip-app-1 node -e "const n=require('net');const s=n.connect(3310,'clamav');s.on('connect',()=>s.write('zPING\0'));s.on('data',d=>{console.log(d.toString());process.exit(0)});s.on('error',e=>{console.error(e.message);process.exit(1)})"
```

The inspect line must print `false`. The node line must print `PONG`. Then upload the file again. If inspect prints `true`, stop only the attached containers, remove that network, and start again. Volumes stay:

```bash
docker compose -f compose.yaml -f compose.prod.yaml --profile full stop app postgres clamav proxy
docker network rm dotone-trip-backend
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
```

## Same install error on the live server

`clean:local`, `clean:slate`, and `docker:down:remove` are laptop wipes. They delete `.env` or the database volume. On the live server the Postgres volume already contains data encrypted with the current `.env`. A new `.env` will not open it.

Leave `.env` and the Docker volumes in place. `clean:modules` is safe here: it deletes only `node_modules`.

If `npm ci` or `setup:prod:update` stops with `EPERM` or `EBUSY` on a file under `node_modules`, from the directory that contains `compose.yaml` (this server uses `/opt/staging`):

```bash
npm run clean:modules
npm run setup:prod:update
```

The public site runs in Docker, so this host folder can be deleted while Postgres and Caddy keep running. `setup:prod:update` then recreates the app and keeps the current password and encryption keys.

If `clean:modules` still cannot delete the folder, find the host process that has it open, stop that process, and run `clean:modules` again:

```bash
sudo lsof +D node_modules
```

If `package-lock.json` was edited on the server and `npm ci` rejects it, put back the committed file and update again:

```bash
git checkout HEAD -- package-lock.json
npm run setup:prod:update
```

If `setup:prod` says this checkout already has a `.env`, run `setup:prod:update`. Do not delete `.env` to force `setup:prod` or `setup:fresh`.

If the Docker engine returns HTTP 500 and will not list containers, restart the engine and start the same stack. Volumes stay:

```bash
sudo systemctl restart docker
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d
```

`docker:down:keep` stops the site and keeps images and volumes. Use it only when the whole stack must stop, then bring it back with `setup:prod:update`.
