"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = round;
exports.calculateSlope = calculateSlope;
/**
 * Rounds a number to the specified number of decimal places.
 */
function round(value, decimals) {
    if (isNaN(value) || !isFinite(value)) {
        return 0;
    }
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
/**
 * Calculates the slope of a numeric array.
 * Uses simple linear regression to return the slope.
 */
function calculateSlope(values) {
    const n = values.length;
    if (n < 2)
        return 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i++) {
        const x = i;
        const y = values[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0)
        return 0;
    return (n * sumXY - sumX * sumY) / denominator;
}
