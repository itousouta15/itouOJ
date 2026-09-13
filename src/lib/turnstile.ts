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
    console.warn("Turnstile request is missing required configuration or token", {
      hasSecret: Boolean(secret),
      hasToken: Boolean(token),
      hostnameCount: hostnames.size,
    });
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
    if (!response.ok) {
      console.warn("Turnstile Siteverify returned an HTTP error", { status: response.status });
      return false;
    }

    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
      "error-codes"?: string[];
    };
    const valid =
      result.success === true &&
      result.action === action &&
      typeof result.hostname === "string" &&
      hostnames.has(result.hostname);
    if (!valid) {
      console.warn("Turnstile Siteverify rejected a token", {
        expectedAction: action,
        action: result.action,
        hostname: result.hostname,
        errorCodes: result["error-codes"],
      });
    }
    return valid;
  } catch (error) {
    console.warn("Turnstile Siteverify request failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}
