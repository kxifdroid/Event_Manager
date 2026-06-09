/**
 * Google Cloud Vision API wrapper for label detection.
 * Uses REST API with API key — suitable for serverless (Vercel).
 */

export type VisionLabel = { description: string; score: number };

export async function detectLabels(imageBuffer: Buffer): Promise<VisionLabel[]> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_CLOUD_VISION_API_KEY not set — skipping auto-tagging');
    return [];
  }

  const base64 = imageBuffer.toString('base64');

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'LABEL_DETECTION', maxResults: 20 }],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('Vision API error:', res.status, text);
      return [];
    }

    const data = await res.json();
    const labels: VisionLabel[] =
      data.responses?.[0]?.labelAnnotations?.map(
        (l: { description: string; score: number }) => ({
          description: l.description,
          score: l.score,
        }),
      ) ?? [];

    // Top 10 labels with confidence > 0.7
    return labels.filter((l) => l.score > 0.7).slice(0, 10);
  } catch (err) {
    console.error('Vision API request failed:', err);
    return [];
  }
}
