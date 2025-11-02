import { Router, Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import { ensureBuffer } from "../../utils/safeCast";

const router = Router();

/**
 * Example POST /api/sound
 * body: { text: string, voice?: string }
 *
 * This route demonstrates fetching TTS audio from a provider and returning binary audio content.
 * Replace fetchAudioFromProvider implementation with your actual TTS provider call.
 */
async function fetchAudioFromProvider(text: string, voice?: string) {
  // Placeholder example using a hypothetical endpoint that returns audio bytes
  // Replace URL and payload with your actual TTS provider (ElevenLabs, Google, etc.)
  const apiKey = process.env.TTS_API_KEY;
  if (!apiKey) {
    throw new Error("TTS_API_KEY not set");
  }

  const resp = await fetch("https://example-tts-provider.local/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`TTS provider error ${resp.status}: ${txt}`);
  }

  // Try to get arrayBuffer (binary) first
  const ab = await resp.arrayBuffer();
  const ct = resp.headers.get("content-type") ?? "audio/mpeg";
  return { buffer: Buffer.from(ab), contentType: ct };
}

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voice } = req.body ?? {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required and must be a string" });
    }

    const result = await fetchAudioFromProvider(text, voice);
    if (!result) return res.status(502).json({ error: "No audio from provider" });

    if (result.url) {
      return res.status(200).json({ url: result.url });
    }

    const buf = ensureBuffer(result.buffer ?? result.base64 ?? null);
    if (!buf) return res.status(500).json({ error: "Unsupported audio response format" });

    const ct = result.contentType ?? "audio/mpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Content-Length", String(buf.length));
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;