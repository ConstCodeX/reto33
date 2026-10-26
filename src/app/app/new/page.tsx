import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createChallengeAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NewChallenge() {
  await requireUser();
  return (
    <main className="shell">
      <div className="appbar">
        <Link href="/app" className="btn btn-ghost btn-sm">‹ Atrás</Link>
        <span className="brand">Nuevo reto</span>
        <span style={{ width: 54 }} />
      </div>

      <form action={createChallengeAction} className="stack gap-20">
        <div className="card stack gap-14">
          <label className="field">
            <span>Mi nuevo hábito</span>
            <input
              name="habit"
              placeholder="Ej. Leer 10 minutos, meditar, correr…"
              maxLength={80}
              required
              autoFocus
            />
          </label>
        </div>

        <div className="card stack gap-14">
          <p className="muted" style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 560 }}>
            Tus recompensas (opcional)
          </p>
          <label className="field">
            <span>🎁 Recompensa tangible</span>
            <input name="tangible" placeholder="Un capricho físico al terminar" maxLength={140} />
          </label>
          <label className="field">
            <span>🌱 Crecimiento interno</span>
            <input name="intangible" placeholder="Cómo te quieres sentir" maxLength={140} />
          </label>
          <label className="field">
            <span>🏆 Gran recompensa final</span>
            <input name="grand" placeholder="El gran premio al día 33" maxLength={140} />
          </label>
        </div>

        <button className="btn btn-primary" type="submit">Empezar el reto</button>
      </form>
    </main>
  );
}
