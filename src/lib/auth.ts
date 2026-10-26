import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { env } from "./env";
import { sendOtpEmail } from "./email";

export const auth = betterAuth({
  appName: "Reto 33",
  baseURL: env.appUrl,
  secret: env.authSecret,
  database: db,
  // Sign-in by email code only. First valid code for a new email creates the
  // account automatically — "anyone can register and try it".
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 5,
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});
