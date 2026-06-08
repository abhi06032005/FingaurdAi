"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyRepository = void 0;
const prisma_1 = require("../config/prisma");
class CompanyRepository {
    static async findByTicker(ticker) {
        return prisma_1.prisma.company.findUnique({
            where: { ticker: ticker.toUpperCase() },
        });
    }
    static async findById(id) {
        return prisma_1.prisma.company.findUnique({
            where: { id },
        });
    }
    static async listAll() {
        return prisma_1.prisma.company.findMany({
            orderBy: { ticker: 'asc' },
        });
    }
    static async upsertCompany(ticker, data) {
        const formattedTicker = ticker.toUpperCase();
        return prisma_1.prisma.company.upsert({
            where: { ticker: formattedTicker },
            update: {
                ...data,
                lastUpdated: new Date(),
            },
            create: {
                ticker: formattedTicker,
                ...data,
            },
        });
    }
}
exports.CompanyRepository = CompanyRepository;
