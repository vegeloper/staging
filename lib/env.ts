import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().min(16).optional(),
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) =>
        value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
  DATABASE_SSL: z.enum(["disable", "require"]).default("disable"),
  APP_ORIGIN: z.string().url("APP_ORIGIN must be an absolute URL"),
  UPLOAD_ROOT: z.string().min(1, "UPLOAD_ROOT is required"),
  MEDIA_ROOT: z.string().min(1).default("data/media"),
  CLAMAV_HOST: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().min(1).optional(),
  ),
  CLAMAV_PORT: z.coerce.number().int().positive().default(3310),
  CLAMAV_SOCKET: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().min(1).optional(),
  ),
  MAX_RESUME_BYTES: z.coerce.number().int().positive().default(5_242_880),
  MAX_MEDIA_IMAGE_BYTES: z.coerce.number().int().positive().default(8_388_608),
  MAX_MEDIA_VIDEO_BYTES: z.coerce.number().int().positive().default(67_108_864),
  AUTH_PASSWORD_PEPPER: optionalSecret,
  PII_ENCRYPTION_KEY: optionalSecret,
  TRUST_PROXY: z.enum(["true", "false", "1", "0"]).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration. ${details}`);
  }

  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.AUTH_PASSWORD_PEPPER) {
      throw new Error("AUTH_PASSWORD_PEPPER is required in production");
    }
    if (!parsed.data.PII_ENCRYPTION_KEY) {
      throw new Error("PII_ENCRYPTION_KEY is required in production");
    }
    const host = new URL(parsed.data.APP_ORIGIN).hostname;
    const loopback = host === "localhost" || host === "127.0.0.1";
    if (!parsed.data.APP_ORIGIN.startsWith("https://") && !loopback) {
      throw new Error("APP_ORIGIN must use https in production");
    }
  }

  cached = parsed.data;
  return cached;
}

export function resetEnvCache() {
  cached = undefined;
}
