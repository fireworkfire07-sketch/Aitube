export async function POST() {
  const script = {
    title: "Bugünün AiTube Videosu",
    hook: "Bunu öğrenince videolara bakışın değişecek.",
    scenes: [
      "1. Güçlü bir giriş cümlesiyle dikkat çek.",
      "2. Konuyu kısa ve merak uyandırıcı anlat.",
      "3. İzleyiciye şaşırtıcı bir bilgi ver.",
      "4. Sonunda yorum ve takip çağrısı yap."
    ],
    voiceText:
      "Bunu öğrenince videolara bakışın değişecek. Yapay zeka artık sadece yazı yazmıyor, fikir buluyor, senaryo kuruyor ve video üretim sürecini başlatıyor. Bugünün fırsatı, içerik üretimini otomatikleştirmek. Eğer bunu doğru kurarsan, her gün yeni video fikri çıkarabilirsin.",
    videoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    status: "ok"
  };

  return Response.json(script);
}
