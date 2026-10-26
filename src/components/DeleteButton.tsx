"use client";
import { deleteChallengeAction } from "@/lib/actions";

export function DeleteButton({ id }: { id: string }) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--red)" }}
      onClick={() => {
        if (confirm("¿Eliminar este reto? No se puede deshacer.")) {
          deleteChallengeAction(id);
        }
      }}
    >
      Eliminar
    </button>
  );
}
