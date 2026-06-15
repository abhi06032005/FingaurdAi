"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./config/prisma"));
async function run() {
    try {
        console.log("Querying newest candles for TCS.NS...");
        const last5 = await prisma_1.default.candle.findMany({
            where: { symbol: 'TCS.NS' },
            orderBy: { date: 'desc' },
            take: 5
        });
        console.log("Last 5 candles for TCS.NS:", last5.map(c => ({
            date: c.date.toISOString().split('T')[0],
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
        })));
    }
    catch (err) {
        console.error("Query failed:", err.message);
    }
}
run();
