import { expect, test } from "@playwright/test";

const creatorPassword = process.env.SEED_CREATOR_PASSWORD;

test("a signed-in user can change their password from the profile", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!creatorPassword, "SEED_CREATOR_PASSWORD is required");

  const nextPassword = `creator-next-${Date.now().toString().slice(-6)}`;

  async function login(password: string) {
    await page.goto("/admin/login");
    await page.getByLabel("نام کاربری").fill("creator");
    await page.getByLabel("رمز عبور").fill(password);
    await page.getByRole("button", { name: "ورود" }).click();
    await expect(page.getByRole("heading", { name: "مطالب و اخبار" })).toBeVisible();
  }

  await login(creatorPassword!);
  await page.getByRole("link", { name: "پروفایل" }).click();
  await page.getByLabel("رمز فعلی").fill(creatorPassword!);
    await page.getByLabel("رمز جدید", { exact: true }).fill("brand-new-password");
  await page.getByLabel("تکرار رمز جدید").fill("does-not-match");
  await page.getByRole("button", { name: "تغییر رمز" }).click();
  await expect(page.getByText("تکرار رمز با رمز جدید یکی نیست.")).toBeVisible();

  let changed = false;
  await page.route("**/api/admin/profile/password", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  try {
    await page.getByLabel("رمز فعلی").fill(creatorPassword!);
    await page.getByLabel("رمز جدید", { exact: true }).fill(nextPassword);
    await page.getByLabel("تکرار رمز جدید").fill(nextPassword);
    await page.getByRole("button", { name: "تغییر رمز" }).click();
    await expect(page.getByText("در حال تغییر رمز")).toBeAttached();
    await page.screenshot({ path: "/opt/cursor/artifacts/profile_password_loading.png" });
    await expect(page.getByText("رمز عبور عوض شد.")).toBeVisible();
    changed = true;
    await page.unroute("**/api/admin/profile/password");
    await page.getByRole("button", { name: "خروج" }).click();
    await login(nextPassword);
  } finally {
    if (changed) {
      await page.unroute("**/api/admin/profile/password").catch(() => undefined);
      await page.goto("/admin/profile");
      if (page.url().includes("/admin/login")) await login(nextPassword);
      await page.getByLabel("رمز فعلی").fill(nextPassword);
      await page.getByLabel("رمز جدید", { exact: true }).fill(creatorPassword!);
      await page.getByLabel("تکرار رمز جدید").fill(creatorPassword!);
      await page.getByRole("button", { name: "تغییر رمز" }).click();
      await expect(page.getByText("رمز عبور عوض شد.")).toBeVisible();
    }
  }
});