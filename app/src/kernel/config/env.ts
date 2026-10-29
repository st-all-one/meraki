export type AppEnv = "development" | "test" | "production";

function text(name: string, fallback: string): string {
  const value = Deno.env.get(name);
  return value === undefined || value === "" ? fallback : value;
}

function number(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function count(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function flag(name: string, fallback: boolean): boolean {
  const value = Deno.env.get(name);
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const appEnv = text("APP_ENV", "development") as AppEnv;

export const env = {
  appEnv,
  isProduction: appEnv === "production",
  isTest: appEnv === "test" || flag("MERAKI_TEST", false),
  appName: text("APP_NAME", "Meraki"),
  appUrl: text("APP_URL", "http://localhost:50300").replace(/\/$/, ""),
  host: text("HOST", "0.0.0.0"),
  port: number("PORT", 50300),
  trustProxyHops: count("TRUST_PROXY_HOPS", 0),
  dataPath: text("DATA_PATH", "./data"),
  dbPath: text("DB_PATH", "./data/meraki.sqlite3"),
  dbBusyTimeoutMs: number("DB_BUSY_TIMEOUT_MS", 5000),
  sessionCookie: text("SESSION_COOKIE", "meraki_session"),
  sessionTtlSeconds: number("SESSION_TTL_SECONDS", 604800),
  seedEmail: text("SEED_EMAIL", "admin@meraki.local"),
  seedPassword: text("SEED_PASSWORD", "troque-esta-senha"),
  rateLogin: number("RATE_LIMIT_LOGIN_PER_MINUTE", 5),
  rateChat: number("RATE_LIMIT_CHAT_PER_MINUTE", 30),
  rateUpload: number("RATE_LIMIT_UPLOAD_PER_MINUTE", 10),
  maxUploadBytes: number("MAX_UPLOAD_BYTES", 10 * 1024 * 1024),
  maxUploadFiles: number("MAX_UPLOAD_FILES", 3),
  maxChatBody: number("MAX_CHAT_BODY", 10000),
  vapidPublicKey: text("VAPID_PUBLIC_KEY", ""),
  vapidPrivateKey: text("VAPID_PRIVATE_KEY", ""),
  vapidSubject: text("VAPID_SUBJECT", "mailto:admin@meraki.local"),
} as const;

export function cookieOptions(maxAge: number): {
  httpOnly: true;
  sameSite: "Lax";
  secure: boolean;
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "Lax",
    secure: env.isProduction,
    path: "/",
    maxAge,
  };
}

export type Env = typeof env;
