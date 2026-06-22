import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shorty — Premium short films under 25 minutes";
export const size = { width: 1200, height: 630 };

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080808 0%, #1a0a00 50%, #080808 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            letterSpacing: -2,
          }}
        >
          Shorty<span style={{ color: "#ff7a18" }}>.</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            color: "#cccccc",
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          Premium short films. Big stories. Small runtime.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: "#ff7a18",
            fontWeight: 700,
          }}
        >
          Drama · Comedy · Animation · Sci-Fi
        </div>
      </div>
    ),
    { ...size }
  );
}
