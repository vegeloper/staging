import { describe, expect, it } from "vitest";

import { destinationForRole, homePathForRole } from "@/lib/auth/rbac";

describe("admin destinations", () => {
  it("sends each role to its own home and keeps admin on every console path", () => {
    expect(homePathForRole("admin")).toBe("/admin");
    expect(homePathForRole("operator")).toBe("/admin/submissions");
    expect(homePathForRole("content_creator")).toBe("/admin/content");

    expect(destinationForRole("admin", "/admin/theme")).toBe("/admin/theme");
    expect(destinationForRole("admin", "/admin/copyright")).toBe("/admin/copyright");
    expect(destinationForRole("admin", "/admin/content/new")).toBe("/admin/content/new");
    expect(destinationForRole("operator", "/admin")).toBe("/admin/submissions");
    expect(destinationForRole("operator", "/admin/submissions/abc")).toBe("/admin/submissions/abc");
    expect(destinationForRole("operator", "/admin/content")).toBe("/admin/submissions");
    expect(destinationForRole("content_creator", "/admin/theme")).toBe("/admin/content");
    expect(destinationForRole("content_creator", "/admin/media")).toBe("/admin/media");
    expect(destinationForRole("content_creator", "/admin/media/abc")).toBe("/admin/media/abc");
    expect(destinationForRole("operator", "/admin/media")).toBe("/admin/submissions");
    expect(destinationForRole("content_creator", "/administrator")).toBe("/admin/content");
  });
});
