// Only the authenticated Next.js routes call this loopback service. The browser
// never receives its URL or supplies the owner header.
export async function terminalRequest(userId: string, path: string, init?: RequestInit) {
  try {
    const response = await fetch(
      `${process.env.INTERACTIVE_SANDBOX_URL ?? "http://127.0.0.1:8091"}${path}`,
      {
        ...init,
        headers: { "Content-Type": "application/json", "X-Terminal-User": userId },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    const data = await response.json();
    return Response.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[terminal] backend unavailable", error);
    return Response.json(
      { error: "互動執行服務無法連線，請確認 sandbox-interactive 已啟動" },
      { status: 502 },
    );
  }
}
