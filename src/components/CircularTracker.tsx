"use client";
import { useMemo, useState, useTransition } from "react";
import { markNextAction, toggleDayAction } from "@/lib/actions";

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export function CircularTracker({
  id,
  total,
  initialDays,
}: {
  id: string;
  total: number;
  initialDays: number[];
}) {
  const [days, setDays] = useState<Set<number>>(new Set(initialDays));
  const [, startTransition] = useTransition();

  const done = days.size;
  const complete = done >= total;
  const nextDay = useMemo(() => {
    for (let d = 1; d <= total; d++) if (!days.has(d)) return d;
    return null;
  }, [days, total]);

  function toggle(day: number) {
    if (navigator.vibrate) navigator.vibrate(8);
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
    startTransition(() => {
      toggleDayAction(id, day);
    });
  }

  function markToday() {
    if (nextDay == null) return;
    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
    setDays((prev) => new Set(prev).add(nextDay));
    startTransition(() => {
      markNextAction(id);
    });
  }

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 132;
  const step = 360 / total;
  const gap = total > 24 ? 2.2 : 3.2;

  return (
    <div className="stack gap-20" style={{ alignItems: "center" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
        <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} de ${total} días`}>
          <defs>
            <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--accent-2)" />
            </linearGradient>
          </defs>
          {Array.from({ length: total }, (_, i) => {
            const day = i + 1;
            const on = days.has(day);
            const isNext = day === nextDay;
            const start = i * step + gap / 2;
            const end = (i + 1) * step - gap / 2;
            return (
              <path
                key={day}
                d={arcPath(cx, cy, r, start, end)}
                stroke={on ? (complete ? "var(--good)" : "url(#ringgrad)") : "var(--fill-2)"}
                strokeWidth={on ? 20 : 14}
                strokeLinecap="round"
                fill="none"
                opacity={on ? 1 : isNext ? 0.85 : 0.5}
                style={{ cursor: "pointer", transition: "stroke-width .15s ease, opacity .15s ease" }}
                onClick={() => toggle(day)}
              />
            );
          })}
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central"
            fontSize={62} fontWeight={760} fill="var(--text)" letterSpacing="-2">
            {done}
          </text>
          <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central"
            fontSize={17} fontWeight={560} fill="var(--text-dim)">
            de {total} días
          </text>
        </svg>
      </div>

      {complete ? (
        <div className="celebrate stack gap-6">
          <div style={{ fontSize: 34 }}>🏆</div>
          <b style={{ fontSize: 18 }}>¡Reto completado!</b>
          <span style={{ opacity: 0.9, fontSize: 13 }}>33 días. Lo lograste.</span>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={markToday} disabled={nextDay == null}>
          Marcar día {nextDay} ✓
        </button>
      )}
      <p className="muted center" style={{ fontSize: 12, margin: 0 }}>
        Toca cualquier día del círculo para ajustarlo.
      </p>
    </div>
  );
}
