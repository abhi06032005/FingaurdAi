import prisma from './config/prisma';

async function run() {
  try {
    console.log("Fetching cached technical analysis records...");
    const caches = await prisma.technicalAnalysisCache.findMany();
    console.log(`Found ${caches.length} cached records.`);

    const records = caches.map(c => {
      const result = c.resultJson as any;
      return {
        rowSymbol: c.symbol,
        jsonSymbol: result?.symbol,
        jsonCompany: result?.companyName,
        jsonPrice: result?.currentPrice
      };
    });
    console.table(records);
  } catch (err: any) {
    console.error("Query failed:", err.message);
  }
}

run();
