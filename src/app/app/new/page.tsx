import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createChallengeAction } from "@/lib/actions";
import { HabitPicker } from "@/components/HabitPicker";
import { Mascot } from "@/components/Mascot";

export const dynamic = "force-dynamic";

export default async function NewChallenge() {
  await requireUser();
  return (
    <main className="shell">
      <div className="appbar">
        <Link href="/app" className="btn btn-ghost btn-sm" aria-label="Cerrar" style={{ fontSize: 20, color: "var(--text-faint)" }}>
          ✕
        </Link>
        <div className="bar"><i style={{ width: "10%" }} /></div>
      </div>

      <form action={createChallengeAction} className="stack gap-20">
        <div className="row gap-14">
          <Mascot size={72} />
          <div className="bubble">¿Qué hábito quieres construir?</div>
        </div>

        <HabitPicker />

        <div className="card stack gap-14">
          <h2 style={{ fontSize: 17 }}>Tus recompensas <span className="muted">(opcional)</span></h2>
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
