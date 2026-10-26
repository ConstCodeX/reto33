import { env, isDemo } from "./env";
import { rememberOtp } from "./otp-demo";

/**
 * Deliver a sign-in OTP. Three modes, chosen by OTP_DELIVERY:
 *  - demo   : log it + stash it so the UI can show it (no real email)
 *  - resend : send via the Resend HTTP API (needs RESEND_API_KEY)
 *  - smtp   : left as a hook (add nodemailer if you want this path)
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (isDemo) {
    rememberOtp(email, otp);
    console.log(`[OTP demo] ${email} -> ${otp}`);
    return;
  }

  if (env.otpDelivery === "resend") {
    if (!env.resendApiKey) throw new Error("RESEND_API_KEY is not set");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: email,
        subject: `Tu código de acceso: ${otp}`,
        html: otpEmailHtml(otp),
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    }
    return;
  }

  // smtp or unknown
  throw new Error(
    `OTP_DELIVERY="${env.otpDelivery}" not configured. Use "demo" or "resend".`,
  );
}

function otpEmailHtml(otp: string): string {
  return `<div style="font-family:-apple-system,system-ui,sans-serif;max-width:420px;margin:0 auto;padding:32px">
    <h2 style="margin:0 0 8px">Tu código de Reto 33</h2>
    <p style="color:#666;margin:0 0 24px">Introdúcelo para entrar. Caduca en 5 minutos.</p>
    <div style="font-size:34px;letter-spacing:10px;font-weight:700;text-align:center;
      background:#f4f4f5;border-radius:14px;padding:18px">${otp}</div>
  </div>`;
}
