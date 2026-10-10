/** @param {string} base */
export function judgeCoordinatorEndpoint(base) {
  let endpoint;
  try { endpoint = new URL("/api/internal/judge", base); }
  catch { throw new Error("Invalid coordinator URL"); }
  const local = endpoint.hostname === "localhost" || endpoint.hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(endpoint.hostname);
  if (endpoint.username || endpoint.password ||
    (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && local))) {
    throw new Error("Coordinator URL requires HTTPS (HTTP is allowed only on loopback)");
  }
  return endpoint;
}
