# Admin dashboards

The console lives at `/admin`. The signed-in role decides which tabs exist.

| Tab | Path | Admin | Operator | Content creator |
| --- | --- | --- | --- | --- |
| پیشخوان | `/admin` | yes | redirected to درخواست‌ها | redirected to مطالب |
| درخواست‌ها | `/admin/submissions` | yes | yes | no |
| مطالب | `/admin/content` | yes | no | yes |
| پوسته | `/admin/theme` | yes | no | no |
| کپی‌رایت | `/admin/copyright` | yes | no | no |

Usernames from bootstrap are `admin`, `operator`, and `creator`. Passwords come from `npm run db:bootstrap` or `npm run docker:bootstrap`. See [DEPLOYMENT.md](DEPLOYMENT.md) §6.

## پیشخوان

The admin home shows four cards:

- new submission count, linked to the inbox filtered to `new`
- posts waiting for review
- published theme revision
- published copyright text and revision

The admin can open every other tab from here and can perform the operator and content-creator actions. Those actions are not copies of the data: the inbox and the CMS are the same pages the other roles use.

## درخواست‌ها

This is the operator inbox moved from `/admin` to `/admin/submissions`. Filters, detail, status changes, and resume download are unchanged. A creator who opens this path is sent back to مطالب. An operator who opens پوسته, کپی‌رایت, or مطالب is sent back to the inbox.

## مطالب

Content creators draft news and articles, submit them, and see the rejection note. They can edit their own drafts and rejected posts. They cannot approve.

The website admin can create, edit, submit, approve, reject, and unpublish any post. Saving an approved post keeps it approved and updates `/blog` on the next request. The public blog only lists `approved` posts. The static catalog is copied in once; later deletions stay deleted.

Workflow detail is the same as the first CMS release: draft → pending review → approved or rejected. Rejection needs a note. The creator can resubmit a rejected post.

## پوسته

The theme document has a draft and a published copy.

- **رنگ اصلی** and **رنگ اصلی تیره** drive buttons, links, and the other brand accents. Those colors are CSS variables (`--brand`, `--brand-dark`), so the change covers the pages that used the old cyan values.
- **رنگ متن** and **رنگ زمینه** set `--ink` and `--paper`. The page background color is `--paper`. An optional background image is `--page-image`.
- **رنگ سطح کارت‌ها** and **رنگ تأکید** are `--surface` and `--hero` for the same published theme.
- Logos update the header (dark and light) and the footer.
- **تصویر بخش شروع سفر** updates the home-page journey image.
- **ویدیوی صفحه کمپین** and **پوستر ویدیوی کمپین** update `/campaign`.

Leave a media field empty to keep the built-in file. A filled path must start with `/figma/`, `/videos/`, `/fonts/`, or `/uploads/` and must not contain `..`, quotes, or other CSS syntax. The picker lists files already in `public/`. Publishing does not upload a new file. A new image or video has to be in the image that Docker runs.

**ذخیره پیش‌نویس** does not change the public site. **انتشار پوسته** copies the draft to the published document, increments the revision, and invalidates the Next.js cache in the running process.

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
