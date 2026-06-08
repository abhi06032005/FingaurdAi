"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scraper_service_1 = require("../services/scraper.service");
const prisma_1 = require("../config/prisma");
const logger_1 = require("../utils/logger");
async function main() {
    const args = process.argv.slice(2);
    const tickerArgIndex = args.indexOf('--ticker');
    let ticker = '';
    if (tickerArgIndex !== -1 && args[tickerArgIndex + 1]) {
        ticker = args[tickerArgIndex + 1].trim().toUpperCase();
    }
    if (!ticker) {
        logger_1.logger.error('Usage: npx ts-node src/scripts/runScrapers.ts --ticker <ticker_symbol>');
        process.exit(1);
    }
    logger_1.logger.info(`[RunScrapers] Initiating manual ingestion and precomputation for ticker: ${ticker}`);
    try {
        const start = Date.now();
        const result = await scraper_service_1.ScraperService.scrapeCompany(ticker);
        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        logger_1.logger.info(`[RunScrapers] Successfully ingested and generated context for ${ticker} in ${elapsed}s`);
        // Output the precomputed context size/preview
        console.log(`\n✅ Precomputed Research Context generated successfully!`);
        console.log(`- Company Name: ${result.company.companyName}`);
        console.log(`- Sector: ${result.context.profile.sector}`);
        console.log(`- Industry: ${result.context.profile.industry}`);
        console.log(`- Cash Flow Years: ${result.context.growth.history.length}`);
        console.log(`- Risks Extracted: ${result.context.risks.length}`);
        console.log(`- Growth Drivers Extracted: ${result.context.growthDrivers.length}`);
        console.log(`- Management Commentary items: ${result.context.managementCommentary.length}`);
    }
    catch (error) {
        logger_1.logger.error(`[RunScrapers] Scraper run failed for ${ticker}: ${error.message}`);
        process.exit(1);
    }
}
main()
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
