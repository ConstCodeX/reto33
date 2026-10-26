// Pure presentational progress ring (safe in server components).
export function MiniRing({
  done,
  total,
  size = 64,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(done / total, 1) : 0;
  const complete = done >= total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--locked)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={complete ? "var(--gold)" : "var(--green)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={complete ? size * 0.36 : size * 0.3}
        fontWeight={800}
        fill="var(--text-strong)"
      >
        {complete ? "🏆" : done}
      </text>
    </svg>
  );
}
