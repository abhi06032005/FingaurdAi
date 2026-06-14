import { AllIndicatorResults } from '../indicators/indicatorOrchestrator';
import { round } from '../../utils/mathUtils';

export interface Signal {
  indicator: string;
  value: string;
  signal: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
}

/**
 * Evaluates indicators and generates descriptive educational signals.
 * STRICT POLICY: Absolutely no recommendations, return forecasts, or restricted vocabulary.
 */
export function generateSignals(indicators: AllIndicatorResults, currentPrice: number): Signal[] {
  const signals: Signal[] = [];

  // 1. RSI
  const rsiResult = indicators.momentum.rsi;
  if (rsiResult !== null) {
    const rsi = rsiResult.value;
    let signalText = 'Neutral Zone';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';

    if (rsi < 30) {
      signalText = 'Oversold Zone';
      direction = 'neutral';
      strength = 'moderate';
    } else if (rsi >= 30 && rsi < 45) {
      signalText = 'Recovering from Oversold';
      direction = 'bullish';
      strength = 'moderate';
    } else if (rsi >= 45 && rsi <= 55) {
      signalText = 'Neutral Zone';
      direction = 'neutral';
      strength = 'weak';
    } else if (rsi > 55 && rsi <= 70) {
      signalText = 'Approaching Overbought';
      direction = 'bearish';
      strength = 'moderate';
    } else if (rsi > 70) {
      signalText = 'Overbought Zone';
      direction = 'neutral';
      strength = 'moderate';
    }

    signals.push({
      indicator: 'RSI (14)',
      value: round(rsi, 1).toString(),
      signal: signalText,
      direction,
      strength,
    });
  }

  // 2. MACD
  const macd = indicators.momentum.macd;
  if (macd !== null) {
    let signalText = 'No Significant Crossover';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';

    if (macd.crossoverDetected) {
      if (macd.crossoverDirection === 'bullish' && macd.histogram > 0) {
        signalText = 'Bullish Momentum Crossover';
        direction = 'bullish';
        strength = 'strong';
      } else if (macd.crossoverDirection === 'bearish' && macd.histogram < 0) {
        signalText = 'Bearish Momentum Crossover';
        direction = 'bearish';
        strength = 'strong';
      }
    } else if (macd.histogramExpanding) {
      signalText = 'Strengthening Bullish Momentum';
      direction = 'bullish';
      strength = 'moderate';
    } else if (macd.histogramContracting) {
      signalText = 'Weakening Momentum';
      direction = 'neutral';
      strength = 'weak';
    }

    signals.push({
      indicator: 'MACD (12/26/9)',
      value: `Hist: ${round(macd.histogram, 2)}`,
      signal: signalText,
      direction,
      strength,
    });
  }

  // 3. Moving Averages
  const trend = indicators.trend;
  if (trend.sma50 !== null && trend.sma200 !== null) {
    if (currentPrice > trend.sma200 && trend.sma50 > trend.sma200) {
      signals.push({
        indicator: 'SMA Trend Stack',
        value: `Price > SMA200 (${round(trend.sma200, 1)})`,
        signal: 'Above Long-Term Trend — Golden Cross Active',
        direction: 'bullish',
        strength: 'strong',
      });
    } else if (currentPrice > trend.sma200 && trend.sma50 < trend.sma200) {
      signals.push({
        indicator: 'SMA Trend Stack',
        value: `Price > SMA200 (${round(trend.sma200, 1)})`,
        signal: 'Above Long-Term Average — No Cross Yet',
        direction: 'bullish',
        strength: 'moderate',
      });
    } else if (currentPrice < trend.sma200) {
      signals.push({
        indicator: 'SMA Trend Stack',
        value: `Price < SMA200 (${round(trend.sma200, 1)})`,
        signal: 'Below Long-Term Trend',
        direction: 'bearish',
        strength: 'strong',
      });
    }

    if (trend.sma50 > trend.sma200) {
      signals.push({
        indicator: 'SMA Crossover',
        value: `SMA50 > SMA200`,
        signal: 'Golden Cross Formation',
        direction: 'bullish',
        strength: 'strong',
      });
    } else {
      signals.push({
        indicator: 'SMA Crossover',
        value: `SMA50 < SMA200`,
        signal: 'Death Cross Formation',
        direction: 'bearish',
        strength: 'strong',
      });
    }
  }

  if (trend.sma50 !== null) {
    signals.push({
      indicator: 'SMA 50',
      value: round(trend.sma50, 1).toString(),
      signal: currentPrice > trend.sma50 ? 'Above Medium-Term Average' : 'Below Medium-Term Average',
      direction: currentPrice > trend.sma50 ? 'bullish' : 'bearish',
      strength: 'moderate',
    });
  }

  // 4. Bollinger Bands
  const bb = indicators.volatility.bollingerBands;
  if (bb !== null) {
    if (currentPrice > bb.upper) {
      signals.push({
        indicator: 'Bollinger Bands',
        value: `Price > Upper (${round(bb.upper, 1)})`,
        signal: 'Price Outside Upper Band',
        direction: 'bearish',
        strength: 'moderate',
      });
    } else if (currentPrice < bb.lower) {
      signals.push({
        indicator: 'Bollinger Bands',
        value: `Price < Lower (${round(bb.lower, 1)})`,
        signal: 'Price Outside Lower Band',
        direction: 'bullish',
        strength: 'moderate',
      });
    }

    if (bb.percentB > 0.8) {
      signals.push({
        indicator: 'Bollinger %B',
        value: round(bb.percentB, 2).toString(),
        signal: 'Upper Band Pressure',
        direction: 'bearish',
        strength: 'weak',
      });
    } else if (bb.percentB < 0.2) {
      signals.push({
        indicator: 'Bollinger %B',
        value: round(bb.percentB, 2).toString(),
        signal: 'Lower Band Pressure',
        direction: 'bullish',
        strength: 'weak',
      });
    }

    if (bb.bandwidthState === 'contracting') {
      signals.push({
        indicator: 'Bollinger Bandwidth',
        value: round(bb.bandwidth, 3).toString(),
        signal: 'Volatility Squeeze — Watch for Expansion',
        direction: 'neutral',
        strength: 'moderate',
      });
    } else if (bb.bandwidthState === 'expanding') {
      signals.push({
        indicator: 'Bollinger Bandwidth',
        value: round(bb.bandwidth, 3).toString(),
        signal: 'Volatility Expanding',
        direction: 'neutral',
        strength: 'moderate',
      });
    }
  }

  // 5. ADX
  const adx = indicators.trend.adx;
  if (adx !== null) {
    let signalText = 'Developing Trend';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';

    if (adx.adx > 40) {
      if (adx.plusDI > adx.minusDI) {
        signalText = 'Very Strong Upward Trend';
        direction = 'bullish';
        strength = 'strong';
      } else {
        signalText = 'Very Strong Downward Trend';
        direction = 'bearish';
        strength = 'strong';
      }
    } else if (adx.adx >= 25 && adx.adx <= 40) {
      if (adx.plusDI > adx.minusDI) {
        signalText = 'Strong Upward Trend Pressure';
        direction = 'bullish';
        strength = 'moderate';
      } else {
        signalText = 'Strong Downward Trend Pressure';
        direction = 'bearish';
        strength = 'moderate';
      }
    } else if (adx.adx >= 20 && adx.adx < 25) {
      signalText = 'Developing Trend';
      direction = 'neutral';
      strength = 'weak';
    } else {
      signalText = 'Weak / Sideways Market';
      direction = 'neutral';
      strength = 'weak';
    }

    signals.push({
      indicator: 'ADX (14)',
      value: round(adx.adx, 1).toString(),
      signal: signalText,
      direction,
      strength,
    });
  }

  // 6. Stochastic RSI
  const stoch = indicators.momentum.stochasticRsi;
  if (stoch !== null) {
    let signalText = 'Mid-Range Stochastic';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';

    if (stoch.k > 80) {
      signalText = 'Overbought Stochastic';
      direction = 'neutral';
      strength = 'moderate';
    } else if (stoch.k < 20) {
      signalText = 'Oversold Stochastic';
      direction = 'neutral';
      strength = 'moderate';
    } else if (stoch.crossover === 'bullish') {
      signalText = 'Stochastic Bullish Crossover';
      direction = 'bullish';
      strength = 'moderate';
    } else if (stoch.crossover === 'bearish') {
      signalText = 'Stochastic Bearish Crossover';
      direction = 'bearish';
      strength = 'moderate';
    }

    signals.push({
      indicator: 'Stoch RSI',
      value: `K: ${round(stoch.k, 1)}`,
      signal: signalText,
      direction,
      strength,
    });
  }

  // 7. OBV
  const obv = indicators.volume.obv;
  if (obv !== null) {
    let signalText = 'Volume Neutral';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';

    if (obv.slope === 'rising') {
      signalText = 'Volume Supporting Price Action';
      direction = 'bullish';
      strength = 'moderate';
    } else if (obv.slope === 'falling') {
      signalText = 'Volume Diverging from Price';
      direction = 'bearish';
      strength = 'moderate';
    }

    signals.push({
      indicator: 'OBV',
      value: round(obv.obv, 0).toString(),
      signal: signalText,
      direction,
      strength,
    });
  }

  return signals;
}
