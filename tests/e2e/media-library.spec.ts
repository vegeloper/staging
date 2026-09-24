import { expect, test } from "@playwright/test";

const adminPassword = process.env.SEED_ADMIN_PASSWORD;

const CLEAN_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function uniquePng(seed: number) {
  const buffer = Buffer.from(CLEAN_PNG);
  buffer[45] = seed & 0xff;
  buffer[46] = (seed >> 8) & 0xff;
  return buffer;
}

test("admin uploads only files that pass structure and virus checks", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!adminPassword, "SEED_ADMIN_PASSWORD is required");

  const fullFileRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/media/file/")) {
      fullFileRequests.push(request.url());
    }
  });

  await page.goto("/admin/login");
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "پیشخوان مدیریت" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "رسانه", exact: true })).toBeVisible();

  await page.goto("/admin/theme");
  await expect(page.getByRole("heading", { name: "پالت رنگ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تصاویر" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ویدیو" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/admin_theme_sections.png", fullPage: true });

  await page.goto("/admin/media");
  await expect(page.getByRole("heading", { name: "کتابخانه رسانه" })).toBeVisible();
  const upload = page.getByLabel("بارگذاری رسانه از رایانه");
  const confirmUpload = page.getByRole("button", { name: "بارگذاری در کتابخانه" });
  await upload.setInputFiles({
    name: "tampered.png",
    mimeType: "image/png",
    buffer: Buffer.concat([CLEAN_PNG, Buffer.from("MZ-not-a-png")]),
  });
  await expect(page.getByText("tampered.png")).toBeVisible();
  await confirmUpload.click();
  await expect(page.getByText("بعد از پایان PNG داده اضافه وجود دارد.")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/media_scan_rejected.png" });

  const stamp = Date.now().toString();
  await upload.setInputFiles({
    name: `e2e-${stamp}.png`,
    mimeType: "image/png",
    buffer: uniquePng(Number(stamp.slice(-6))),
  });
  await expect(page.getByText(`e2e-${stamp}.png`).first()).toBeVisible();
  await confirmUpload.click();
  await expect(page.getByText("فایل سالم است و به کتابخانه رسانه اضافه شد.")).toBeVisible();
  await expect(page.getByText(`e2e-${stamp}.png`)).toBeVisible();
  expect(fullFileRequests).toEqual([]);
  await page.screenshot({ path: "/opt/cursor/artifacts/media_library_thumbs.png", fullPage: true });

  await page.getByRole("link", { name: "جزئیات" }).first().click();
  await expect(page.getByText("اثرانگشت")).toBeVisible();
  await expect(page.getByText("سالم").first()).toBeVisible();
  expect(fullFileRequests).toEqual([]);
  await page.screenshot({ path: "/opt/cursor/artifacts/media_detail_thumb.png", fullPage: true });

  await page.getByRole("button", { name: "نمایش بزرگ" }).click();
  await expect.poll(() => fullFileRequests.length).toBeGreaterThan(0);
  await page.screenshot({ path: "/opt/cursor/artifacts/media_fullscreen.png" });
  await page.getByRole("button", { name: "بستن" }).click();

  const fromCms = uniquePng(Number(stamp.slice(-6)) + 1);
  await page.goto("/admin/content/new");
  await page.getByLabel("تصویر مطلب — انتخاب از رایانه").setInputFiles({
    name: `cms-${stamp}.png`,
    mimeType: "image/png",
    buffer: fromCms,
  });
  await page.getByRole("button", { name: "بارگذاری در کتابخانه" }).click();
  await expect(page.getByText("فایل سالم است و به کتابخانه رسانه اضافه شد.")).toBeVisible();
  await expect(page.getByText(/\/media\/file\/[0-9a-f-]{36}/)).toBeVisible();

  await page.goto("/admin/media");
  await expect(page.getByText(`cms-${stamp}.png`)).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/media_from_cms.png", fullPage: true });
});
