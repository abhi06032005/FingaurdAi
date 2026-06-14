import prisma from './config/prisma';

async function run() {
  try {
    console.log("Querying newest candles for TCS.NS...");
    const last5 = await prisma.candle.findMany({
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
  } catch (err: any) {
    console.error("Query failed:", err.message);
  }
}

run();
