
export default function handler(req, res) {
  res.status(200).json({
    title: "AiTube Yeni Sistem",
    video: null,
    message: "Eski çiçek videosu kapatıldı."
  });
}
