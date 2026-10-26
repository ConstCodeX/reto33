import nodemailer from "nodemailer";
import { env, isDemo } from "./env";
import { rememberOtp } from "./otp-demo";

/**
 * Deliver a sign-in OTP. Three modes, chosen by OTP_DELIVERY:
 *  - demo   : log it + stash it so the UI can show it (no real email)
 *  - resend : send via the Resend HTTP API (needs RESEND_API_KEY)
 *  - smtp   : send via any SMTP server (needs SMTP_HOST, SMTP_USER, SMTP_PASS)
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (isDemo) {
    rememberOtp(email, otp);
    console.log(`[OTP demo] ${email} -> ${otp}`);
    return;
  }

  const subject = `${otp} es tu código de Reto 33`;
  const text = `Tu código de Reto 33 es ${otp}. Caduca en 5 minutos.`;

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
        subject,
        text,
        html: otpEmailHtml(otp),
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    }
    return;
  }

  if (env.otpDelivery === "smtp") {
    if (!env.smtp.host) throw new Error("SMTP_HOST is not set");
    await smtpTransport().sendMail({
      from: env.emailFrom,
      to: email,
      subject,
      text,
      html: otpEmailHtml(otp),
    });
    return;
  }

  throw new Error(
    `OTP_DELIVERY="${env.otpDelivery}" not supported. Use "demo", "resend" or "smtp".`,
  );
}

let transport: nodemailer.Transporter | undefined;
function smtpTransport() {
  return (transport ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  }));
}

function otpEmailHtml(otp: string): string {
  return `<div style="background:#f7f7f7;padding:32px 12px;font-family:'Nunito',-apple-system,system-ui,sans-serif">
  <div style="max-width:420px;margin:0 auto;background:#fff;border:2px solid #e5e5e5;border-radius:20px;padding:32px;text-align:center">
    <div style="font-size:48px;line-height:1">🔥</div>
    <h2 style="margin:12px 0 6px;color:#3c3c3c;font-size:24px;font-weight:800">¡Tu código está listo!</h2>
    <p style="color:#777;margin:0 0 24px;font-size:16px">Introdúcelo en Reto 33 para seguir con tu racha. Caduca en 5 minutos.</p>
    <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#58a700;
      background:#d7ffb8;border:2px solid #58cc02;border-radius:16px;padding:18px">${otp}</div>
    <p style="color:#afafaf;margin:24px 0 0;font-size:13px">Si no pediste este código, ignora este correo.</p>
  </div>
</div>`;
}
