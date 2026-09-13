import { clientIp } from "@/lib/rateLimit";

function configuredHostnames() {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
}

export async function verifyTurnstile(
  token: string | undefined,
  action: "login" | "register",
  request: Request,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const hostnames = configuredHostnames();
  if (!secret || !token || token.length > 2048 || hostnames.size === 0) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: clientIp(request),
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return false;

    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    return (
      result.success === true &&
      result.action === action &&
      typeof result.hostname === "string" &&
      hostnames.has(result.hostname)
    );
  } catch {
    return false;
  }
}
