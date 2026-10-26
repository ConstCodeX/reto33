import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/env";
import { peekOtp } from "@/lib/otp-demo";

// Demo-only helper so the sign-in screen can show the code without a real inbox.
// Disabled entirely unless OTP_DELIVERY=demo.
export async function GET(req: NextRequest) {
  if (!isDemo) return NextResponse.json({ demo: false }, { status: 404 });
  const email = req.nextUrl.searchParams.get("email") || "";
  return NextResponse.json({ demo: true, otp: peekOtp(email) });
}
