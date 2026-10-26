"use client";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        await signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
