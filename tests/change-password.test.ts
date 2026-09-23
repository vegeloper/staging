import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "@/lib/auth/change-password";

describe("change password input", () => {
  it("accepts a new password that matches its confirmation", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "current-password",
      newPassword: "a-new-password",
      confirmPassword: "a-new-password",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a short password, a mismatch, and a repeat of the current password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "current-password",
        newPassword: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "current-password",
        newPassword: "a-new-password",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "current-password",
        newPassword: "current-password",
        confirmPassword: "current-password",
      }).success,
    ).toBe(false);
  });
});