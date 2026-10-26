"use client";
import { useState } from "react";

const SUGGESTIONS = [
  "📚 Leer 10 minutos",
  "🧘 Meditar",
  "🏃 Correr",
  "💧 Beber 2 L de agua",
  "✍️ Escribir un diario",
  "🗣️ Practicar un idioma",
  "🛏️ Dormir antes de las 23h",
  "📵 Una hora sin móvil",
];

/** Habit input with tappable suggestion chips. */
export function HabitPicker() {
  const [habit, setHabit] = useState("");
  return (
    <div className="stack gap-14">
      <label className="field">
        <span>Mi nuevo hábito</span>
        <input
          name="habit"
          placeholder="Ej. Leer 10 minutos, meditar, correr…"
          maxLength={80}
          required
          autoFocus
          value={habit}
          onChange={(e) => setHabit(e.target.value)}
        />
      </label>
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${habit === s ? "on" : ""}`}
            onClick={() => setHabit(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
