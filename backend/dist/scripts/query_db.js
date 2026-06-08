"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
async function test() {
    try {
        const companies = await prisma_1.prisma.company.findMany({
            include: {
                researchContext: true,
            }
        });
        console.log("Found companies:", companies.map((c) => ({
            id: c.id,
            ticker: c.ticker,
            name: c.companyName,
            hasContext: !!c.researchContext,
            lastUpdated: c.researchContext?.lastUpdated
        })));
    }
    catch (err) {
        console.error("DB error:", err);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
test();
