"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockDataRepository = void 0;
const prisma_1 = require("../config/prisma");
class StockDataRepository {
    /**
     * Business Intelligence (1-to-1)
     */
    static async upsertBusinessIntelligence(companyId, data) {
        return prisma_1.prisma.businessIntelligence.upsert({
            where: { companyId },
            update: {
                ...data,
                lastUpdated: new Date(),
            },
            create: {
                companyId,
                ...data,
            },
        });
    }
    /**
     * Business Segments (1-to-many, yearly)
     */
    static async replaceBusinessSegments(companyId, segments) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.businessSegment.deleteMany({ where: { companyId } }),
            prisma_1.prisma.businessSegment.createMany({
                data: segments.map((seg) => ({ ...seg, companyId })),
            }),
        ]);
    }
    /**
     * Financial Growth (1-to-many, yearly)
     */
    static async replaceFinancialGrowth(companyId, financials) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.financialGrowth.deleteMany({ where: { companyId } }),
            prisma_1.prisma.financialGrowth.createMany({
                data: financials.map((fin) => ({ ...fin, companyId })),
            }),
        ]);
    }
    /**
     * Quality Metrics (1-to-many, yearly)
     */
    static async replaceQualityMetrics(companyId, metrics) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.qualityMetrics.deleteMany({ where: { companyId } }),
            prisma_1.prisma.qualityMetrics.createMany({
                data: metrics.map((met) => ({ ...met, companyId })),
            }),
        ]);
    }
    /**
     * Valuation Metrics (1-to-1)
     */
    static async upsertValuationMetrics(companyId, data) {
        return prisma_1.prisma.valuationMetrics.upsert({
            where: { companyId },
            update: {
                ...data,
                lastUpdated: new Date(),
            },
            create: {
                companyId,
                ...data,
            },
        });
    }
    /**
     * Ownership History (1-to-many, quarterly)
     */
    static async replaceOwnershipHistory(companyId, history) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.ownershipHistory.deleteMany({ where: { companyId } }),
            prisma_1.prisma.ownershipHistory.createMany({
                data: history.map((own) => ({ ...own, companyId })),
            }),
        ]);
    }
    /**
     * Corporate Developments (1-to-many, incremental updates)
     * Avoids duplicate corporate developments by checking date + title.
     */
    static async insertCorporateDevelopmentsIncremental(companyId, developments) {
        let insertedCount = 0;
        for (const dev of developments) {
            const exists = await prisma_1.prisma.corporateDevelopment.findFirst({
                where: {
                    companyId,
                    announcementDate: dev.announcementDate,
                    title: dev.title,
                },
            });
            if (!exists) {
                await prisma_1.prisma.corporateDevelopment.create({
                    data: {
                        ...dev,
                        companyId,
                    },
                });
                insertedCount++;
            }
        }
        return insertedCount;
    }
    /**
     * Growth Drivers (1-to-many)
     */
    static async replaceGrowthDrivers(companyId, drivers) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.growthDriver.deleteMany({ where: { companyId } }),
            prisma_1.prisma.growthDriver.createMany({
                data: drivers.map((drv) => ({ ...drv, companyId })),
            }),
        ]);
    }
    /**
     * Company Risks (1-to-many)
     */
    static async replaceCompanyRisks(companyId, risks) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.companyRisk.deleteMany({ where: { companyId } }),
            prisma_1.prisma.companyRisk.createMany({
                data: risks.map((risk) => ({ ...risk, companyId })),
            }),
        ]);
    }
    /**
     * Order Book Data (1-to-many)
     */
    static async replaceOrderBookData(companyId, orderBook) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.orderBookData.deleteMany({ where: { companyId } }),
            prisma_1.prisma.orderBookData.createMany({
                data: orderBook.map((ob) => ({ ...ob, companyId })),
            }),
        ]);
    }
    /**
     * Management Commentary (1-to-many)
     */
    static async replaceManagementCommentary(companyId, commentary) {
        return prisma_1.prisma.$transaction([
            prisma_1.prisma.managementCommentary.deleteMany({ where: { companyId } }),
            prisma_1.prisma.managementCommentary.createMany({
                data: commentary.map((comm) => ({ ...comm, companyId })),
            }),
        ]);
    }
}
exports.StockDataRepository = StockDataRepository;
