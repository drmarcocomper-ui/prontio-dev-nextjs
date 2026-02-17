/**
 * Next.js instrumentation — runs once at server startup.
 * Validates that required environment variables are set.
 */
export function register() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      "Check .env.local or your hosting provider's environment settings."
    );
  }
}
