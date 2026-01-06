import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GitaChat - Wisdom from the Bhagavad Gita";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1410 0%, #110d0a 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Decorative peacock feather symbol */}
        <div
          style={{
            fontSize: 140,
            marginBottom: 20,
          }}
        >
          🪶
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 110,
            fontWeight: 500,
            color: "#e8dac5",
            letterSpacing: "0.04em",
            marginBottom: 30,
          }}
        >
          GitaChat
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#8b7d6d",
            letterSpacing: "0.02em",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Ask a question. Receive guidance from the Bhagavad Gita.
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 300,
            height: 1,
            background: "#8b7d6d",
            opacity: 0.3,
            marginTop: 40,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

