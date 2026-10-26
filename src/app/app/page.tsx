import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listChallenges, CHALLENGE_LENGTH } from "@/lib/challenges";
import { MiniRing } from "@/components/MiniRing";
import { Mascot } from "@/components/Mascot";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const challenges = listChallenges(user.id);
  const totalDays = challenges.reduce((n, c) => n + c.done, 0);
  const trophies = challenges.filter((c) => c.done >= c.lengthDays).length;

  return (
    <main className="shell">
      <div className="appbar">
        <span className="brand">reto33</span>
        <div className="row gap-14">
          <span className={`stat fire ${totalDays ? "" : "off"}`}>🔥 {totalDays}</span>
          <span className={`stat xp ${totalDays ? "" : "off"}`}>⚡ {totalDays * 10}</span>
          <span className={`stat ${trophies ? "" : "off"}`} style={{ color: "var(--gold-edge)" }}>
            🏆 {trophies}
          </span>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="stack gap-20" style={{ alignItems: "center", paddingTop: 24 }}>
          <div className="row gap-14">
            <Mascot size={100} mood="sleepy" />
            <div className="bubble">¡Despiértame con tu primer reto!</div>
          </div>
          <div className="card center stack gap-14" style={{ width: "100%" }}>
            <h2>Empieza tu primer reto</h2>
            <p className="muted" style={{ margin: 0 }}>
              Elige un hábito y márcalo cada día. En 33 días lo habrás construido.
            </p>
            <Link href="/app/new" className="btn btn-primary">
              Crear mi reto
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid-cards" style={{ paddingBottom: 90 }}>
          {challenges.map((c) => {
            const complete = c.done >= c.lengthDays;
            return (
              <Link key={c.id} href={`/app/c/${c.id}`} className="card">
                <div className="row spread">
                  <div className="stack gap-10" style={{ minWidth: 0, flex: 1 }}>
                    <h2 style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.habit}
                    </h2>
                    <div className="row gap-10">
                      <div className={`bar ${complete ? "gold" : ""}`}>
                        <i style={{ width: `${(c.done / c.lengthDays) * 100}%` }} />
                      </div>
                    </div>
                    <span>
                      <span className={`pill ${complete ? "done" : ""}`}>
                        {complete ? "✓ ¡Completado!" : `Día ${c.done} de ${c.lengthDays}`}
                      </span>
                    </span>
                  </div>
                  <MiniRing done={c.done} total={c.lengthDays} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {challenges.length > 0 && (
        <Link href="/app/new" className="btn btn-primary fab">
          ＋ Nuevo reto
        </Link>
      )}

      <div className="row spread" style={{ marginTop: 24 }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Cada reto dura {CHALLENGE_LENGTH} días.
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
