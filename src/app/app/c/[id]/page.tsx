import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getChallenge } from "@/lib/challenges";
import { CircularTracker } from "@/components/CircularTracker";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const c = getChallenge(id, user.id);
  if (!c) notFound();

  const rewards = [
    { ico: "🎁", t: "Recompensa tangible", v: c.rewardTangible },
    { ico: "🌱", t: "Crecimiento interno", v: c.rewardIntangible },
    { ico: "🏆", t: "Gran recompensa final", v: c.rewardGrand },
  ].filter((r) => r.v);

  return (
    <main className="shell stack gap-20">
      <div className="appbar" style={{ marginBottom: 2 }}>
        <Link href="/app" className="btn btn-ghost btn-sm">‹ Retos</Link>
        <DeleteButton id={c.id} />
      </div>

      <div className="center stack gap-6">
        <h1 style={{ fontSize: 26 }}>{c.habit}</h1>
      </div>

      <CircularTracker id={c.id} total={c.lengthDays} initialDays={c.days} />

      {rewards.length > 0 && (
        <div className="card">
          {rewards.map((r, i) => (
            <div className="reward" key={i} style={i === 0 ? { borderTop: "none", paddingTop: 2 } : undefined}>
              <span className="ico">{r.ico}</span>
              <div>
                <div className="t">{r.t}</div>
                <div className="v">{r.v}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
