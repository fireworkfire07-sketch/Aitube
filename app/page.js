"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState("");

  const makeVideo = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/make-video", {
        method: "POST",
      });

      const data = await res.json();

      console.log(data);

      if (data.videoUrl) {
        setVideo(data.videoUrl);
      } else {
        alert("Video gelmedi");
      }
    } catch (err) {
      console.log(err);
      alert("Hata oluştu");
    }

    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        padding: 40,
      }}
    >
      <h1>AITUBE</h1>

      <button
        onClick={makeVideo}
        style={{
          padding: 20,
          background: "red",
          color: "white",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        {loading ? "Üretiliyor..." : "Video Üret"}
      </button>

      {video && (
        <video
          src={video}
          controls
          autoPlay
          style={{
            width: "100%",
            marginTop: 30,
            borderRadius: 20,
          }}
        />
      )}
    </main>
  );
