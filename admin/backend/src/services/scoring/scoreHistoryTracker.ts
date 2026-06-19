import prisma from '../../config/prisma';

/**
 * Persists or updates the daily Technical Strength Score and Rating in the database.
 */
export async function recordScoreHistory(
  symbol: string,
  date: Date,
  score: number,
  rating: string,
  confluenceScore: number
): Promise<void> {
  const normalizedDate = new Date(date.toISOString().split('T')[0]);

  try {
    await prisma.scoreHistory.upsert({
      where: {
        symbol_date: {
          symbol,
          date: normalizedDate,
        },
      },
      update: {
        technicalScore: score,
        technicalRating: rating,
        confluenceScore: confluenceScore,
        recordedAt: new Date(),
      },
      create: {
        symbol,
        date: normalizedDate,
        technicalScore: score,
        technicalRating: rating,
        confluenceScore: confluenceScore,
      },
    });
  } catch (error) {
    console.error(`[ScoreHistoryTracker] Failed to record score history for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetches the score history for a symbol for the last N days.
 */
export async function getScoreHistory(symbol: string, limit = 30): Promise<{ date: string; score: number; rating: string }[]> {
  try {
    const records = await prisma.scoreHistory.findMany({
      where: { symbol },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return records.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      score: Number(r.technicalScore),
      rating: r.technicalRating,
    })).reverse();
  } catch (error) {
    console.error(`[ScoreHistoryTracker] Failed to retrieve score history for ${symbol}:`, error);
    return [];
  }
}
