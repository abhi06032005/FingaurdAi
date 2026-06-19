import { SMA, EMA, RSI, MACD, ATR } from 'technicalindicators';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockMetricsPayload {
  symbol: string;
  companyName: string;
  sector: string;
  marketCapCategory: string;

  closePrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;

  changePct: number;
  gapPct: number;

  volumeToday: bigint;
  avgVolume20: bigint;
  avgVolume50: bigint;
  volumeRatio: number;

  sma20: number | null;
  sma50: number | null;
  sma100: number | null;
  sma200: number | null;

  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;

  rsi14: number | null;

  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;

  atr14: number | null;

  week52High: number | null;
  week52Low: number | null;
  distanceFrom52wHigh: number | null;
  distanceFrom52wLow: number | null;

  aboveSma20: boolean;
  aboveSma50: boolean;
  aboveSma100: boolean;
  aboveSma200: boolean;
  aboveEma20: boolean;
  aboveEma50: boolean;
  aboveEma100: boolean;
  aboveEma200: boolean;

  crossover2050: boolean;
  crossover50100: boolean;
  crossover50200: boolean;

  bullishMacdCross: boolean;
  bearishMacdCross: boolean;

  new52wHigh: boolean;
  new52wLow: boolean;

  candleDate: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const result = SMA.calculate({ period, values: closes });
  return result.length > 0 ? result[result.length - 1] : null;
}

function calcSMAFull(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  return SMA.calculate({ period, values: closes });
}

function calcEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const result = EMA.calculate({ period, values: closes });
  return result.length > 0 ? result[result.length - 1] : null;
}

function calcEMAFull(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  return EMA.calculate({ period, values: closes });
}

function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  const result = RSI.calculate({ period, values: closes });
  return result.length > 0 ? result[result.length - 1] : null;
}

function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < 35) return null;
  const result = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  if (result.length < 1) return null;
  const last = result[result.length - 1];
  if (last.MACD === undefined || last.signal === undefined || last.histogram === undefined) return null;
  return { macd: last.MACD, signal: last.signal, histogram: last.histogram };
}

function calcMACDFull(closes: number[]): Array<{ macd?: number; signal?: number; histogram?: number }> {
  if (closes.length < 35) return [];
  return MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  try {
    const result = ATR.calculate({ period, high: highs, low: lows, close: closes });
    return result.length > 0 ? result[result.length - 1] : null;
  } catch {
    return null;
  }
}

