"use client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// baseURL defaults to the current origin in the browser.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

export const { useSession, signOut } = authClient;
