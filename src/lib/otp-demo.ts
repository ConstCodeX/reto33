// In-memory store of the most recent OTP per email, used ONLY in demo mode so
// the sign-in screen can show the code without a real inbox. Never enabled when
// OTP_DELIVERY is resend/smtp.

const g = globalThis as unknown as {
  __otpDemo?: Map<string, { otp: string; exp: number }>;
};
const store = g.__otpDemo ?? (g.__otpDemo = new Map());

export function rememberOtp(email: string, otp: string, ttlMs = 5 * 60_000) {
  store.set(email.toLowerCase(), { otp, exp: Date.now() + ttlMs });
}

export function peekOtp(email: string): string | null {
  const e = store.get(email.toLowerCase());
  if (!e) return null;
  if (Date.now() > e.exp) {
    store.delete(email.toLowerCase());
    return null;
  }
  return e.otp;
}
