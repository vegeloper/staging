import { describe, expect, it } from "vitest";

import { defaultTheme, themeStyleVars } from "@/lib/site/defaults";
import { isSafeAssetPath, parseCopyright, parseTheme } from "@/lib/site/theme";

describe("site theme validation", () => {
  it("accepts the built-in theme and public asset paths", () => {
    expect(parseTheme(defaultTheme).success).toBe(true);
    expect(isSafeAssetPath("")).toBe(true);
    expect(isSafeAssetPath("/figma/logo.png")).toBe(true);
    expect(isSafeAssetPath("/videos/campainHero.mp4")).toBe(true);
    expect(isSafeAssetPath("/uploads/brand/hero.webp")).toBe(true);
    expect(isSafeAssetPath("/media/file/11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("rejects colors and paths that could change the stylesheet or leave the public folder", () => {
    expect(parseTheme({ ...defaultTheme, colors: { ...defaultTheme.colors, brand: "red" } }).success).toBe(false);
    expect(parseTheme({ ...defaultTheme, colors: { ...defaultTheme.colors, brand: "#00b7ceff" } }).success).toBe(false);
    expect(isSafeAssetPath("/figma/../.env")).toBe(false);
    expect(isSafeAssetPath('/figma/logo.png");body{background:red}')).toBe(false);
    expect(isSafeAssetPath("/figma/logo.png?x=1")).toBe(false);
    expect(isSafeAssetPath("https://example.com/logo.png")).toBe(false);
    expect(isSafeAssetPath("/etc/passwd")).toBe(false);
    expect(isSafeAssetPath("/media/file/not-a-uuid")).toBe(false);
    expect(isSafeAssetPath("/media/thumb/11111111-1111-4111-8111-111111111111")).toBe(false);
  });

  it("keeps copyright as plain text", () => {
    expect(parseCopyright({ text: "تمامی حقوق محفوظ است." }).success).toBe(true);
    expect(parseCopyright({ text: "<strong>دات وان</strong>" }).success).toBe(false);
    expect(parseCopyright({ text: " " }).success).toBe(false);
  });

  it("puts only validated tokens into the css variables", () => {
    const css = themeStyleVars({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, brand: "#112233" },
      background: { image: "/figma/sky.png" },
    });
    expect(css["--brand"]).toBe("#112233");
    expect(css["--page-image"]).toBe('url("/figma/sky.png")');
    expect(css["--page-image"]).not.toContain(";");
  });
});
