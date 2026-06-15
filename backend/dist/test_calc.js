"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const indicatorOrchestrator_1 = require("./services/indicators/indicatorOrchestrator");
const signalEngine_1 = require("./services/signals/signalEngine");
const technicalScorer_1 = require("./services/scoring/technicalScorer");
const confluenceEngine_1 = require("./services/scoring/confluenceEngine");
// Mock a sequence of 100 candle close prices
const mockCloses = Array.from({ length: 100 }, (_, i) => {
    const basePrice = 100 + i * 0.5;
    const cycle = Math.sin(i * 0.1) * 10;
    return basePrice + cycle;
});
const mockHighs = mockCloses.map(p => p * 1.02);
const mockLows = mockCloses.map(p => p * 0.98);
const mockVolumes = Array.from({ length: 100 }, () => Math.floor(Math.random() * 100000) + 10000);
const mockCandles = mockCloses.map((c, i) => ({
    close: c,
    high: mockHighs[i],
    low: mockLows[i],
    volume: BigInt(mockVolumes[i]),
    open: (mockHighs[i] + mockLows[i]) / 2,
}));
console.log('--- Technical Analysis Engine Test ---');
console.log(`Testing with ${mockCandles.length} mock daily candles.`);
const indicators = (0, indicatorOrchestrator_1.calculateAllIndicators)(mockCandles);
console.log('\n[Indicators calculated successfully]');
console.log('RSI (14):', indicators.momentum.rsi?.value);
console.log('MACD:', indicators.momentum.macd ? {
    macd: indicators.momentum.macd.macd,
    signal: indicators.momentum.macd.signal,
    histogram: indicators.momentum.macd.histogram,
} : 'N/A');
console.log('Stoch RSI K:', indicators.momentum.stochasticRsi?.k);
console.log('SMA 50:', indicators.trend.sma50);
console.log('SMA 200:', indicators.trend.sma200);
console.log('ADX (14):', indicators.trend.adx?.adx);
console.log('OBV Slope:', indicators.volume.obv?.slope);
const currentPrice = mockCloses[mockCloses.length - 1];
const signals = (0, signalEngine_1.generateSignals)(indicators, currentPrice);
console.log('\n[Generated Signals (First 3 & Last 2)]');
signals.slice(0, 3).forEach(s => {
    console.log(`- ${s.indicator}: ${s.signal} (${s.direction.toUpperCase()} - ${s.strength.toUpperCase()})`);
});
if (signals.length > 5) {
    console.log('...');
    signals.slice(-2).forEach(s => {
        console.log(`- ${s.indicator}: ${s.signal} (${s.direction.toUpperCase()} - ${s.strength.toUpperCase()})`);
    });
}
const scoreResult = (0, technicalScorer_1.calculateTechnicalScore)(indicators, currentPrice);
console.log('\n[Strength Score & Rating]');
console.log('Score:', scoreResult.technicalScore);
console.log('Rating:', scoreResult.technicalRating);
console.log('Breakdown:', scoreResult.scoreBreakdown);
const confluence = (0, confluenceEngine_1.calculateConfluence)(signals);
console.log('Confluence:', confluence + '%');
// Check vocabulary rules
console.log('\n[Vocabulary Rule Check]');
const forbiddenWords = ['buy', 'sell', 'long', 'short', 'target', 'stop loss', 'entry', 'exit', 'accumulate', 'invest'];
let violations = 0;
const checkText = JSON.stringify({ indicators, signals, scoreResult, confluence }).toLowerCase();
forbiddenWords.forEach(word => {
    if (checkText.includes(word)) {
        console.error(`!!! VIOLATION DETECTED: Word "${word}" exists in calculations or signals output!`);
        violations++;
    }
});
if (violations === 0) {
    console.log('✔ SUCCESS: All vocabulary restrictions satisfied! No forbidden words in outputs.');
}
else {
    console.error(`!!! FAILURE: Found ${violations} forbidden word violations in output payload!`);
}
