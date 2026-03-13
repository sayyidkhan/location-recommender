# Product Requirements Document (PRD)
# Post-Event Recommendation Engine

**Version:** 0.1 (Draft)  
**Date:** March 13, 2025  
**Status:** Draft for Review

---

## 1. Overview

### 1.1 Problem Statement
After attending an event (concert, conference, meetup, etc.), users often struggle to decide what to do next. They may want to extend the experience, decompress, grab food, or find nearby activities—but lack personalized, contextual suggestions.

### 1.2 Solution
A recommendation engine that takes the user's event response (what happened, mood, preferences) and generates **personalized post-event suggestions with AI-generated images** to help them decide what to do next.

### 1.3 Key Value Proposition
- **Context-aware:** Recommendations based on event type, time, mood, and user preferences
- **Visual:** Each suggestion includes a generated image to make choices more tangible
- **AI-powered:** Uses WaveSpeed AI for both recommendation logic and image generation

---

## 2. Goals & Success Metrics

| Goal | Success Metric |
|------|----------------|
| Help users decide post-event activities quickly | Time-to-decision < 2 minutes |
| Deliver relevant, personalized suggestions | User satisfaction / thumbs-up rate > 70% |
| Provide visually engaging output | Image relevance score (manual review) |
| Feasible MVP with WaveSpeed AI | Single API provider for LLM + images |

---

## 3. User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-1 | As a user who attended an event, I want to describe what I did so that I can get personalized suggestions for what to do next | User can input free-text event description; system accepts and parses it |
| US-2 | As a user, I want to see 3–5 suggestions with images so that I can visually compare options | Each suggestion has title, short description, and AI-generated image |
| US-3 | As a user, I want suggestions that match my mood and context so that they feel relevant | Recommendations consider event type, time of day, and inferred mood |
| US-4 | As a user, I want to get results quickly so that I don't lose momentum | End-to-end response time < 30 seconds (target) |

---

## 4. Technical Approach: WaveSpeed AI

### 4.1 Why WaveSpeed AI?
- **Unified platform:** LLM + image generation in one API
- **700+ models:** Flexibility to choose best models for text and images
- **REST API & SDKs:** Python and JavaScript support for easy integration
- **Async workflow:** Task-based API fits generation-heavy workloads

### 4.2 Proposed Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│  User Input     │     │           WaveSpeed AI                    │
│  (event desc)   │────▶│  ┌────────────┐    ┌─────────────────┐  │
└─────────────────┘     │  │ LLM Chat   │───▶│ Text-to-Image   │  │
                        │  │ (recommend)│    │ (per suggestion)│  │
                        │  └────────────┘    └─────────────────┘  │
                        └──────────────────────────────────────────┘
                                         │
                                         ▼
                        ┌──────────────────────────────────────────┐
                        │  Output: Suggestions + Images             │
                        └──────────────────────────────────────────┘
```

### 4.3 WaveSpeed AI Components

| Component | WaveSpeed Feature | Purpose |
|-----------|-------------------|---------|
| **Recommendation logic** | LLM (Large Language Models) | Parse event input, infer context, generate 3–5 structured suggestions |
| **Image generation** | Text-to-Image (e.g., FLUX 2, Seedream 4.5) | Generate one image per suggestion from a prompt derived from the suggestion |

### 4.4 API Flow (High-Level)

1. **User submits** event description (e.g., "Just left a 2-hour tech meetup, feeling energized, it's 8pm")
2. **LLM call:** Send to WaveSpeed LLM with a system prompt that defines output format (JSON: `[{title, description, imagePrompt}, ...]`)
3. **Parse LLM response** to extract structured suggestions
4. **Image generation:** For each suggestion, call Text-to-Image with `imagePrompt` (or derived prompt)
5. **Poll / webhook:** Retrieve completed images (WaveSpeed uses async task model)
6. **Return** combined suggestions + image URLs to user

### 4.5 Considerations

| Consideration | Mitigation |
|---------------|------------|
| **Latency** | Run image generations in parallel; consider caching for common event types |
| **Cost** | 3–5 images per request; estimate per-request cost via WaveSpeed Pricing API |
| **Rate limits** | Bronze: 10 images/min; may need Silver ($100 top-up) for production |
| **Image quality** | Prompt engineering; allow model selection (FLUX 2 vs Seedream, etc.) |

---

## 5. Functional Requirements

### 5.1 Input
- **Event response:** Free-text input (required)
  - Examples: "Went to a jazz concert, feeling relaxed", "Just finished a hackathon, super tired"
- **Optional extensions (v2):**
  - Location / city
  - Time of day
  - Budget
  - Group size

### 5.2 Output
- **Suggestions:** 3–5 items, each with:
  - `title` (e.g., "Quiet café nearby")
  - `description` (1–2 sentences)
  - `imageUrl` (WaveSpeed-generated image)
  - `imagePrompt` (optional, for transparency/debugging)

### 5.3 Non-Functional Requirements
- Response time: < 30 seconds (P95)
- Availability: 99% uptime (post-MVP)
- Security: No PII stored; API keys in env vars

---

## 6. Out of Scope (MVP)

- User accounts / persistence
- Location-based filtering (use LLM context only)
- Social sharing
- Mobile native apps (web-first)
- Multi-language (English only for MVP)

---

## 7. Milestones

| Phase | Scope | Timeline |
|-------|-------|----------|
| **M1: Proof of Concept** | Single flow: input → LLM → 1 image; verify WaveSpeed integration | 1–2 weeks |
| **M2: MVP** | Full flow: 3–5 suggestions + images; simple web UI | 2–3 weeks |
| **M3: Polish** | Error handling, loading states, prompt tuning | 1 week |
| **M4: v2** | Location, preferences, caching | TBD |

---

## 8. Open Questions

1. **Event input format:** Free-text only, or structured (event type dropdown + notes)?
2. **Image style:** Photorealistic, illustrated, or user-selectable?
3. **Fallback:** If image generation fails, show suggestion without image?
4. **WaveSpeed account:** Start with Bronze ($1 trial) or plan for Silver?

---

## 9. Appendix

### A. Example User Flow
1. User: "Just left a 2-hour startup pitch event, feeling inspired but hungry, it's 9pm"
2. System returns:
   - **Late-night ramen spot** — "Warm, casual, perfect for post-pitch decompression" + [image]
   - **Rooftop bar with city views** — "Extend the energy with a drink and skyline" + [image]
   - **Quiet wine bar** — "Low-key spot to process ideas" + [image]

### B. WaveSpeed AI Resources
- [Overview](https://wavespeed.ai/docs/overview)
- [REST API](https://wavespeed.ai/docs/rest-api)
- [Python SDK](https://wavespeed.ai/docs/python-sdk)
- [Models](https://wavespeed.ai/models)

### C. Competitor / Alternative Consideration
- Could use separate providers (e.g., OpenAI for LLM + WaveSpeed for images), but WaveSpeed simplifies integration and billing.
