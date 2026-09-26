export function configuredOrigin(): string {
  const raw = process.env.APP_ORIGIN;
  if (!raw) {
    throw new Error("APP_ORIGIN is required");
  }
  return new URL(raw).origin;
}

function isLoopbackHttp(origin: string) {
  const url = new URL(origin);
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

function originMatchesConfigured(origin: string) {
  try {
    const configured = configuredOrigin();
    if (new URL(origin).origin === configured) return true;
    return (
      process.env.NODE_ENV !== "production" &&
      isLoopbackHttp(configured) &&
      isLoopbackHttp(origin)
    );
  } catch {
    return false;
  }
}

/**
 * Browser state-changing requests must come from APP_ORIGIN.
 * Compare against the configured public origin, not request.url, so this
 * still works behind Caddy/nginx where the container origin is http://app:3000.
 */
export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return request.method === "GET" || request.method === "HEAD";
  }
  return originMatchesConfigured(origin);
}

/**
 * Public JSON POSTs: a missing Origin is allowed (curl, server tests, old
 * clients). A present Origin must match APP_ORIGIN so a browser on another
 * site cannot submit the live forms.
 */
export function isAllowedFormOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return originMatchesConfigured(origin);
}
