"use client";

import { useState } from "react";

export default function Home() {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function makeVideo() {
    setLoading(true);

    const res = await fetch("/api/make-video", {
      method: "POST",
    });

    const data = await res.json();
    setVideo(data);
    setLoading(false);
  }

  return (
    <main
      style={{
        background: "#0b1020",
        color: "white",
        minHeight: "100vh",
        padding: 40,
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ fontSize: 50 }}>AITUBE V2</h1>

      <p style={{ fontSize: 22 }}>
        Otomatik AI video üretim sistemi
      </p>

      <button
        onClick={makeVideo}
        style={{
          marginTop: 30,
          padding: 20,
          fontSize: 20,
          borderRadius: 15,
          border: "none",
          background: "#6c3cff",
          color: "white",
          cursor: "pointer",
        }}
      >
        {loading ? "Üretiliyor..." : "Video Üret"}
      </button>

      {video && (
        <section
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 20,
            background: "#151b33",
          }}
        >
          <h2>{video.title}</h2>

          <h3>Senaryo</h3>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>{video.script}</p>

          <h3>Sahneler</h3>
          <ul>
            {video.scenes.map((scene, index) => (
              <li key={index}>{scene}</li>
            ))}
          </ul>

          <h3>YouTube Açıklaması</h3>
          <p>{video.youtubeDescription}</p>

          <h3>Hashtagler</h3>
          <p>{video.hashtags.join(" ")}</p>
        </section>
      )}
    </main>
  );
}
