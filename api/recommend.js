import express from 'express';

const app = express();
app.use(express.json());

const WAVESPEED_API = 'https://api.wavespeed.ai/api/v3';

function authMiddleware(req, res, next) {
  const serverKey = process.env.RECOMMEND_API_KEY;
  if (!serverKey) return next();

  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];
  const clientKey = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : apiKeyHeader;

  if (!clientKey || clientKey !== serverKey) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

async function pollForResult(apiKey, taskId, maxWaitMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${WAVESPEED_API}/predictions/${taskId}/result`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const d = await res.json();
    if (d.data?.status === 'completed' && d.data?.outputs?.[0]) {
      return d.data.outputs[0];
    }
    if (d.data?.status === 'failed') {
      throw new Error(d.data?.error || 'Video generation failed');
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Video generation timed out');
}

async function getRecommendations(event, location, media = 'image', noOfItems = 3) {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not set');

  const count = Math.min(Math.max(1, parseInt(noOfItems, 10) || 3), 5);
  const isVideo = media === 'video';
  const promptLabel = isVideo ? 'videoPrompt' : 'imagePrompt';

  // 1. LLM: get N recommendations with prompts
  const llmRes = await fetch(`${WAVESPEED_API}/wavespeed-ai/any-llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: `Given this event and location, suggest exactly ${count} thing(s) to do next. Return ONLY valid JSON array, no other text.
Event: ${event}
Location: ${location}

Format each item: {"title": "...", "description": "...", "${promptLabel}": "..."}
- title: short catchy name (3-5 words)
- description: 1-2 sentences why it fits
- ${promptLabel}: ${isVideo ? 'cinematic scene description for AI video (e.g. "Cozy late-night ramen shop, steam rising from bowls, warm lighting, camera slowly pans across the counter")' : 'visual description for AI image (e.g. "Cozy late-night ramen shop, warm lighting, steam rising from bowls")'}`,
      system_prompt: `You are a local recommendations expert. Output only valid JSON array with ${count} object(s). No markdown, no code blocks.`,
      model: 'google/gemini-2.5-flash',
      enable_sync_mode: true,
      max_tokens: 1024,
    }),
  });

  const llmData = await llmRes.json();
  if (llmData.code !== 200 || !llmData.data?.outputs?.[0]) {
    throw new Error(llmData.data?.error || llmData.message || 'LLM failed');
  }

  let suggestions;
  try {
    const text = llmData.data.outputs[0];
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    suggestions = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    throw new Error('Failed to parse LLM response as JSON');
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error('No recommendations returned');
  }

  const toGenerate = suggestions.slice(0, count);

  if (isVideo) {
    // 2a. Generate videos (sequential - each takes 1-2 min)
    const videoUrls = [];
    for (const s of toGenerate) {
      const prompt = s.videoPrompt || s.imagePrompt || s.title;
      const submitRes = await fetch(`${WAVESPEED_API}/kwaivgi/kling-v2.6-std/text-to-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          duration: 5,
          aspect_ratio: '16:9',
        }),
      });
      const submitData = await submitRes.json();
      if (submitData.code !== 200 || !submitData.data?.id) {
        videoUrls.push(null);
        continue;
      }
      try {
        const url = await pollForResult(apiKey, submitData.data.id);
        videoUrls.push(url);
      } catch {
        videoUrls.push(null);
      }
    }
    return toGenerate.map((s, i) => ({
      id: `rec_${i + 1}`,
      title: s.title,
      description: s.description,
      mediaType: 'video',
      videoUrl: videoUrls[i] || null,
    }));
  }

  // 2b. Generate images in parallel
  const imagePromises = toGenerate.map((s) =>
    fetch(`${WAVESPEED_API}/wavespeed-ai/flux-dev`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: s.imagePrompt || s.videoPrompt || s.title,
        enable_sync_mode: true,
        size: '1024*1024',
      }),
    }).then(async (r) => {
      const d = await r.json();
      return d.code === 200 && d.data?.outputs?.[0] ? d.data.outputs[0] : null;
    })
  );

  const imageUrls = await Promise.all(imagePromises);

  return toGenerate.map((s, i) => ({
    id: `rec_${i + 1}`,
    title: s.title,
    description: s.description,
    mediaType: 'image',
    imageUrl: imageUrls[i] || null,
  }));
}

const recommendHandler = async (req, res) => {
  try {
    const { event, location, media, no_of_items } = req.body || {};
    if (!event || !location) {
      return res.status(400).json({ error: 'Missing required field: event or location' });
    }

    const recommendations = await getRecommendations(event, location, media, no_of_items);
    res.json({ recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

app.use(authMiddleware);
app.post('/', recommendHandler);

export default app;
