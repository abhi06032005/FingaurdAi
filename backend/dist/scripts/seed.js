"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
const logger_1 = require("../utils/logger");
const bcrypt_1 = __importDefault(require("bcrypt"));
const SEED_COMPANIES = [
    { ticker: 'TCS', companyName: 'Tata Consultancy Services Limited' },
    { ticker: 'RELIANCE', companyName: 'Reliance Industries Limited' },
    { ticker: 'INFY', companyName: 'Infosys Limited' },
    { ticker: 'HDFCBANK', companyName: 'HDFC Bank Limited' },
    { ticker: 'ICICIBANK', companyName: 'ICICI Bank Limited' },
    { ticker: 'LT', companyName: 'Larsen & Toubro Limited' },
];
async function main() {
    logger_1.logger.info('[Seed] Starting database seed...');
    // 1. Seed Tickers
    for (const company of SEED_COMPANIES) {
        await prisma_1.prisma.company.upsert({
            where: { ticker: company.ticker },
            update: { companyName: company.companyName },
            create: {
                ticker: company.ticker,
                companyName: company.companyName,
            },
        });
        logger_1.logger.info(`[Seed] Upserted company: ${company.ticker}`);
    }
    // 2. Seed Admin User
    const adminEmail = 'abhi@finguard.com';
    const hashedPassword = await bcrypt_1.default.hash('12345', 10);
    await prisma_1.prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            name: 'abhi',
            password: hashedPassword,
            role: 'ADMIN',
        },
        create: {
            name: 'abhi',
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    logger_1.logger.info(`[Seed] Upserted Admin user: abhi (email: ${adminEmail}, password: 12345)`);
    logger_1.logger.info('[Seed] Database seed completed successfully!');
}
main()
    .catch((e) => {
    logger_1.logger.error(`[Seed] Seed failed: ${e.message}`);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
