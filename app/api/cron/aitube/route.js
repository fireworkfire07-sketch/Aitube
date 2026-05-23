const topics = [
  "Yapay zeka ile para kazanma",
  "YouTube Shorts otomasyonu",
  "Günde 1 saatle dijital gelir",
  "AI video üretim sistemi",
  "Telefonla içerik üretme",
  "Kendi kendine çalışan YouTube kanalı"
];

export async function GET() {
  const now = new Date().toISOString();
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const job = {
    success: true,
    time: now,
    system: "AiTube Auto Engine",
    status: "content_created",
    topic,
    title: `${topic} artık düşündüğünden daha kolay`,
    hook: "Bunu bugün kuranlar yarın içerik üretmeye başlamış olacak.",
    voiceText: `${topic} konusunda en büyük hata, sistemi kurmadan sürekli araç aramaktır. Doğru kurulan bir otomasyon, her saat yeni fikir çıkarır, senaryo hazırlar ve video üretim sürecini başlatır. AiTube bunun ilk çalışan çekirdeğidir.`,
    hashtags: ["#aitube", "#yapayzeka", "#shorts", "#otomasyon", "#dijitalgelir"],
    videoPlan: [
      "0-3 sn: güçlü hook",
      "3-12 sn: problemi göster",
      "12-25 sn: çözümü anlat",
      "25-35 sn: takip çağrısı"
    ],
    nextAction: "video_render_queue"
  };

  console.log("AITUBE AUTO CONTENT:", job);

  return Response.json(job);
}
