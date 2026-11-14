import { ImageResponse } from "next/og";

export const alt = "Mr LapShop — laptops, accessories and repairs in Rawalpindi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#ffffff",
          background: "radial-gradient(circle at 84% 18%, #163f70 0%, #0b1530 42%, #070d1f 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#ffe600", fontSize: 22, fontWeight: 800, letterSpacing: 5 }}>
          <div style={{ width: 44, height: 4, background: "#ffe600" }} />
          YOUR LOCAL TECH DESTINATION
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -5, lineHeight: 1 }}>MR LAPSHOP</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#ffe600" }}>Laptops. Accessories. Expert repairs.</div>
          <div style={{ fontSize: 25, color: "#d5deed" }}>New · Used · Open Box · Rawalpindi & Islamabad</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.25)", paddingTop: 24, fontSize: 21, color: "#c1ccdd" }}>
          <span>Techno City 2 · 6th Road · Rawalpindi</span>
          <span style={{ color: "#ffe600", fontWeight: 800 }}>0328 1133770</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
