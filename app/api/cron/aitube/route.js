export async function GET() {
  const now = new Date().toISOString();

  const job = {
    success: true,
    time: now,
    system: "AiTube Auto Engine",
    status: "queued",
    topic: "Yapay zeka ile otomatik YouTube Shorts üretimi",
    title: "Yapay zeka artık sen uyurken video hazırlıyor",
    hook: "Sen uyurken bile içerik üreten bir sistem düşün.",
    voiceText:
      "Sen uyurken bile içerik üreten bir sistem düşün. AiTube artık saat başı çalışıyor, konu seçiyor, senaryo hazırlıyor ve video üretim kuyruğuna alıyor. Bir sonraki adımda bu sistem YouTube kanalına otomatik yükleme yapacak.",
    hashtags: ["#aitube", "#yapayzeka", "#shorts", "#otomasyon"],
    nextSteps: [
      "Konu toplandı",
      "Başlık üretildi",
      "Ses metni hazırlandı",
      "Video kuyruğa alındı",
      "YouTube upload bağlantısı bekleniyor"
    ]
  };

  console.log("AITUBE AUTO JOB:", job);

  return Response.json(job);
}
