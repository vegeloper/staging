import { expect, test } from "@playwright/test";

const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const creatorPassword = process.env.SEED_CREATOR_PASSWORD;
const operatorPassword = process.env.SEED_OPERATOR_PASSWORD;

test("content creator submits and the website admin publishes it", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(
    !adminPassword || !creatorPassword,
    "SEED_ADMIN_PASSWORD and SEED_CREATOR_PASSWORD are required",
  );

  const stamp = Date.now().toString();
  const title = `آزمایش تایید محتوا ${stamp}`;
  const slug = `e2e-review-${stamp}`;

  await page.goto("/admin/login");
  await page.getByLabel("نام کاربری").fill("creator");
  await page.getByLabel("رمز عبور").fill(creatorPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "مطالب و اخبار" })).toBeVisible();
  await expect(page.getByRole("link", { name: "درخواست‌ها" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "رسانه" })).toBeVisible();

  await page.getByRole("link", { name: "مطلب جدید" }).click();
  await page.getByLabel("عنوان").fill(title);
  await page.getByLabel("URL slug").fill(slug);
  await page.getByLabel("تاریخ نمایش").fill("امروز");
  await page.getByLabel("توضیح تصویر").fill("تصویر آزمایش گردش‌کار");
  await page.getByLabel("متن").fill("این مطلب آزمایشی است و فقط پس از تأیید مدیر باید در سایت دیده شود.");
  await page.getByRole("button", { name: "ارسال برای تأیید" }).click();
  await expect(page.getByText("وضعیت: در انتظار تأیید")).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/cms_creator_submitted.png",
    fullPage: true,
  });

  await page.goto("/blog");
  await expect(page.getByText(title)).toHaveCount(0);

  await page.goto("/admin/content");
  await page.getByRole("button", { name: "خروج" }).click();
  await expect(page.getByRole("heading", { name: "ورود کاربران داخلی" })).toBeVisible();

  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByRole("heading", { name: "پیشخوان مدیریت" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "درخواست‌ها" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "تم" })).toBeVisible();
  await page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "مطالب" }).click();
  await page.locator('input[name="q"]').fill(slug);
  await page.getByRole("button", { name: "فیلتر" }).click();
  await page.getByRole("link", { name: title }).click();
  await page.getByLabel("توضیح برای تولیدکننده محتوا").fill("یک جمله درباره منبع خبر اضافه شود.");
  await page.getByRole("button", { name: "رد کردن" }).click();
  await expect(page.getByText("وضعیت: رد شده")).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/cms_admin_rejected.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "خروج" }).click();
  await page.getByLabel("نام کاربری").fill("creator");
  await page.getByLabel("رمز عبور").fill(creatorPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await page.locator('input[name="q"]').fill(slug);
  await page.getByRole("button", { name: "فیلتر" }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByText("دلیل رد: یک جمله درباره منبع خبر اضافه شود.")).toBeVisible();
  await page.getByLabel("متن").fill(
    "این مطلب آزمایشی پس از اصلاح منبع داخلی دوباره برای تأیید مدیر ارسال شد.",
  );
  await page.getByRole("button", { name: "ارسال دوباره برای تأیید" }).click();
  await expect(page.getByText("وضعیت: در انتظار تأیید")).toBeVisible();

  await page.getByRole("button", { name: "خروج" }).click();
  await page.getByLabel("نام کاربری").fill("admin");
  await page.getByLabel("رمز عبور").fill(adminPassword!);
  await page.getByRole("button", { name: "ورود" }).click();
  await page.getByRole("navigation", { name: "بخش‌های مدیریت" }).getByRole("link", { name: "مطالب" }).click();
  await page.locator('input[name="q"]').fill(slug);
  await page.getByRole("button", { name: "فیلتر" }).click();
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "تأیید و انتشار" }).click();
  await expect(page.getByText("وضعیت: منتشر شده")).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/cms_admin_approved.png",
    fullPage: true,
  });

  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/cms_public_blog.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: title }).first().click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(
    page.getByText("این مطلب آزمایشی پس از اصلاح منبع داخلی دوباره برای تأیید مدیر ارسال شد."),
  ).toBeVisible();

  if (operatorPassword) {
    await page.goto("/admin");
    await page.getByRole("button", { name: "خروج" }).click();
    await page.goto("/admin/login");
    await page.getByLabel("نام کاربری").fill("operator");
    await page.getByLabel("رمز عبور").fill(operatorPassword);
    await page.getByRole("button", { name: "ورود" }).click();
    await expect(page.getByRole("heading", { name: "درخواست‌های دریافتی" })).toBeVisible();
    await expect(page.getByRole("link", { name: "مطالب" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "رسانه" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "تم" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "کپی‌رایت" })).toHaveCount(0);
    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { name: "درخواست‌های دریافتی" })).toBeVisible();
  }
});
