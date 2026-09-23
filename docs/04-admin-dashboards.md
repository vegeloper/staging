# Admin dashboards

The console lives at `/admin`. The signed-in role decides which tabs exist.

| Tab | Path | Admin | Operator | Content creator |
| --- | --- | --- | --- | --- |
| پیشخوان | `/admin` | yes | redirected to درخواست‌ها | redirected to مطالب |
| درخواست‌ها | `/admin/submissions` | yes | yes | no |
| موقعیت‌های شغلی | `/admin/positions` | yes | yes | no |
| مطالب | `/admin/content` | yes | no | yes |
| رسانه | `/admin/media` | yes | no | yes |
| پوسته | `/admin/theme` | yes | no | no |
| کپی‌رایت | `/admin/copyright` | yes | no | no |
| پروفایل | `/admin/profile` | yes | yes | yes |

Usernames from bootstrap are `admin`, `operator`, and `creator`. Passwords come from `npm run db:bootstrap` or `npm run docker:bootstrap`. See [DEPLOYMENT.md](DEPLOYMENT.md) §6.

## پیشخوان

The admin home shows six cards:

- new submission count, linked to the inbox filtered to `new`
- job positions waiting for review
- posts waiting for review
- accepted media-library files
- published theme revision
- published copyright text and revision

The admin can open every other tab from here and can perform the operator and content-creator actions. Those actions are not copies of the data: the inbox and the CMS are the same pages the other roles use.

## درخواست‌ها

This is the operator inbox moved from `/admin` to `/admin/submissions`. Filters, detail, status changes, and resume download are unchanged. A creator who opens this path is sent back to مطالب. An operator who opens پوسته, کپی‌رایت, مطالب, or رسانه is sent back to the inbox. The inbox and the job-position list share a tab strip: رزومه‌ها و درخواست‌ها and موقعیت‌های شغلی.

## موقعیت‌های شغلی

`/admin/positions` is where job offers are added, edited, and reviewed. The same tab is in the top navigation for the admin and the operator, and again inside the received-resumes inbox. A content creator does not see it.

The states match the news and articles pipeline: draft, pending review, approved, rejected. Rejection needs a note. The public join pages only list `approved` positions. The built-in organizational catalog is copied in once; later unpublishing stays unpublished.

Role mapping, using the CMS roles that already exist:

- **Admin** is the website manager and the reviewer (the same person who approves news). An admin can create, edit, publish, unpublish, approve, and reject any position without waiting for a second approval. Saving an approved position keeps it approved and updates `/join-us` on the next request.
- **Operator** follows the content-creator path. An operator can draft a new position and submit it. They can edit their own drafts and rejected positions, withdraw a position that is waiting for review, and read the rejection note. They cannot approve or publish.
- **Editing a live position** is direct for the admin. An operator uses پیشنهاد ویرایش, which opens a draft linked to that position. The live page stays up until the admin approves the proposal. Approval copies the proposal onto the published position. Rejection leaves the live page unchanged.
- **Content creator** has no job-position permission, the same way an operator has no news permission. There is no separate content-manager account: review stays with the admin, as it does for مطالب.

## مطالب

Content creators draft news and articles, submit them, and see the rejection note. They can edit their own drafts and rejected posts. They cannot approve.

The website admin can create, edit, submit, approve, reject, and unpublish any post. Saving an approved post keeps it approved and updates `/blog` on the next request. The public blog only lists `approved` posts. The static catalog is copied in once; later deletions stay deleted.

Workflow detail is the same as the first CMS release: draft → pending review → approved or rejected. Rejection needs a note. The creator can resubmit a rejected post.

The post image can be one of the built-in catalog images, a file dropped on the field, or an item chosen from the media library. A direct upload is stored in the library only after the checks below succeed, and the post then points at `/media/file/{id}`.

## رسانه

`/admin/media` is the shared library for the admin and the content team. Operators do not see the tab.

The upload area accepts a drag-and-drop or a file picked from the computer. The browser shows a blue **در حال اسکن** toast with a small wave of dots while the request runs. A clean file turns that toast green and appears in the library. A bad file turns it red and is not stored. Amber is only a warning, for example when a valid video is dropped on an image field: the file can still enter the library, but that field does not select it.

Before anything is written:

1. The bytes are identified. PNG, JPEG, GIF, WebP, MP4, and WebM are allowed. SVG is not. An `MZ`/`ELF`/script header is rejected even if the name ends in `.png` or `.mp4`. The extension must match the detected type. A PNG must end at `IEND`, and other containers must not carry a trailing payload.
2. ClamAV scans the buffer with the INSTREAM protocol. The upload is refused when the scanner is down or when it reports a signature. Nothing infected is written to disk.

Images are limited to 8 MB and videos to 64 MB. The same SHA-256 is not stored twice; the existing library row is reused.

