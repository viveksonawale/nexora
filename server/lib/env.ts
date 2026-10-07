import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  API_BASE_PATH: z.string().default("/api/v1"),
  
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  COOKIE_DOMAIN: z.string(),
  PASSWORD_HASH_COST: z.coerce.number().default(12),
  
  STORAGE_PROVIDER: z.enum(["s3", "local"]).default("s3"),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_PUBLIC_BASE_URL: z.string().optional(),
  UPLOAD_MAX_AVATAR_BYTES: z.coerce.number().default(2097152),
  UPLOAD_MAX_MEDIA_BYTES: z.coerce.number().default(10485760),
  UPLOAD_PRESIGN_TTL_SECONDS: z.coerce.number().default(300),
  
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  EMAIL_FROM: z.string(),
  
  CRON_SECRET: z.string().min(16),
  
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().default(10),
  RATE_LIMIT_API_PER_MINUTE: z.coerce.number().default(120),
  
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string(),
  
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
