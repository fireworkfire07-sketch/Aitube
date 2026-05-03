export default async function handler(req, res) {
  const prompt = req.body.prompt;
  console.log("TOKEN:", process.env.REPLICATE_API_TOKEN);

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: "a16z-infra/llava-v1.5-13b",
      input: {
        prompt: prompt
      }
    })
  });

  const data = await response.json();

  res.status(200).json({
    message: "AI çalıştı",
    data: data
  });
}