function calcAvgVolume(volumes: bigint[], period: number): bigint {
  if (volumes.length < period) {
    const sum = volumes.reduce((acc, v) => acc + v, 0n);
    return volumes.length > 0 ? sum / BigInt(volumes.length) : 0n;
  }
  const slice = volumes.slice(-period);
  const sum = slice.reduce((acc, v) => acc + v, 0n);
  return sum / BigInt(period);
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

/**
 * Computes all screener metrics for a single symbol.
 * Requires at least 252 candles for full accuracy (52-week calculations).
 * Falls back gracefully with nulls for indicators that need more data.
 */
export async function computeMetricsForSymbol(
  symbol: string,
  companyName: string,
  sector: string,
  marketCapCategory: string,
): Promise<StockMetricsPayload | null> {
  try {
    // Fetch last 260 candles (> 252 trading days = ~1 year)
    const candles = await prisma.candle.findMany({
      where: { symbol },
      orderBy: { date: 'asc' },
      take: 260,
      select: { date: true, open: true, high: true, low: true, close: true, volume: true },
    });

    if (candles.length < 2) {
      logger.warn(`[IndicatorEngine] Skipping ${symbol}: insufficient candles (${candles.length})`);
      return null;
    }

    const closes = candles.map(c => Number(c.close));
    const opens = candles.map(c => Number(c.open));
    const highs = candles.map(c => Number(c.high));
    const lows = candles.map(c => Number(c.low));
    const volumes = candles.map(c => c.volume as bigint);

    const latestCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];

    const closeToday = closes[closes.length - 1];
    const openToday = opens[opens.length - 1];
    const highToday = highs[highs.length - 1];
    const lowToday = lows[lows.length - 1];
    const prevClose = closes[closes.length - 2];

    const changePct = prevClose > 0 ? ((closeToday - prevClose) / prevClose) * 100 : 0;
    const gapPct = prevClose > 0 ? ((openToday - prevClose) / prevClose) * 100 : 0;

    // Volume
    const volumeToday = volumes[volumes.length - 1];
    const avgVolume20 = calcAvgVolume(volumes.slice(0, -1), 20);
    const avgVolume50 = calcAvgVolume(volumes.slice(0, -1), 50);
    const volumeRatio = avgVolume20 > 0n ? Number(volumeToday) / Number(avgVolume20) : 1;

    // SMAs
    const sma20 = calcSMA(closes, 20);
    const sma50 = calcSMA(closes, 50);
    const sma100 = calcSMA(closes, 100);
    const sma200 = calcSMA(closes, 200);

    // EMAs
    const ema20 = calcEMA(closes, 20);
    const ema50 = calcEMA(closes, 50);
    const ema100 = calcEMA(closes, 100);
    const ema200 = calcEMA(closes, 200);

    // RSI
    const rsi14 = calcRSI(closes, 14);

    // MACD
    const macdResult = calcMACD(closes);

    // ATR
    const atr14 = calcATR(highs, lows, closes, 14);

    // 52-week high/low (use all available candles up to prev day)
    const historicalCloses = closes.slice(0, -1);
    const historicalHighs = highs.slice(0, -1);
    const historicalLows = lows.slice(0, -1);
    const week52High = historicalHighs.length > 0 ? Math.max(...historicalHighs) : null;
    const week52Low = historicalLows.length > 0 ? Math.min(...historicalLows) : null;

    const distanceFrom52wHigh = week52High && week52High > 0
      ? ((week52High - closeToday) / week52High) * 100
      : null;
    const distanceFrom52wLow = week52Low && week52Low > 0
      ? ((closeToday - week52Low) / week52Low) * 100
      : null;

    // Boolean flags
    const aboveSma20 = sma20 !== null ? closeToday > sma20 : false;
    const aboveSma50 = sma50 !== null ? closeToday > sma50 : false;
    const aboveSma100 = sma100 !== null ? closeToday > sma100 : false;
    const aboveSma200 = sma200 !== null ? closeToday > sma200 : false;
    const aboveEma20 = ema20 !== null ? closeToday > ema20 : false;
    const aboveEma50 = ema50 !== null ? closeToday > ema50 : false;
    const aboveEma100 = ema100 !== null ? closeToday > ema100 : false;
    const aboveEma200 = ema200 !== null ? closeToday > ema200 : false;

    // Crossover detection — compare last 2 values of MA series
    let crossover2050 = false;
    let crossover50100 = false;
    let crossover50200 = false;

    const sma20Full = calcSMAFull(closes, 20);
    const sma50Full = calcSMAFull(closes, 50);
    const sma100Full = calcSMAFull(closes, 100);
    const sma200Full = calcSMAFull(closes, 200);

    if (sma20Full.length >= 2 && sma50Full.length >= 2) {
      const prevSma20 = sma20Full[sma20Full.length - 2];
      const currSma20 = sma20Full[sma20Full.length - 1];
      // Align arrays by taking matching-length tails
      const minLen50 = Math.min(sma20Full.length, sma50Full.length);
      const prevSma50 = sma50Full[sma50Full.length - (minLen50 > 1 ? 2 : 1)];
      const currSma50 = sma50Full[sma50Full.length - 1];
      crossover2050 = prevSma20 <= prevSma50 && currSma20 > currSma50;
    }

    if (sma50Full.length >= 2 && sma100Full.length >= 2) {
      const minLen = Math.min(sma50Full.length, sma100Full.length);
      const prevSma50 = sma50Full[sma50Full.length - (minLen > 1 ? 2 : 1)];
      const currSma50 = sma50Full[sma50Full.length - 1];
      const prevSma100 = sma100Full[sma100Full.length - (minLen > 1 ? 2 : 1)];
      const currSma100 = sma100Full[sma100Full.length - 1];
      crossover50100 = prevSma50 <= prevSma100 && currSma50 > currSma100;
    }

    if (sma50Full.length >= 2 && sma200Full.length >= 2) {
      const minLen = Math.min(sma50Full.length, sma200Full.length);
      const prevSma50 = sma50Full[sma50Full.length - (minLen > 1 ? 2 : 1)];
      const currSma50 = sma50Full[sma50Full.length - 1];
      const prevSma200 = sma200Full[sma200Full.length - (minLen > 1 ? 2 : 1)];
      const currSma200 = sma200Full[sma200Full.length - 1];
      crossover50200 = prevSma50 <= prevSma200 && currSma50 > currSma200;
    }

    // MACD crossover detection
    let bullishMacdCross = false;
    let bearishMacdCross = false;

    const macdFull = calcMACDFull(closes);
    if (macdFull.length >= 2) {
      const prev = macdFull[macdFull.length - 2];
      const curr = macdFull[macdFull.length - 1];
      if (prev.histogram !== undefined && curr.histogram !== undefined) {
        if (prev.histogram <= 0 && curr.histogram > 0) bullishMacdCross = true;
        if (prev.histogram >= 0 && curr.histogram < 0) bearishMacdCross = true;
      }
    }

    // 52-week milestone
    const new52wHigh = week52High !== null ? closeToday >= week52High : false;
    const new52wLow = week52Low !== null ? closeToday <= week52Low : false;

    return {
      symbol,
      companyName,
      sector,
      marketCapCategory,
      closePrice: closeToday,
      openPrice: openToday,
      highPrice: highToday,
      lowPrice: lowToday,
      changePct,
      gapPct,
      volumeToday,
      avgVolume20,
      avgVolume50,
      volumeRatio,
      sma20,
      sma50,
      sma100,
      sma200,
      ema20,
      ema50,
      ema100,
      ema200,
      rsi14,
      macd: macdResult?.macd ?? null,
      macdSignal: macdResult?.signal ?? null,
      macdHistogram: macdResult?.histogram ?? null,
      atr14,
      week52High,
      week52Low,
      distanceFrom52wHigh,
      distanceFrom52wLow,
      aboveSma20,
      aboveSma50,
      aboveSma100,
      aboveSma200,
      aboveEma20,
      aboveEma50,
      aboveEma100,
      aboveEma200,
      crossover2050,
      crossover50100,
      crossover50200,
      bullishMacdCross,
      bearishMacdCross,
      new52wHigh,
      new52wLow,
      candleDate: latestCandle.date,
    };
  } catch (err) {
    logger.error(`[IndicatorEngine] Error computing metrics for ${symbol}`, { err });
    return null;
  }
}
