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
5. Creates the admin accounts and prints three passwords once. They are not saved in `.env` or in a file.

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
4. Waits for `/api/ready`.
5. Does not change admin passwords and does not rewrite `.env`.

Existing Postgres data, resumes, and uploaded media stay on their Docker volumes.

## After either command

1. Open `http://127.0.0.1:3000`.
2. Open `http://127.0.0.1:3000/admin/login` and sign in as `admin`.
3. Confirm the tabs you should see, including پروفایل. Admin sees every tab. Operator sees درخواست‌ها and پروفایل. Creator sees مطالب، رسانه، and پروفایل.
4. On a fresh ClamAV volume, wait until the clamav container is healthy before uploading media. Until then an upload shows a red “scanner unavailable” toast and the file is not stored.

Useful follow-ups:

| Command | When |
| --- | --- |
| `npm run docker:logs` | The site did not become ready |
| `npm run docker:down` | Stop the stack. Volumes are kept |
| `npm run docker:bootstrap` | Rotate `admin`, `operator`, and `creator` on purpose. This prints new passwords and the old ones stop working |

`docker compose down -v` deletes the database, resumes, media, and virus definitions. Do not use it unless you mean to wipe the machine.

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

That keeps the database password and encryption keys. It asks for the hostname only when `APP_HOST`, `APP_ORIGIN`, or `TRUST_PROXY` is not already set for HTTPS.
