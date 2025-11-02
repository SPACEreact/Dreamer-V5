import fetch from "node-fetch";

type ImageResult = {
  base64?: string;
  buffer?: Buffer;
  url?: string;
  contentType?: string;
};

/**
 * Example adapter for an OpenAI-like image API that returns base64 image data.
 * Replace endpoint and JSON parsing to match your provider.
 */
export async function fetchImageFromOpenAI(prompt: string, width?: number, height?: number): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const size = width && height ? `${width}x${height}` : undefined;
  // Example endpoint — adjust to your actual provider API
  const response = await fetch("https://api.openai.com/v1/images/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      size,
      n: 1,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image provider error ${response.status}: ${text}`);
  }

  const json = await response.json();

  // Typical OpenAI-like response with base64 in b64_json (adjust if your provider differs)
  const b64 = json?.data?.[0]?.b64_json ?? json?.data?.[0]?.b64;
  if (b64 && typeof b64 === "string") {
    return { base64: b64, contentType: "image/png" };
  }

  const url = json?.data?.[0]?.url;
  if (url) return { url };

  // If provider returns bytes directly (rare), try to fetch the endpoint again as arrayBuffer
  // Fallback: try to detect binary body
  try {
    const ab = await response.arrayBuffer();
    if (ab && ab.byteLength > 0) {
      return { buffer: Buffer.from(ab), contentType: response.headers.get("content-type") ?? "image/png" };
    }
  } catch {
    // ignore
  }

  throw new Error("Unexpected image response from provider");
}