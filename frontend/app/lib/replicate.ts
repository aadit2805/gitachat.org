const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = "https://api.replicate.com/v1";

export interface ReplicateOutput {
  imageUrl: string;
}

export function buildPrompt(translation: string): string {
  // Extract key themes from the verse for the prompt
  const basePrompt = `anime style illustration, Bhagavad Gita scene, spiritual atmosphere, divine golden light, Krishna and Arjuna, battlefield of Kurukshetra, Indian mythology, studio ghibli inspired, warm golden and saffron tones, high quality anime art, masterpiece, ethereal atmosphere`;

  // Include a condensed version of the translation for context
  const condensedTranslation = translation.slice(0, 200);

  return `${basePrompt}, depicting: ${condensedTranslation}`;
}

export function hashPrompt(prompt: string): string {
  // Simple hash function for prompt caching
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export async function generateImage(prompt: string): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  // Use flux-schnell for fast generation
  const response = await fetch(`${REPLICATE_API_URL}/models/black-forest-labs/flux-schnell/predictions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait", // Wait for the result synchronously
    },
    body: JSON.stringify({
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 90,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${error}`);
  }

  const result = await response.json();

  // Handle different response formats
  if (result.output && Array.isArray(result.output) && result.output.length > 0) {
    return result.output[0];
  }

  if (result.urls?.get) {
    // If we need to poll for the result
    return await pollForResult(result.urls.get);
  }

  throw new Error("Unexpected Replicate API response format");
}

async function pollForResult(getUrl: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to poll Replicate API");
    }

    const result = await response.json();

    if (result.status === "succeeded" && result.output) {
      return Array.isArray(result.output) ? result.output[0] : result.output;
    }

    if (result.status === "failed") {
      throw new Error(result.error || "Image generation failed");
    }

    // Wait 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Image generation timed out");
}
