// "Chispa", the app's flame mascot. Pure SVG, safe in server components.
export function Mascot({
  size = 96,
  mood = "happy",
  className,
}: {
  size?: number;
  mood?: "happy" | "party" | "sleepy";
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M50 6c6 14 26 24 30 46 4 24-12 42-30 42S16 76 20 54c2-12 10-18 12-28 8 6 10 14 10 14S40 22 50 6z"
        fill="#ff9600"
      />
      <path
        d="M50 34c4 10 18 16 18 32 0 14-8 22-18 22s-18-8-18-22c0-8 6-12 8-18 4 4 6 8 6 8s0-12 4-22z"
        fill="#ffc800"
      />
      {mood === "sleepy" ? (
        <>
          <path d="M37 62q5 4 10 0M53 62q5 4 10 0" stroke="#4b4b4b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="42" cy="61" rx="5" ry="6.5" fill="#fff" />
          <ellipse cx="58" cy="61" rx="5" ry="6.5" fill="#fff" />
          <circle cx="43" cy="62" r="3" fill="#3c3c3c" />
          <circle cx="59" cy="62" r="3" fill="#3c3c3c" />
        </>
      )}
      {mood === "party" ? (
        <path d="M42 72q8 10 16 0z" fill="#ea2b2b" />
      ) : (
        <path d="M44 73q6 5 12 0" stroke="#3c3c3c" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      <circle cx="35" cy="70" r="3.5" fill="#ff4b4b" opacity=".35" />
      <circle cx="65" cy="70" r="3.5" fill="#ff4b4b" opacity=".35" />
    </svg>
  );
}
