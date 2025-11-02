// lightweight model selection heuristics
// Returns one of: "gemini-2.5-pro" or "gemini-2.5-flash"
export function chooseModel({ taskType, estimatedTokens = 0, preferSpeed = false } = {}) {
  // If the caller explicitly prefers speed, favor flash.
  if (preferSpeed) return "gemini-2.5-flash";

  // Use pro for heavy/long generation tasks or specific task types.
  const heavyTaskTypes = new Set(["storyboard", "video_generation", "long_form", "image_prompts"]);
  if (heavyTaskTypes.has(taskType)) return "gemini-2.5-pro";

  // Heuristic based on estimated tokens
  if (estimatedTokens >= 1024) return "gemini-2.5-pro";

  // Default: flash for quick suggestion, pro for everything else that's not explicitly light
  return "gemini-2.5-flash";
}
