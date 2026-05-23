"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState("");

  async function makeVideo() {
    setLoading(true);
    setVideo("");

    try {
      const res = await fetch("/api/make-video", {
        method: "POST"
      });

      const data = await res.json();

      if (data.videoUrl) {
        setVideo(data.videoUrl);
      } else if (data.url) {
        setVideo(data.url);
      } else {
        alert("Video üretildi ama video linki dönmedi.");
      }
    } catch (error) {
      alert("Video üretirken hata oluştu.");
    }

    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 30 }}>
      <h1>AiTube</h1>

      <button
        onClick={makeVideo}
        disabled={loading}
        style={{
          padding: "16px 24px",
          borderRadius: 12,
          border: "0",
          background: "red",
          color: "white",
          fontSize: 18
        }}
      >
        {loading ? "Video üretiliyor..." : "Video Üret"}
      </button>

      {video && (
        <div style={{ marginTop: 30 }}>
          <video src={video} controls style={{ width: "100%", borderRadius: 16 }} />
          <p>{video}</p>
        </div>
      )}
    </main>
  );
}
