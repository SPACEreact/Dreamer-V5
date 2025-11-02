export function ensureString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function ensureBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  // If it's already a Buffer
  if (Buffer.isBuffer(value)) return value;
  // If base64 string
  if (typeof value === "string") {
    // detect if looks like base64 (very basic check)
    const cleaned = value.trim();
    try {
      // If the string contains whitespace/newlines, it's still okay for Buffer.from(base64, 'base64')
      const b = Buffer.from(cleaned, "base64");
      // Reject obviously invalid results (heuristic)
      if (b.length === 0) return null;
      return b;
    } catch {
      return null;
    }
  }
  // If ArrayBuffer or TypedArray
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }
  if (ArrayBuffer.isView(value)) {
    return Buffer.from((value as Uint8Array).buffer);
  }
  return null;
}