// Runs once when the server starts (Next instrumentation hook). Creates the
// better-auth tables and the app tables so the app is ready on first request.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("./lib/auth");
  await import("./lib/db"); // side effect: ensures app tables exist
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log("✓ Reto 33 database ready");
}
