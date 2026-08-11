export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const key = process.env.FAL_KEY;

  if (!key) {
    return res.status(500).json({
      error: "FAL_KEY is not configured in Vercel"
    });
  }

  const { request_id, model } = req.query || {};

  if (!request_id || !model) {
    return res.status(400).json({
      error: "request_id and model are required"
    });
  }

  try {
    const base =
      "https://queue.fal.run/" +
      model +
      "/requests/" +
      encodeURIComponent(request_id);

    const statusResponse = await fetch(
      base + "/status?logs=1",
      {
        headers: {
          "Authorization": "Key " + key
        }
      }
    );

    const statusData = await statusResponse.json();

    if (!statusResponse.ok) {
      return res.status(statusResponse.status).json({
        error: statusData?.detail || "Status request failed"
      });
    }

    if (statusData.status !== "COMPLETED") {
      return res.status(200).json({
        status: statusData.status,
        queue_position: statusData.queue_position ?? null
      });
    }

    const resultResponse = await fetch(
      base + "/response",
      {
        headers: {
          "Authorization": "Key " + key
        }
      }
    );

    const resultData = await resultResponse.json();

    if (!resultResponse.ok) {
      return res.status(resultResponse.status).json({
        error: resultData?.detail || "Result request failed"
      });
    }

    return res.status(200).json({
      status: "COMPLETED",
      video_url:
        resultData?.video?.url ||
        resultData?.data?.video?.url ||
        null
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
