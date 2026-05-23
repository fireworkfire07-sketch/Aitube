export async function POST() {
  return Response.json({
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    status: "ok"
  });
}
