import { expect, test } from "@playwright/test";

const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const operatorUnused = process.env.SEED_OPERATOR_PASSWORD;

test("contact form appears in the admin inbox", async ({ page }) => {
  test.skip(!adminPassword, "SEED_ADMIN_PASSWORD is required for this e2e test");

  const stamp = Date.now();
  const lastName = "کاربرآزمایشی";
  await page.goto("/forms");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.locator('#contact input[name="firstName"]').fill("آزمایش");
  await page.locator('#contact input[name="lastName"]').fill(lastName);
  await page.locator('#contact input[name="phone"]').fill("09121234567");
  await page.locator('#contact input[name="email"]').fill(`e2e${stamp}@gmail.com`);
  await page.locator('#contact label').filter({ hasText: "درخواست عمومی" }).click();
  await page
    .locator('#contact textarea[name="message"]')
    .fill("این یک درخواست آزمایشی برای بررسی صندوق اپراتورها است.");
  const submit = page.locator('#contact button[type="submit"]');
  await expect(submit).toBeEnabled();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/forms/contact") && response.request().method() === "POST",
    { timeout: 15000 },
  );
  await submit.click();
  await responsePromise;
  await expect(page.getByText("درخواست شما ثبت شد")).toBeVisible({ timeout: 15000 });

  await page.goto("/admin/login");
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "پیشخوان مدیریت" })).toBeVisible();
  await page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "درخواست‌ها" }).click();
  await expect(page.getByRole("heading", { name: "درخواست‌های دریافتی" })).toBeVisible();
  await page.locator('input[name="q"]').fill(`e2e${stamp}@gmail.com`);
  await page.getByRole("button", { name: "فیلتر" }).click();
  await expect(page.getByText(lastName)).toBeVisible();
});

void operatorUnused;
