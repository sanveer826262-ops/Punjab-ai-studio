export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.FAL_KEY;

  if (!key)
    return res.status(500).json({
      error: "FAL_KEY is not configured in Vercel"
    });

  try {
    const { mode = "text", prompt, image, aspect_ratio = "9:16", resolution = "480p" } = req.body || {};

    if (!prompt)
      return res.status(400).json({ error: "Prompt required" });

    const model =
      mode === "image"
        ? "fal-ai/wan-i2v"
        : "fal-ai/wan-t2v";

    const input = {
      prompt,
      aspect_ratio,
      resolution,
      num_frames: 81,
      frames_per_second: 16,
      enable_safety_checker: true,
      enable_prompt_expansion: true
    };

    if (mode === "image") {
      if (!image)
        return res.status(400).json({ error: "Image required" });

      input.image_url = image;
    }

    const response = await fetch(
      "https://queue.fal.run/" + model,
      {
        method: "POST",
        headers: {
          "Authorization": "Key " + key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }
    );

    const data = await response.json();

    if (!response.ok)
      return res.status(response.status).json({
        error: data?.detail || data?.message || "AI request failed"
      });

    return res.status(200).json({
      request_id: data.request_id,
      model
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
