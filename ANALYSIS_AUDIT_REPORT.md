# Stock Analysis Experience Audit Report

Generated before UI rebuild, per implementation requirement.

## 1. Correct Models

- ATR, ADX directional movement, stochastic, Williams %R, CCI, Bollinger Bands, VWAP, drawdown, realized volatility, pivot systems, and relative strength are directionally valid for daily OHLCV data.
- MACD, EMA, RSI, SMA, OBV, volume ratio, price percentile, return distribution, and z-score are useful when interpreted as context instead of recommendations.
- Historical analog search is an appropriate educational model when labelled as historical context, not prediction.

## 2. Incorrect or Fragile Models

- SMA and Bollinger calculations warmed up with partial windows, which can overstate early-period confidence. Latest 20/50 day readings are usable, but 200-day readings were not reliable when only 150 candles were fetched.
- RSI used a finite substitute when average loss was zero, which could cap a no-loss period below the expected 100 reading.
- OBV started at the first volume value instead of zero, making level comparisons less intuitive.
- Ichimoku is flattened into current-day values. It is acceptable for coarse context, but should not be presented as a full cloud model without explaining the simplification.
- Historical rolling Hurst in the regime timeline used a placeholder proxy. This must be replaced with a real rolling estimate.
- Daily confluence change used a mock decay proxy. It should be calculated from actual previous-day state.

## 3. Weak Models

- Hurst exponent is sample-sensitive with 150-300 daily bars and should receive lower reliability than price, volatility, and volume measures.
- Autocorrelation is noisy on short daily windows and should be educational context only.
- Sharpe and Sortino are unstable over short windows and should not be headline metrics.
- CCI, Williams %R, and stochastic overlap heavily with RSI-style momentum and should not be displayed as separate headline cards.

## 4. Redundant Models

- SMA, EMA, MACD, ADX, and trend score all describe overlapping price trend information.
- RSI, stochastic, Williams %R, CCI, and Bollinger %B all describe stretched or compressed price behaviour.
- ATR, Bollinger width, z-score, realized volatility, and drawdown all describe risk or dispersion from different angles.
- OBV, volume SMA, volume ratio, VWAP, and volume profile should be grouped into a volume participation engine instead of scattered cards.

## 5. Reliability Rankings

| Model | Reliability | Rationale |
| --- | ---: | --- |
| Drawdown analytics | 91 | Directly observed from price path and easy to interpret. |
| Realized volatility | 88 | Strong statistical basis, but sensitive to volatility clustering. |
| SMA/EMA trend | 86 | Robust and intuitive, but overlapping. |
| ATR | 84 | Stable range measure with clear meaning. |
| ADX | 82 | Useful trend strength measure, but lagging. |
| VWAP/volume ratio | 80 | Practical participation context, dependent on volume data quality. |
| RSI | 78 | Useful but noisy around thresholds. |
| MACD | 76 | Good for trend/momentum transition, overlapping with EMAs. |
| Bollinger/z-score | 74 | Useful context, can overreact in regime shifts. |
| Volume profile | 72 | Helpful participation map, coarse with limited buckets. |
| OBV | 69 | Useful directionally, but level is arbitrary. |
| Sharpe/Sortino | 64 | Too sample-sensitive for headline display. |
| Hurst exponent | 61 | Educational, but fragile with short daily samples. |
| Autocorrelation | 58 | Very noisy on 150-300 daily bars. |

## 6. Suggested Replacements

- Replace isolated indicator cards with grouped engines: Price Behaviour, Volume Behaviour, Market Structure, Historical Context, Recent Change, Market DNA, and Confidence.
- Replace equal-weight confluence with category-level scoring and reliability-adjusted confidence.
- Replace metric dumps with agreement/disagreement statements across trend, momentum, volume, and volatility families.
- Replace raw AI technical summary with a 150-word plain-language market context summary.

## 7. New Model Recommendations

- Model reliability framework with a 0-100 score per model.
- Cross-model consistency engine for agreement and disagreement.
- Regime timeline using rolling Hurst, efficiency ratio, ADX, realized volatility, and drawdown.
- Historical analog engine using cosine similarity and subsequent historical distributions, labelled as context only.
- Volume pressure engine combining volume ratio, OBV direction, VWAP position, and point-of-control context.
- Confidence score based on agreement, regime stability, data sufficiency, volatility consistency, and reliability.

## 8. UI Redesign Recommendations

- Lead with a snapshot that explains current price, daily change, percentile, structure, confidence, and data window.
- Make "What changed since yesterday" a prominent early section.
- Use plain-language info tooltips on every panel and chart.
- Collapse repeated indicators into narrative engines with waterfall bars, gauges, timelines, histograms, and radar views.
- Keep advanced metrics accessible through expandable drill-downs, but avoid making them the first thing a beginner sees.
- Do not present any metric as a forecast, target price, or recommendation.
