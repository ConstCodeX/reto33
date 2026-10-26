"use client";
import { useEffect, useState } from "react";
import {
  disableRemindersAction,
  enableRemindersAction,
  testReminderAction,
  updateReminderTimeAction,
} from "@/lib/actions";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return (
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Card to turn daily push reminders on/off on this device. */
export function Reminders({ publicKey, savedTime }: { publicKey: string; savedTime: string | null }) {
  const [status, setStatus] = useState<Status>("loading");
  const [time, setTime] = useState(savedTime ?? "20:00");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    (async () => {
      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return setStatus(isIos() && !isStandalone() ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub && savedTime ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, [savedTime]);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await enableRemindersAction(json, time, tz());
      setStatus("on");
      setMsg("¡Listo! Te avisaré cada día a esta hora.");
    } catch {
      setMsg("No se pudieron activar los avisos. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await disableRemindersAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function changeTime(t: string) {
    setTime(t);
    if (status === "on" && /^\d{2}:\d{2}$/.test(t)) await updateReminderTimeAction(t, tz());
  }

  async function test() {
    setBusy(true);
    try {
      const n = await testReminderAction();
      setMsg(n > 0 ? "Aviso de prueba enviado 📲" : "No hay dispositivos activos. Vuelve a activarlos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card stack gap-14">
      <div className="row spread">
        <div className="row gap-10">
          <span className="reminder-ico">🔔</span>
          <div className="stack">
            <h2 style={{ fontSize: 17 }}>Recordatorio diario</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {status === "on" ? "Activado en este dispositivo" : "Avisos en tu móvil"}
            </span>
          </div>
        </div>
        {(status === "on" || status === "off") && (
          <input
            type="time"
            aria-label="Hora del recordatorio"
            value={time}
            onChange={(e) => changeTime(e.target.value)}
            style={{ width: 118, padding: "9px 10px", textAlign: "center" }}
          />
        )}
      </div>

      {status === "off" && (
        <button className="btn btn-blue" onClick={enable} disabled={busy}>
          {busy ? "Activando…" : "Activar avisos"}
        </button>
      )}
      {status === "on" && (
        <div className="row gap-10">
          <button className="btn" onClick={test} disabled={busy}>Probar</button>
          <button className="btn" onClick={disable} disabled={busy} style={{ ["--c" as string]: "var(--red)" }}>
            Desactivar
          </button>
        </div>
      )}
      {status === "ios-install" && (
        <p className="hint" style={{ margin: 0 }}>
          En iPhone, primero añade la app a tu pantalla de inicio: toca <b>Compartir</b> →{" "}
          <b>Añadir a pantalla de inicio</b>, ábrela desde ahí y activa los avisos.
        </p>
      )}
      {status === "denied" && (
        <p className="hint" style={{ margin: 0 }}>
          Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.
        </p>
      )}
      {status === "unsupported" && (
        <p className="hint" style={{ margin: 0 }}>Este navegador no admite notificaciones push.</p>
      )}
      {msg && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{msg}</p>}
    </div>
  );
}
