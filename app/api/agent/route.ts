// app/api/agent/route.ts
// AI BEYİN (AGENT)
// Döngü: Durumu oku → Karar ver → Video üret → Raporla

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Decision = {
  action: "URET" | "BAKIM_GEREKLI";
  topic?: string;
  reason: string;
};

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const log: string[] = [];

  try {
    // ADIM 1: Sağlık raporu al
    const healthRes = await fetch(`${base}/api/health`);
    const health = await healthRes.json();
    log.push(`Sağlık: ${health.status}`);

    if (health.status !== "SAĞLIKLI") {
      await notify(`⚠️ Agent durdu: sistem sağlıksız.`);
      return Response.json({ decision: "BAKIM_GEREKLI", health, log });
    }

    // ADIM 2: GPT'den konu kararı al
    const systemPrompt = `Sen AiTube adlı otomatik video üretim sisteminin yönetici beynisin.
Kanal: çocuklara yönelik boyama/figür temalı eğitici videolar.
SADECE şu JSON formatında cevap ver, başka hiçbir şey yazma:
{"action":"URET","topic":"video konusu","reason":"neden bu konu"}
Kurallar:
- topic: özgün, çocuk dostu, boyama/hayvan figürü temalı bir video konusu üret. Yaratıcı ol.
- reason: kısa Türkçe açıklama.`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tarih: ${new Date().toISOString()}. Sıradaki kararı ver.` },
        ],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    const aiData = await aiRes.json();
    const decision: Decision = JSON.parse(
      aiData.choices?.[0]?.message?.content || "{}"
    );
    log.push(`Karar: ${decision.action} — ${decision.topic || ""}`);

    // ADIM 3: Video üretim hattını tetikle
    let pipelineResult: any = null;
    if (decision.action === "URET" && decision.topic) {
      const pipelinePath = process.env.VIDEO_PIPELINE_URL || "/api/create-video";
      const pRes = await fetch(`${base}${pipelinePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: decision.topic, source: "agent" }),
      });
      pipelineResult = { ok: pRes.ok, status: pRes.status };
      log.push(`Pipeline: ${pRes.ok ? "BAŞARILI" : "HATA " + pRes.status}`);

      // Başarısızsa bir kez daha dene
      if (!pRes.ok) {
        const retry = await fetch(`${base}${pipelinePath}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: decision.topic, source: "agent-retry" }),
        });
        pipelineResult.retried = true;
        pipelineResult.retryOk = retry.ok;
        log.push(`Tekrar deneme: ${retry.ok ? "BAŞARILI" : "YİNE HATA"}`);
      }
    }

    // ADIM 4: Rapor gönder
    await notify(
      `🤖 AiTube Agent Raporu\n\n📌 Konu: ${decision.topic}\n💡 ${decision.reason}\n📋 ${log.join("\n")}`
    );

    return Response.json({ decision, pipelineResult, log });
  } catch (e: any) {
    await notify(`🔴 Agent hatası: ${e?.message}`);
    return Response.json({ error: e?.message, log }, { status: 500 });
  }
}

// Telegram bildirimi (tanımlıysa çalışır, değilse sessizce geçer)
async function notify(text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
      }),
    }
  ).catch(() => {});
}
