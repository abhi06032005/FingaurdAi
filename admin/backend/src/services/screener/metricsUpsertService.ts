import pLimit from 'p-limit';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';
import { computeMetricsForSymbol, StockMetricsPayload } from './indicatorEngine';
import seedData from '../../data/stock_metadata_seed.json';

// ─── Metadata lookup ──────────────────────────────────────────────────────────

const metadataMap = new Map<string, { companyName: string; sector: string; industry: string; marketCapCategory: string }>(
  (seedData as any[]).map((s: any) => [
    s.symbol,
    {
      companyName: s.companyName,
      sector: s.sector,
      industry: s.industry,
      marketCapCategory: s.marketCapCategory,
    },
  ])
);

// ─── Seed metadata into DB ────────────────────────────────────────────────────

export async function seedStockMetadata(): Promise<void> {
  logger.info('[MetricsUpsert] Seeding stock metadata...');

  const records = (seedData as any[]).map((s: any) => ({
    symbol: s.symbol,
    companyName: s.companyName,
    sector: s.sector,
    industry: s.industry,
    marketCapCategory: s.marketCapCategory,
  }));

  for (const r of records) {
    await (prisma as any).stockMetadata.upsert({
      where: { symbol: r.symbol },
      update: { companyName: r.companyName, sector: r.sector, industry: r.industry, marketCapCategory: r.marketCapCategory },
      create: r,
    });
  }

  logger.info(`[MetricsUpsert] Seeded ${records.length} stock metadata records.`);
}

// ─── Upsert a single metric ────────────────────────────────────────────────────

async function upsertMetric(payload: StockMetricsPayload): Promise<void> {
  const data = {
    companyName: payload.companyName,
    sector: payload.sector,
    marketCapCategory: payload.marketCapCategory,
    closePrice: payload.closePrice,
    openPrice: payload.openPrice,
    highPrice: payload.highPrice,
    lowPrice: payload.lowPrice,
    changePct: payload.changePct,
    gapPct: payload.gapPct,
    volumeToday: payload.volumeToday,
    avgVolume20: payload.avgVolume20,
    avgVolume50: payload.avgVolume50,
    volumeRatio: payload.volumeRatio,
    sma20: payload.sma20 ?? undefined,
    sma50: payload.sma50 ?? undefined,
    sma100: payload.sma100 ?? undefined,
    sma200: payload.sma200 ?? undefined,
    ema20: payload.ema20 ?? undefined,
    ema50: payload.ema50 ?? undefined,
    ema100: payload.ema100 ?? undefined,
    ema200: payload.ema200 ?? undefined,
    rsi14: payload.rsi14 ?? undefined,
    macd: payload.macd ?? undefined,
    macdSignal: payload.macdSignal ?? undefined,
    macdHistogram: payload.macdHistogram ?? undefined,
    atr14: payload.atr14 ?? undefined,
    week52High: payload.week52High ?? undefined,
    week52Low: payload.week52Low ?? undefined,
    distanceFrom52wHigh: payload.distanceFrom52wHigh ?? undefined,
    distanceFrom52wLow: payload.distanceFrom52wLow ?? undefined,
    aboveSma20: payload.aboveSma20,
    aboveSma50: payload.aboveSma50,
    aboveSma100: payload.aboveSma100,
    aboveSma200: payload.aboveSma200,
    aboveEma20: payload.aboveEma20,
    aboveEma50: payload.aboveEma50,
    aboveEma100: payload.aboveEma100,
    aboveEma200: payload.aboveEma200,
    crossover2050: payload.crossover2050,
    crossover50100: payload.crossover50100,
    crossover50200: payload.crossover50200,
    bullishMacdCross: payload.bullishMacdCross,
    bearishMacdCross: payload.bearishMacdCross,
    new52wHigh: payload.new52wHigh,
    new52wLow: payload.new52wLow,
    candleDate: payload.candleDate,
  };

  await (prisma as any).stockMetrics.upsert({
    where: { symbol: payload.symbol },
    update: data,
    create: { symbol: payload.symbol, ...data },
  });
}

// ─── Batch upsert all symbols ─────────────────────────────────────────────────

export interface UpsertResult {
  totalSymbols: number;
  successful: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export async function runMetricsUpsertForAllSymbols(): Promise<UpsertResult> {
  const startTime = Date.now();
  logger.info('[MetricsUpsert] Starting full metrics upsert job...');

  // Get all distinct symbols in the candles table
  const symbolRows = await prisma.candle.findMany({
    distinct: ['symbol'],
    select: { symbol: true },
  });

  const allSymbols = symbolRows.map(r => r.symbol);
  logger.info(`[MetricsUpsert] Found ${allSymbols.length} symbols to process.`);

  // Throttle to 20 concurrent DB reads to avoid overwhelming Neon connection pool
  const limit = pLimit(20);
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  await Promise.all(
    allSymbols.map(symbol =>
      limit(async () => {
        const meta = metadataMap.get(symbol) ?? {
          companyName: symbol,
          sector: 'Unknown',
          marketCapCategory: 'unknown',
          industry: 'Unknown',
        };

        try {
          const metrics = await computeMetricsForSymbol(
            symbol,
            meta.companyName,
            meta.sector,
            meta.marketCapCategory,
          );

          if (!metrics) {
            skipped++;
            return;
          }

          await upsertMetric(metrics);
          successful++;
          logger.info(`[MetricsUpsert] ✓ ${symbol}`);
        } catch (err) {
          failed++;
          logger.error(`[MetricsUpsert] ✗ ${symbol}`, { err });
        }
      })
    )
  );

  const durationMs = Date.now() - startTime;
  const result: UpsertResult = { totalSymbols: allSymbols.length, successful, failed, skipped, durationMs };
  logger.info(`[MetricsUpsert] Completed. Successful: ${successful}, Failed: ${failed}, Skipped: ${skipped}, Duration: ${durationMs}ms`);

  return result;
}
