"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) throw new Error(error.message || "No se pudo enviar el código");
      setStep("code");
      // Demo mode: reveal the code on screen.
      try {
        const r = await fetch(`/api/otp-peek?email=${encodeURIComponent(email)}`);
        const j = await r.json();
        if (j.demo && j.otp) setDemoCode(j.otp);
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error } = await authClient.signIn.emailOtp({ email, otp: code });
      if (error) throw new Error(error.message || "Código incorrecto");
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="stack gap-6 center" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 52 }}>◎</div>
        <h1>Reto 33</h1>
        <p className="muted" style={{ margin: 0 }}>
          Crea un hábito nuevo en 33 días.
        </p>
      </div>

      <div className="card stack gap-14">
        {step === "email" ? (
          <form onSubmit={sendCode} className="stack gap-14">
            <label className="field">
              <span>Tu email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button className="btn btn-primary" disabled={busy || !email}>
              {busy ? "Enviando…" : "Enviar código"}
            </button>
            <p className="muted center" style={{ fontSize: 12.5, margin: 0 }}>
              Sin contraseñas. Te mandamos un código de 6 dígitos.
            </p>
          </form>
        ) : (
          <form onSubmit={verify} className="stack gap-14">
            <label className="field">
              <span>Código enviado a {email}</span>
              <input
                className="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
            </label>
            {demoCode && (
              <div className="hint center">
                Modo demo — tu código es <b style={{ letterSpacing: 2 }}>{demoCode}</b>
              </div>
            )}
            <button className="btn btn-primary" disabled={busy || code.length < 6}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setStep("email");
                setCode("");
                setDemoCode(null);
                setError("");
              }}
            >
              Cambiar email
            </button>
          </form>
        )}
        {error && (
          <p className="center" style={{ color: "#ff453a", fontSize: 13, margin: 0 }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
