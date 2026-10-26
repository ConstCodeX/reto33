// Runtime configuration. Everything has a safe default so the app boots in
// demo mode with zero setup; set these in production (Dokploy env).

export const env = {
  // Public origin. Used as better-auth baseURL. In the browser we fall back to
  // window.location at runtime, so this matters mainly on the server.
  appUrl: process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000",

  // Secret for better-auth. MUST be set in production.
  authSecret:
    process.env.BETTER_AUTH_SECRET || "dev-insecure-secret-change-me-please-32++",

  // SQLite location. Put on a persistent volume in production.
  dbPath: process.env.DATABASE_PATH || "./data/reto33.db",

  // OTP delivery: "demo" (show code on screen), "resend", or "smtp".
  otpDelivery: (process.env.OTP_DELIVERY || "demo").toLowerCase(),

  // Resend (only used when OTP_DELIVERY=resend). EMAIL_FROM is also used by smtp.
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Reto 33 <onboarding@resend.dev>",

  // SMTP (only used when OTP_DELIVERY=smtp). Port 465 implies TLS.
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE || String(process.env.SMTP_PORT === "465")) === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

export const isDemo = env.otpDelivery === "demo";
