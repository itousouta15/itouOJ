export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { resumePendingSubmissions } = await import("@/lib/judge");
    resumePendingSubmissions().catch((err) =>
      console.error("[judge] resume failed:", err)
    );
  }
}
