"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./config/prisma"));
async function run() {
    try {
        console.log("Fetching cached technical analysis records...");
        const caches = await prisma_1.default.technicalAnalysisCache.findMany();
        console.log(`Found ${caches.length} cached records.`);
        const records = caches.map(c => {
            const result = c.resultJson;
            return {
                rowSymbol: c.symbol,
                jsonSymbol: result?.symbol,
                jsonCompany: result?.companyName,
                jsonPrice: result?.currentPrice
            };
        });
        console.table(records);
    }
    catch (err) {
        console.error("Query failed:", err.message);
    }
}
run();
