import { expect, test } from "@playwright/test";

const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const operatorPassword = process.env.SEED_OPERATOR_PASSWORD;
const creatorPassword = process.env.SEED_CREATOR_PASSWORD;

test("admin publishes a position directly and an operator proposal needs approval", async ({
  page,
}) => {
  test.setTimeout(180_000);
  test.skip(
    !adminPassword || !operatorPassword,
    "SEED_ADMIN_PASSWORD and SEED_OPERATOR_PASSWORD are required",
  );

  const stamp = Date.now().toString();
  const title = `کارشناس آزمایش ${stamp}`;
  const slug = `e2e-role-${stamp}`;
  const editedTitle = `کارشناس آزمایش اصلاح‌شده ${stamp}`;

  await page.goto("/admin/login");
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "پیشخوان مدیریت" })).toBeVisible();

  await page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "موقعیت‌های شغلی" }).click();
  await expect(page.getByRole("heading", { name: "موقعیت‌های شغلی" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "رزومه‌ها و درخواست‌ها" })).toBeVisible();
  await page.getByRole("link", { name: "موقعیت جدید" }).click();
  await page.getByLabel("عنوان").fill(title);
  await page.getByLabel("نشانی").fill(slug);
  await page.getByLabel("خلاصه").fill("این موقعیت آزمایشی باید بدون صف تأیید در سایت دیده شود.");
  await expect(page.getByRole("button", { name: "ارسال برای تأیید" })).toHaveCount(0);
  await page.getByRole("button", { name: "انتشار" }).click();
  await expect(page.getByText("وضعیت: منتشر شده")).toBeVisible();

  await page.goto(`/join-us/organizational/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.goto("/admin/positions");
  await page.getByRole("button", { name: "خروج" }).click();
  await expect(page.getByRole("heading", { name: "ورود کاربران داخلی" })).toBeVisible();
  await page.getByLabel("نام کاربری").fill("operator");
  await page.getByLabel("رمز عبور").fill(operatorPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "درخواست‌های دریافتی" })).toBeVisible();
  await page.getByRole("tab", { name: "موقعیت‌های شغلی" }).click();
  await expect(page.getByRole("heading", { name: "موقعیت‌های شغلی" })).toBeVisible();
  await expect(page.getByRole("link", { name: "مطالب" })).toHaveCount(0);

  await page.locator('input[name="q"]').fill(slug);
  await page.getByRole("button", { name: "فیلتر" }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("button", { name: "ذخیره تغییرات" })).toHaveCount(0);
  await page.getByRole("button", { name: "پیشنهاد ویرایش" }).click();
  await expect(page.getByText("وضعیت: پیش‌نویس")).toBeVisible();
  await page.getByLabel("عنوان").fill(editedTitle);
  await page.getByRole("button", { name: "ارسال برای تأیید" }).click();
  await expect(page.getByText("وضعیت: در انتظار تأیید")).toBeVisible();

  await page.goto(`/join-us/organizational/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("heading", { name: editedTitle })).toHaveCount(0);

  await page.goto("/admin/positions");
  await page.getByRole("button", { name: "خروج" }).click();
  await expect(page.getByRole("heading", { name: "ورود کاربران داخلی" })).toBeVisible();
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "موقعیت‌های شغلی" }).click();
  await page.getByRole("link", { name: "صف تأیید" }).click();
  await page.getByRole("link", { name: editedTitle }).click();
  await page.getByLabel("توضیح برای اپراتور").fill("عنوان هنوز دقیق نیست.");
  await page.getByRole("button", { name: "رد کردن" }).click();
  await expect(page.getByText("وضعیت: رد شده")).toBeVisible();

  await page.getByRole("button", { name: "خروج" }).click();
  await expect(page.getByRole("heading", { name: "ورود کاربران داخلی" })).toBeVisible();
  await page.getByLabel("نام کاربری").fill("operator");
  await page.getByLabel("رمز عبور").fill(operatorPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "درخواست‌های دریافتی" })).toBeVisible();
  await page.getByRole("tab", { name: "موقعیت‌های شغلی" }).click();
  await expect(page.getByRole("heading", { name: "موقعیت‌های شغلی" })).toBeVisible();
  await page.locator('input[name="q"]').fill(slug);
  await page.getByRole("button", { name: "فیلتر" }).click();
  await page.getByRole("link", { name: editedTitle }).click();
  await expect(page.getByText("دلیل رد: عنوان هنوز دقیق نیست.")).toBeVisible();
  await page.getByLabel("خلاصه").fill("خلاصه پس از اصلاح برای تأیید دوباره ارسال شد و باید بعد از تأیید مدیر دیده شود.");
  await page.getByRole("button", { name: "ارسال دوباره برای تأیید" }).click();
  await expect(page.getByText("وضعیت: در انتظار تأیید")).toBeVisible();

  await page.getByRole("button", { name: "خروج" }).click();
  await expect(page.getByRole("heading", { name: "ورود کاربران داخلی" })).toBeVisible();
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "موقعیت‌های شغلی" }).click();
  await page.getByRole("link", { name: "صف تأیید" }).click();
  await page.getByRole("link", { name: editedTitle }).click();
  await page.getByRole("button", { name: "تأیید و انتشار" }).click();
  await expect(page.getByText("وضعیت: منتشر شده")).toBeVisible();
  await expect(page.getByRole("heading", { name: editedTitle }).first()).toBeVisible();

  await page.goto(`/join-us/organizational/${slug}`);
  await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

  if (creatorPassword) {
    await page.goto("/admin/positions");
    await page.getByRole("button", { name: "خروج" }).click();
    await expect(page.getByRole("heading", { name: "ورود کاربران داخلی" })).toBeVisible();
    await page.getByLabel("نام کاربری").fill("creator");
    await page.getByLabel("رمز عبور").fill(creatorPassword);
    await page.getByRole("button", { name: "ورود" }).click();
    await expect(page.getByRole("heading", { name: "مطالب و اخبار" })).toBeVisible();
    await expect(page.getByRole("link", { name: "موقعیت‌های شغلی" })).toHaveCount(0);
    await page.goto("/admin/positions");
    await expect(page.getByRole("heading", { name: "مطالب و اخبار" })).toBeVisible();
  }
});
