"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConfluence = calculateConfluence;
const mathUtils_1 = require("../../utils/mathUtils");
/**
 * Calculates the percentage of signals in agreement (either bullish or bearish).
 * @param signals List of generated signals.
 */
function calculateConfluence(signals) {
    if (signals.length === 0)
        return 0;
    let bullishCount = 0;
    let bearishCount = 0;
    for (const s of signals) {
        if (s.direction === 'bullish') {
            bullishCount++;
        }
        else if (s.direction === 'bearish') {
            bearishCount++;
        }
    }
    const maxAgreement = Math.max(bullishCount, bearishCount);
    const confluenceScore = (maxAgreement / signals.length) * 100;
    return (0, mathUtils_1.round)(confluenceScore, 1);
}
