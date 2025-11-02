import { Router, Request, Response, NextFunction } from "express";
import { fetchImageFromOpenAI } from "../providers/openaiImageProvider";
import { ensureBuffer } from "../../utils/safeCast";

const router = Router();

/**
 * POST /api/image
 * body: { prompt: string, width?: number, height?: number }
 *
 * Returns binary image content (Content-Type set) or a JSON { url } when provider returns a public url.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, width, height } = req.body ?? {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required and must be a string" });
    }

    const result = await fetchImageFromOpenAI(prompt, width, height);

    if (!result) return res.status(502).json({ error: "No image returned from provider" });

    // If provider returned a public URL
    if (result.url) {
      return res.status(200).json({ url: result.url });
    }

    // If provider returned base64 string or ArrayBuffer -> send as binary
    const buf = ensureBuffer(result.base64 ?? result.buffer ?? null);
    if (!buf) {
      return res.status(500).json({ error: "Unsupported image response format" });
    }

    const contentType = result.contentType ?? "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(buf.length));
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;