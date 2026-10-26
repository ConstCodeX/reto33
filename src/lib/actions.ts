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
import {
  removeSubscription,
  saveSubscription,
  sendToUser,
  setReminder,
  type PushSubscriptionJSON,
} from "./push";

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

export async function enableRemindersAction(
  sub: PushSubscriptionJSON,
  time: string,
  tz: string,
) {
  const user = await requireUser();
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) {
    throw new Error("Suscripción inválida");
  }
  saveSubscription(user.id, sub);
  setReminder(user.id, time, tz);
  revalidatePath("/app");
}

export async function updateReminderTimeAction(time: string, tz: string) {
  const user = await requireUser();
  setReminder(user.id, time, tz);
  revalidatePath("/app");
}

export async function disableRemindersAction(endpoint: string) {
  const user = await requireUser();
  removeSubscription(user.id, endpoint);
  revalidatePath("/app");
}

export async function testReminderAction(): Promise<number> {
  const user = await requireUser();
  return sendToUser(user.id, {
    title: "🔥 ¡Así te avisaré!",
    body: "Cada día a tu hora, si aún no marcaste tu reto.",
    url: "/app",
    tag: "test",
  });
}
