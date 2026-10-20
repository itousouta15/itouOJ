// Public nginx terminates TLS, so the URL seen inside Next may still be HTTP.
export function isAdminSameOrigin(request: Request) {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  let origin: URL;
  try { origin = new URL(request.headers.get("origin") ?? ""); }
  catch { return false; }
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return origin.host === host && (origin.protocol === "https:" || (local && origin.protocol === "http:")) &&
    [null, "same-origin"].includes(request.headers.get("sec-fetch-site"));
}
