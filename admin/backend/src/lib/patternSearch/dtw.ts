/**
 * dtw.ts
 * Dynamic Time Warping (DTW) similarity engine with Sakoe-Chiba band.
 *
 * Returns a similarity score in [0, 100] where 100 = perfect match.
 */

/**
 * Compute DTW distance between two sequences of equal length.
 * Uses a Sakoe-Chiba band of `bandWidth` (as a fraction of length) for performance.
 */
export function dtwDistance(a: number[], b: number[], bandFraction = 0.1): number {
  const n = a.length;
  const m = b.length;
  const band = Math.max(1, Math.ceil(Math.max(n, m) * bandFraction));

  // Use a flat Float64Array for the DTW cost matrix for speed
  const INF = Infinity;
  const dp: Float64Array = new Float64Array(n * m).fill(INF);

  const idx = (i: number, j: number) => i * m + j;

  dp[idx(0, 0)] = Math.abs(a[0] - b[0]);

  for (let i = 1; i < n; i++) {
    if (Math.abs(i - 0) <= band) {
      dp[idx(i, 0)] = dp[idx(i - 1, 0)] + Math.abs(a[i] - b[0]);
    }
  }
  for (let j = 1; j < m; j++) {
    if (Math.abs(0 - j) <= band) {
      dp[idx(0, j)] = dp[idx(0, j - 1)] + Math.abs(a[0] - b[j]);
    }
  }

  for (let i = 1; i < n; i++) {
    const jStart = Math.max(1, i - band);
    const jEnd = Math.min(m - 1, i + band);
    for (let j = jStart; j <= jEnd; j++) {
      const cost = Math.abs(a[i] - b[j]);
      const prev = Math.min(
        dp[idx(i - 1, j)],       // insertion
        dp[idx(i, j - 1)],       // deletion
        dp[idx(i - 1, j - 1)],   // match
      );
      dp[idx(i, j)] = cost + prev;
    }
  }

  return dp[idx(n - 1, m - 1)];
}

/**
 * Convert a DTW distance into a similarity score [0, 100].
 * We use an exponential decay: similarity = 100 * exp(-k * distance)
 * where k is calibrated so that distance = 1 → ~37% similarity.
 */
export function dtwSimilarity(a: number[], b: number[]): number {
  const dist = dtwDistance(a, b, 0.05); // Use narrower band (5%) for higher shape fidelity
  // Both series are in [0,1]; max possible distance for n=100 is ~100.
  // Normalize by length so that the score is independent of series length.
  const normalizedDist = dist / a.length;
  const similarity = 100 * Math.exp(-5 * normalizedDist);
  return Math.max(0, Math.min(100, similarity));
}