The list and the detail page request only a 320-pixel JPEG thumbnail (or a filetype badge if a thumbnail could not be made). The original is requested when someone chooses **نمایش بزرگ** or **پخش**, and when the public site actually renders that asset. Detail shows the name, description, alt text, MIME type, size, dimensions, duration, SHA-256, scan engine and result, uploader, and timestamps. Search, kind, sort, and date filters are on the list. A card opens the detail page. The same browser is the picker inside theme and content fields.

Files live under `MEDIA_ROOT` (`data/media` locally, `/app/data/media` in Docker), not under `public/`.

## پوسته

The theme screen is three sections: **پالت رنگ**, **تصاویر**, and **ویدیو**. The document still has a draft and a published copy.

- **پالت رنگ:** **رنگ اصلی** and **رنگ اصلی تیره** drive buttons, links, and the other brand accents (`--brand`, `--brand-dark`). **رنگ متن** and **رنگ زمینه** set `--ink` and `--paper`. **رنگ سطح کارت‌ها** and **رنگ تأکید** are `--surface` and `--hero`.
- **تصاویر:** optional page background (`--page-image`), both header logos, the footer logo, the home journey image, and the campaign poster. Each field accepts a drop, a file from the computer, a library pick, or a built-in `/figma`, `/videos`, `/fonts`, or `/uploads` path.
- **ویدیو:** the campaign video only. Its poster stays in the image section.

Leave a field empty to keep the built-in file. A filled path must be a library id (`/media/file/{uuid}`) or a public path, with no `..`, quotes, or other CSS syntax. Saving checks that a library image is an image and the campaign file is a video. Publishing still does not restart the container.

**ذخیره پیش‌نویس** does not change the public site. **انتشار پوسته** copies the draft to the published document, increments the revision, and invalidates the Next.js cache in the running process.

## پروفایل

Every signed-in role opens **پروفایل** from the tab or from their name in the header. The page shows the username and role, and a password form: current password, new password, and confirmation. The new password must be at least 12 characters and different from the current one. While the request runs, the button shows a `1` filling upward. Success flashes the button green and shows a green toast. A mismatch, a wrong current password, or any other failure flashes it red and shows a red toast. Other sessions for that account are revoked. The session that made the change stays signed in.

## کپی‌رایت

The footer sentence is plain text, at most 400 characters, with no HTML. The built-in sentence is:

`تمامی حقوق این سایت متعلق به شرکت دات وان تریپ می باشد`

**انتشار کپی‌رایت** replaces that sentence on every page that renders the footer. The public site reads the published value, not the draft.

## What happens on publish

The admin’s browser calls `PATCH /api/admin/site/theme` or `PATCH /api/admin/site/copyright`. The route checks the session, requires the admin role, checks `Origin` against `APP_ORIGIN`, validates the document, and writes `site_documents`.

On publish it then:

1. `revalidateTag('site-settings', { expire: 0 })` — the previous cached theme and copyright are not served. The next request reads Postgres and stores the new value under the same tag.
2. `revalidatePath('/', 'layout')` — pages under the root layout are rendered again with that value.

The root layout applies the colors as inline CSS variables on `<html>`, which override the defaults in `app/globals.css`. Header, footer, the home hero image, and the campaign video read the same published document through a small client context. The Docker container stays up. There is no cache warmup job to run by hand.

Compose runs one web container. That is the process whose cache is cleared. A second replica would not see the tag until it had its own invalidation or a shared cache handler. Do not add replicas without that work.

`npm run docker:deploy` still replaces the container when the image changes. Health checks gate Caddy. That is an image rollout, not how theme or copyright is published.

If Postgres is down, or `next build` runs without `DATABASE_URL` (the Docker builder does not get one), the site renders the built-in theme and copyright instead of failing the build.

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:bootstrap` | One-shot accounts against `DATABASE_URL` in the environment. Prints passwords. |
| `npm run docker:bootstrap` | Same, inside the local Compose seed container. |
| `npm run docker:bootstrap:prod` | Same, with `compose.prod.yaml`, without restarting `app`. |
| `npm run docker:migrate` | Apply `drizzle/*.sql` in Compose. |
| `npm run docker:build` | Build the Compose images. |
| `npm run docker:up` | Local full stack with the app port published. |
| `npm run docker:deploy` | Production overlay (Caddy, read-only app). The proxy waits for the app health check. |
| `npm run docker:down` | Stop that stack. Does not delete volumes. |
| `npm run docker:logs` | Follow the local `app` log. |
| `npm run setup:fresh` | New computer: `.env`, dependencies, Docker stack, media volume, ClamAV, and admin passwords. See [00-start-here.md](00-start-here.md). |
| `npm run setup:update` | Existing checkout: rebuild, migrate, and start media plus ClamAV. Does not rotate passwords. |
