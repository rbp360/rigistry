"use client";
import Image from "next/image";

export default function BackdropCheck() {
  const items = [
    { label: "Studio backdrop", src: "/branding/Studio backdrop.png" },
    { label: "Control room", src: "/branding/Control room.png" },
    { label: "Live backdrop", src: "/branding/Live backdrop.png" },
    { label: "Live room", src: "/branding/Live room.png" },
    { label: "Orchestra", src: "/branding/Orchestra.png" },
    { label: "Orchestra backdrop", src: "/branding/Orchestra backdrop.png" },
  ];
  return (
    <main style={{ padding: 24, color: "#fff", background: "#111", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 16 }}>Backdrop Image Check</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        This page renders each image twice: once with Next/Image and once with plain HTML &lt;img&gt;.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {items.map((it) => (
          <div key={it.src} style={{ background: "#222", border: "1px solid #333", borderRadius: 8, padding: 12 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{it.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Next/Image</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#000", borderRadius: 6, padding: 8 }}>
                  <Image src={it.src} alt={it.label} width={320} height={180} style={{ objectFit: "contain", width: "100%", height: "auto" }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>HTML img</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#000", borderRadius: 6, padding: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} alt={`${it.label} (img)`} style={{ maxWidth: "100%" }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{it.src}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
