export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST desteklenir." });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Mesaj boş olamaz." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY Vercel içinde tanımlı değil." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        input: `
Sen AiTube Studio içindeki Orhan'ın AI video, anime kısa film, TikTok/Reels/Shorts ve para kazanma asistanısın.

Görevin:
- Kısa, net, uygulanabilir cevap ver.
- Video fikri üret.
- Senaryo üret.
- Görsel prompt üret.
- Video prompt üret.
- Başlık, açıklama, hashtag yaz.
- Para kazanma adımı ver.
- Türkçe konuş.
- Orhan'a direkt yol göster.

Kullanıcı mesajı:
${message}
`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI API hatası."
      });
    }

    const text = data.output_text || "Cevap üretilemedi.";

    return res.status(200).json({ reply: text });

  } catch (err) {
    return res.status(500).json({
      error: "Sunucu hatası: " + err.message
    });
  }
}
