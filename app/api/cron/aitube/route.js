export async function GET() {
  const now = new Date().toISOString();

  console.log("AITUBE OTOMATİK ÇALIŞTI:", now);

  return Response.json({
    success: true,
    time: now,
    message: "AiTube saat başı otomatik çalıştı"
  });
}
