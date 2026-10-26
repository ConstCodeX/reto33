"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "./session";
import {
  createChallenge,
  deleteChallenge,
  markNext,
  toggleDay,
} from "./challenges";

export async function createChallengeAction(formData: FormData) {
  const user = await requireUser();
  const habit = String(formData.get("habit") || "").trim();
  if (!habit) return;
  const id = createChallenge(user.id, {
    habit,
    tangible: String(formData.get("tangible") || ""),
    intangible: String(formData.get("intangible") || ""),
    grand: String(formData.get("grand") || ""),
  });
  revalidatePath("/app");
  redirect(`/app/c/${id}`);
}

export async function toggleDayAction(challengeId: string, day: number) {
  const user = await requireUser();
  toggleDay(challengeId, user.id, day);
  revalidatePath(`/app/c/${challengeId}`);
  revalidatePath("/app");
}

export async function markNextAction(challengeId: string) {
  const user = await requireUser();
  markNext(challengeId, user.id);
  revalidatePath(`/app/c/${challengeId}`);
  revalidatePath("/app");
}

export async function deleteChallengeAction(challengeId: string) {
  const user = await requireUser();
  deleteChallenge(challengeId, user.id);
  revalidatePath("/app");
  redirect("/app");
}
