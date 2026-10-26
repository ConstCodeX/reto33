import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listChallenges, CHALLENGE_LENGTH } from "@/lib/challenges";
import { MiniRing } from "@/components/MiniRing";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const challenges = listChallenges(user.id);

  return (
    <main className="shell">
      <div className="appbar">
        <span className="brand">Reto&nbsp;<b>33</b></span>
        <SignOutButton />
      </div>

      {challenges.length === 0 ? (
        <div className="card center stack gap-14" style={{ padding: 32 }}>
          <div style={{ fontSize: 46 }}>◎</div>
          <h2>Empieza tu primer reto</h2>
          <p className="muted" style={{ margin: 0 }}>
            Elige un hábito y márcalo cada día. En 33 días lo habrás construido.
          </p>
          <Link href="/app/new" className="btn btn-primary" style={{ textAlign: "center" }}>
            Crear mi reto
          </Link>
        </div>
      ) : (
        <div className="grid-cards" style={{ paddingBottom: 90 }}>
          {challenges.map((c) => {
            const complete = c.done >= c.lengthDays;
            return (
              <Link key={c.id} href={`/app/c/${c.id}`} className="card row spread">
                <div className="stack gap-10" style={{ minWidth: 0 }}>
                  <h2 style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.habit}
                  </h2>
                  <span className={`pill ${complete ? "done" : ""}`}>
                    {complete ? "✓ ¡Completado!" : `Día ${c.done} de ${c.lengthDays}`}
                  </span>
                </div>
                <MiniRing done={c.done} total={c.lengthDays} />
              </Link>
            );
          })}
        </div>
      )}

      {challenges.length > 0 && (
        <Link href="/app/new" className="btn btn-primary fab" style={{ textAlign: "center" }}>
          ＋ Nuevo reto
        </Link>
      )}

      <p className="muted center" style={{ fontSize: 11, marginTop: 24 }}>
        Cada reto dura {CHALLENGE_LENGTH} días.
      </p>
    </main>
  );
}
