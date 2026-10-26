"use client";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { markNextAction, toggleDayAction } from "@/lib/actions";
import { Mascot } from "./Mascot";

// Days that show a chest/trophy on the path instead of a plain node.
const MILESTONES: Record<number, string> = { 11: "🎁", 22: "🌱", 33: "🏆" };

// Horizontal offset of each node so the path winds like a lesson map.
function offset(i: number) {
  return Math.round(Math.sin(i * 0.9) * 70);
}

/** Lesson-style path of the challenge's days. */
export function DayPath({
  id,
  total,
  initialDays,
  header,
  aside,
}: {
  id: string;
  total: number;
  initialDays: number[];
  header?: ReactNode;
  aside?: ReactNode;
}) {
  const [days, setDays] = useState<Set<number>>(new Set(initialDays));
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const nextRef = useRef<HTMLButtonElement>(null);

  const done = days.size;
  const complete = done >= total;
  const nextDay = useMemo(() => {
    for (let d = 1; d <= total; d++) if (!days.has(d)) return d;
    return null;
  }, [days, total]);

  // Bring today's node into view on open, like resuming a lesson map.
  useEffect(() => {
    nextRef.current?.scrollIntoView({ block: "center" });
  }, []);

  function cheer(day: number) {
    const text = MILESTONES[day] ? `${MILESTONES[day]} ¡Hito desbloqueado!` : "🔥 +10 XP";
    setToast({ key: Date.now(), text });
  }

  function toggle(day: number) {
    if (navigator.vibrate) navigator.vibrate(8);
    const adding = !days.has(day);
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
    if (adding) cheer(day);
    startTransition(() => {
      toggleDayAction(id, day);
    });
  }

  function markToday() {
    if (nextDay == null) return;
    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
    setDays((prev) => new Set(prev).add(nextDay));
    cheer(nextDay);
    startTransition(() => {
      markNextAction(id);
    });
  }

  return (
    <div className="cl">
      {toast && <div key={toast.key} className="toast">{toast.text}</div>}

      <div className="cl-side">
        <div className="cl-head stack gap-20">
          {header}
          <div className="row gap-14">
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <i style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <span className={`stat fire ${done ? "" : "off"}`}>🔥 {done}</span>
          </div>

          <div className={`unit ${complete ? "complete" : ""}`}>
            <small>{complete ? "Reto completado" : `Día ${nextDay} de ${total}`}</small>
            <b>{complete ? "¡Lo lograste! 🏆" : done === 0 ? "¡Empieza tu racha hoy!" : "¡Sigue así, vas genial!"}</b>
          </div>
        </div>

        <div className="dock">
          <div className="dock-inner">
            {complete ? (
              <div className="row gap-14 celebrate" style={{ justifyContent: "center" }}>
                <Mascot size={56} mood="party" />
                <div className="stack" style={{ textAlign: "left" }}>
                  <span style={{ fontSize: 18 }}>¡Reto completado!</span>
                  <span style={{ opacity: 0.9, fontSize: 14 }}>33 días. Lo lograste.</span>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={markToday} disabled={nextDay == null}>
                Marcar día {nextDay}
              </button>
            )}
            <p className="muted center" style={{ fontSize: 12, margin: "10px 0 0" }}>
              Toca cualquier día del camino para ajustarlo.
            </p>
          </div>
        </div>

        {aside && <div className="cl-aside">{aside}</div>}
      </div>

      <div className="path">
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const on = days.has(day);
          const isNext = day === nextDay;
          const icon = MILESTONES[day];
          const cls = ["node", on && "done", isNext && "next", icon && "milestone"]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={day} className="path-step" style={{ ["--o" as string]: offset(i) }}>
              <button
                ref={isNext ? nextRef : undefined}
                className={cls}
                onClick={() => toggle(day)}
                aria-label={`Día ${day}${on ? ", hecho" : ""}`}
                aria-pressed={on}
              >
                {isNext && <span className="start-tag">Hoy</span>}
                {icon ?? (on ? "✓" : isNext ? "★" : "")}
                <span className="num">{day}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
