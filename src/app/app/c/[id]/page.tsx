import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getChallenge } from "@/lib/challenges";
import { DayPath } from "@/components/DayPath";
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
    <main className="shell wide">
      <DayPath
        id={c.id}
        total={c.lengthDays}
        initialDays={c.days}
        header={
          <>
            <div className="appbar" style={{ marginBottom: 0 }}>
              <Link href="/app" className="btn btn-ghost btn-sm" aria-label="Volver" style={{ fontSize: 20, color: "var(--text-faint)" }}>
                ✕
              </Link>
              <DeleteButton id={c.id} />
            </div>
            <h1 className="center" style={{ fontSize: 24 }}>{c.habit}</h1>
          </>
        }
        aside={
          rewards.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: 17, marginBottom: 10 }}>Tus recompensas</h2>
              {rewards.map((r, i) => (
                <div className="reward" key={i} style={i === 0 ? { borderTop: "none", paddingTop: 0 } : undefined}>
                  <span className="ico">{r.ico}</span>
                  <div>
                    <div className="t">{r.t}</div>
                    <div className="v">{r.v}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      />
    </main>
  );
}
