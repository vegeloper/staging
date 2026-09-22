import { expect, test } from "@playwright/test";

import { DEFAULT_COPYRIGHT } from "../../lib/site/defaults";

const adminPassword = process.env.SEED_ADMIN_PASSWORD;

test("admin publishes copyright and theme without restarting the app", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!adminPassword, "SEED_ADMIN_PASSWORD is required");

  const stamp = Date.now().toString();
  const copyright = `کپی‌رایت آزمایشی ${stamp}`;

  await page.goto("/admin/login");
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "پیشخوان مدیریت" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "بخش‌های مدیریت" });
  await expect(nav.getByRole("link", { name: "درخواست‌ها" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "مطالب" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "پوسته" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "کپی‌رایت" })).toBeVisible();

  try {
    await nav.getByRole("link", { name: "کپی‌رایت" }).click();
    await page.getByLabel("متن کپی‌رایت").fill(copyright);
    await page.getByRole("button", { name: "انتشار کپی‌رایت" }).click();
    await expect(page.getByText("کپی‌رایت منتشر شد")).toBeVisible();

    await page.goto("/");
    await expect(page.getByTestId("site-copyright")).toHaveText(copyright);

    await page.goto("/admin/theme");
    await page.getByRole("textbox", { name: "رنگ اصلی", exact: true }).fill("#112233");
    await page.getByRole("button", { name: "انتشار پوسته" }).click();
    await expect(page.getByText("پوسته منتشر شد")).toBeVisible();
    await page.screenshot({
      path: "/opt/cursor/artifacts/admin_theme_published.png",
      fullPage: true,
    });

    await page.goto("/");
    await expect(page.getByTestId("site-copyright")).toHaveText(copyright);
    await expect.poll(async () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim()),
    ).toBe("#112233");
    await page.getByTestId("site-copyright").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "/opt/cursor/artifacts/public_theme_applied.png",
      fullPage: true,
    });
  } finally {
    await page.goto("/admin/copyright");
    await page.getByLabel("متن کپی‌رایت").fill(DEFAULT_COPYRIGHT);
    await page.getByRole("button", { name: "انتشار کپی‌رایت" }).click();
    await expect(page.getByText("کپی‌رایت منتشر شد")).toBeVisible();
    await page.goto("/admin/theme");
    await page.getByRole("button", { name: "بازنشانی فرم" }).click();
    await page.getByRole("button", { name: "انتشار پوسته" }).click();
    await expect(page.getByText("پوسته منتشر شد")).toBeVisible();
  }
});
