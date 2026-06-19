/**
 * euclidean.ts
 * Euclidean distance similarity engine (secondary metric).
 *
 * Returns a similarity score in [0, 100] where 100 = perfect match.
 */

/**
 * Compute Euclidean distance between two arrays of equal length.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Convert Euclidean distance to similarity score [0, 100].
 * Normalized by sqrt(n) so that score is scale-independent.
 */
export function euclideanSimilarity(a: number[], b: number[]): number {
  const dist = euclideanDistance(a, b);
  // Max possible Euclidean distance for unit-normalized series of length n is sqrt(n)
  const maxDist = Math.sqrt(a.length);
  const normalizedDist = dist / maxDist;
  const similarity = 100 * (1 - normalizedDist);
  return Math.max(0, Math.min(100, similarity));
}
