import express from 'express';

const app = express();
app.use(express.json());

const WAVESPEED_API = 'https://api.wavespeed.ai/api/v3';

async function getRecommendations(event, location) {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not set');

  // 1. LLM: get 3 recommendations with image prompts
  const llmRes = await fetch(`${WAVESPEED_API}/wavespeed-ai/any-llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: `Given this event and location, suggest exactly 3 things to do next. Return ONLY valid JSON array, no other text.
Event: ${event}
Location: ${location}

Format each item: {"title": "...", "description": "...", "imagePrompt": "..."}
- title: short catchy name (3-5 words)
- description: 1-2 sentences why it fits
- imagePrompt: visual description for AI image (e.g. "Cozy late-night ramen shop, warm lighting, steam rising from bowls")`,
      system_prompt: 'You are a local recommendations expert. Output only valid JSON array with 3 objects. No markdown, no code blocks.',
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

  // 2. Generate images in parallel (max 3)
  const toGenerate = suggestions.slice(0, 3);
  const imagePromises = toGenerate.map((s) =>
    fetch(`${WAVESPEED_API}/wavespeed-ai/flux-dev`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: s.imagePrompt || s.title,
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
    imageUrl: imageUrls[i] || null,
  }));
}

const recommendHandler = async (req, res) => {
  try {
    const { event, location } = req.body || {};
    if (!event || !location) {
      return res.status(400).json({ error: 'Missing required field: event or location' });
    }

    const recommendations = await getRecommendations(event, location);
    res.json({ recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

app.post('/', recommendHandler);
app.post('/api/recommend', recommendHandler);
app.all('*', (req, res) => res.status(405).json({ error: 'Method not allowed' }));

export default app;
