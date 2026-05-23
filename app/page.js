export default function Home() {
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
        Video Üret
      </button>
    </main>
  );
}
