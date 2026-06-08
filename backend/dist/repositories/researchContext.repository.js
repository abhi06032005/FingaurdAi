"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchContextRepository = void 0;
const prisma_1 = require("../config/prisma");
class ResearchContextRepository {
    static async findByCompanyId(companyId) {
        return prisma_1.prisma.companyResearchContext.findUnique({
            where: { companyId },
        });
    }
    static async findByTicker(ticker) {
        const formattedTicker = ticker.toUpperCase();
        return prisma_1.prisma.companyResearchContext.findFirst({
            where: {
                company: {
                    ticker: formattedTicker,
                },
            },
            include: {
                company: true,
            },
        });
    }
    static async upsertResearchContext(companyId, contextJson) {
        return prisma_1.prisma.companyResearchContext.upsert({
            where: { companyId },
            update: {
                researchContextJson: contextJson,
                lastUpdated: new Date(),
            },
            create: {
                companyId,
                researchContextJson: contextJson,
            },
        });
    }
}
exports.ResearchContextRepository = ResearchContextRepository;
