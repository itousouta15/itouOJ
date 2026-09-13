import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #101820 0%, #182c38 55%, #184e55 100%)",
          color: "#f4f7f8",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 3, color: "#7ee7c8" }}>
          ONLINE JUDGE
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: -4 }}>
            itouOJ
          </div>
          <div style={{ display: "flex", fontSize: 38, marginTop: 18, color: "#c3d2d7" }}>
            Code. Submit. Learn.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#95aeb6" }}>
          oj.itousouta.me
        </div>
      </div>
    ),
    size,
  );
}
