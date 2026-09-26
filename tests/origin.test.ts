import { afterEach, describe, expect, it } from "vitest";

import { isAllowedFormOrigin, isTrustedOrigin } from "@/lib/http/origin";

const originalOrigin = process.env.APP_ORIGIN;

afterEach(() => {
  process.env.APP_ORIGIN = originalOrigin;
});

function request(url: string, origin?: string, method = "POST") {
  const headers = origin ? { origin } : undefined;
  return new Request(url, { method, headers });
}

describe("origin checks", () => {
  it("accepts the configured public origin even when the container URL differs", () => {
    process.env.APP_ORIGIN = "https://trip.example.com";
    const req = request("http://app:3000/api/admin/submissions/1", "https://trip.example.com", "PATCH");
    expect(isTrustedOrigin(req)).toBe(true);
  });

  it("rejects a foreign browser origin", () => {
    process.env.APP_ORIGIN = "https://trip.example.com";
    const req = request("http://app:3000/api/forms/contact", "https://evil.example");
    expect(isAllowedFormOrigin(req)).toBe(false);
    expect(isTrustedOrigin(req)).toBe(false);
  });

  it("accepts another loopback port during local development", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";
    const req = request("http://localhost:3001/api/auth/login", "http://localhost:3001");
    expect(isAllowedFormOrigin(req)).toBe(process.env.NODE_ENV !== "production");
  });

  it("allows public JSON posts that omit Origin (curl / unit tests)", () => {
    process.env.APP_ORIGIN = "https://trip.example.com";
    const req = request("http://localhost/api/forms/contact");
    expect(isAllowedFormOrigin(req)).toBe(true);
  });
});
