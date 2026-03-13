# Recommend API

Get personalized post-event suggestions with images based on event details and location.

---

## POST /recommend

Returns 3 recommendations (text + image) for what to do after an event.

### Request

**Headers**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <RECOMMEND_API_KEY>` (required if `RECOMMEND_API_KEY` env is set) |
| `X-API-Key` | Alternative to Authorization header |

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Description of the event you attended (e.g. mood, activity type, duration) |
| `location` | string | Yes | Where you are (e.g. city, neighborhood, or address) |
| `media` | string | No | `"image"` (default) or `"video"` – generates images or videos for each recommendation |
| `no_of_items` | number | No | Number of recommendations to return (1–5, default: 3) |

**Example**

```json
{
  "event": "Just left a jazz concert, feeling relaxed",
  "location": "Brooklyn, NY",
  "media": "video",
  "no_of_items": 1
}
```

### Response

**Success (200 OK)**

| Field | Type | Description |
|-------|------|-------------|
| `recommendations` | array | List of 3 suggestions |
| `recommendations[].id` | string | Unique identifier for the recommendation |
| `recommendations[].title` | string | Short title of the suggestion |
| `recommendations[].description` | string | Brief description |
| `recommendations[].mediaType` | string | `"image"` or `"video"` |
| `recommendations[].imageUrl` | string | URL to the generated image (when `media` is `image`) |
| `recommendations[].videoUrl` | string | URL to the generated video (when `media` is `video`) |

**Example (image)**

```json
{
  "recommendations": [
    {
      "id": "rec_1",
      "title": "Late-night ramen spot",
      "description": "Warm, casual spot perfect for post-concert decompression. Open until midnight.",
      "mediaType": "image",
      "imageUrl": "https://..."
    },
    {
      "id": "rec_2",
      "title": "Rooftop bar with live music",
      "description": "Extend the jazz vibe with cocktails and city views.",
      "mediaType": "image",
      "imageUrl": "https://..."
    },
    {
      "id": "rec_3",
      "title": "Quiet wine bar",
      "description": "Low-key spot to wind down and process the evening.",
      "mediaType": "image",
      "imageUrl": "https://..."
    }
  ]
}
```

**Example (video)** – when `media: "video"` is passed:

```json
{
  "recommendations": [
    {
      "id": "rec_1",
      "title": "Late-night ramen spot",
      "description": "Warm, casual spot perfect for post-concert decompression.",
      "mediaType": "video",
      "videoUrl": "https://..."
    }
  ]
}
```

> **Note:** Video generation takes ~1–2 minutes per recommendation (about 5–6 minutes total). The API uses Kling V2.6 Std text-to-video.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Invalid request (missing `event` or `location`) |
| `401` | Invalid or missing API key (when `RECOMMEND_API_KEY` is set) |
| `500` | Server error (e.g. AI service failure) |

**Error response body**

```json
{
  "error": "Missing required field: event"
}
```

---

## Example

**cURL**

```bash
# Images (default)
curl -X POST https://your-app.vercel.app/api/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RECOMMEND_API_KEY" \
  -d '{"event": "Just left a jazz concert, feeling relaxed", "location": "Brooklyn, NY"}'

# Videos
curl -X POST https://your-app.vercel.app/api/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RECOMMEND_API_KEY" \
  -d '{"event": "Just left a jazz concert, feeling relaxed", "location": "Brooklyn, NY", "media": "video"}'
```
