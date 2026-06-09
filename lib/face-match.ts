/**
 * Euclidean distance between 128-dim face descriptors (face-api.js format).
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function distanceToConfidence(distance: number): number {
  return Math.max(0, 1 - distance);
}

export const FACE_MATCH_THRESHOLD = 0.6;
