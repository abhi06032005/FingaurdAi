"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementCommentaryValidator = exports.OrderBookDataValidator = exports.CompanyRiskValidator = exports.GrowthDriverValidator = exports.CorporateDevelopmentValidator = exports.OwnershipHistoryValidator = exports.ValuationMetricsValidator = exports.QualityMetricsValidator = exports.FinancialGrowthValidator = exports.BusinessSegmentValidator = exports.BusinessIntelligenceValidator = exports.CompanyValidator = void 0;
const zod_1 = require("zod");
exports.CompanyValidator = zod_1.z.object({
    ticker: zod_1.z.string().min(1),
    companyName: zod_1.z.string().min(1),
    isin: zod_1.z.string().nullable().optional(),
    sector: zod_1.z.string().nullable().optional(),
    industry: zod_1.z.string().nullable().optional(),
    marketCap: zod_1.z.number().nullable().optional(),
    website: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    headquarters: zod_1.z.string().nullable().optional(),
    employees: zod_1.z.number().nullable().optional(),
    listingDate: zod_1.z.date().nullable().optional(),
});
exports.BusinessIntelligenceValidator = zod_1.z.object({
    businessSummary: zod_1.z.string().nullable().optional(),
    businessModel: zod_1.z.string().nullable().optional(),
    competitiveAdvantages: zod_1.z.string().nullable().optional(),
    keyProducts: zod_1.z.string().nullable().optional(),
    keyServices: zod_1.z.string().nullable().optional(),
    keyCustomers: zod_1.z.string().nullable().optional(),
    majorSubsidiaries: zod_1.z.string().nullable().optional(),
    jointVentures: zod_1.z.string().nullable().optional(),
    geographicPresence: zod_1.z.string().nullable().optional(),
    industryPosition: zod_1.z.string().nullable().optional(),
    marketLeadershipNotes: zod_1.z.string().nullable().optional(),
});
exports.BusinessSegmentValidator = zod_1.z.object({
    segmentName: zod_1.z.string().min(1),
    revenueContribution: zod_1.z.number().nullable().optional(),
    profitContribution: zod_1.z.number().nullable().optional(),
    segmentDescription: zod_1.z.string().nullable().optional(),
    year: zod_1.z.number(),
});
exports.FinancialGrowthValidator = zod_1.z.object({
    year: zod_1.z.number(),
    revenue: zod_1.z.number().nullable().optional(),
    ebitda: zod_1.z.number().nullable().optional(),
    netProfit: zod_1.z.number().nullable().optional(),
    eps: zod_1.z.number().nullable().optional(),
    bookValue: zod_1.z.number().nullable().optional(),
    operatingCashFlow: zod_1.z.number().nullable().optional(),
    freeCashFlow: zod_1.z.number().nullable().optional(),
    assets: zod_1.z.number().nullable().optional(),
    equity: zod_1.z.number().nullable().optional(),
    cash: zod_1.z.number().nullable().optional(),
    debt: zod_1.z.number().nullable().optional(),
});
exports.QualityMetricsValidator = zod_1.z.object({
    year: zod_1.z.number(),
    roe: zod_1.z.number().nullable().optional(),
    roce: zod_1.z.number().nullable().optional(),
    roa: zod_1.z.number().nullable().optional(),
    grossMargin: zod_1.z.number().nullable().optional(),
    operatingMargin: zod_1.z.number().nullable().optional(),
    ebitdaMargin: zod_1.z.number().nullable().optional(),
    netMargin: zod_1.z.number().nullable().optional(),
    assetTurnover: zod_1.z.number().nullable().optional(),
    interestCoverage: zod_1.z.number().nullable().optional(),
    cashConversionRatio: zod_1.z.number().nullable().optional(),
});
exports.ValuationMetricsValidator = zod_1.z.object({
    pe: zod_1.z.number().nullable().optional(),
    forwardPe: zod_1.z.number().nullable().optional(),
    pb: zod_1.z.number().nullable().optional(),
    ps: zod_1.z.number().nullable().optional(),
    peg: zod_1.z.number().nullable().optional(),
    evEbitda: zod_1.z.number().nullable().optional(),
    evSales: zod_1.z.number().nullable().optional(),
    dividendYield: zod_1.z.number().nullable().optional(),
    marketCap: zod_1.z.number().nullable().optional(),
    enterpriseValue: zod_1.z.number().nullable().optional(),
});
exports.OwnershipHistoryValidator = zod_1.z.object({
    quarter: zod_1.z.string().min(1),
    promoter: zod_1.z.number().nullable().optional(),
    promoterPledged: zod_1.z.number().nullable().optional(),
    fii: zod_1.z.number().nullable().optional(),
    dii: zod_1.z.number().nullable().optional(),
    publicHolding: zod_1.z.number().nullable().optional(),
    others: zod_1.z.number().nullable().optional(),
});
exports.CorporateDevelopmentValidator = zod_1.z.object({
    title: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    summary: zod_1.z.string().nullable().optional(),
    announcementDate: zod_1.z.date(),
    sourceUrl: zod_1.z.string().nullable().optional(),
});
exports.GrowthDriverValidator = zod_1.z.object({
    driverType: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    importanceScore: zod_1.z.number().min(1).max(10).nullable().optional(),
    source: zod_1.z.string().nullable().optional(),
});
exports.CompanyRiskValidator = zod_1.z.object({
    riskType: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    severity: zod_1.z.string().min(1), // e.g., "High", "Medium", "Low"
});
exports.OrderBookDataValidator = zod_1.z.object({
    year: zod_1.z.number(),
    orderBookValue: zod_1.z.number().nullable().optional(),
    orderInflows: zod_1.z.number().nullable().optional(),
    bookToBillRatio: zod_1.z.number().nullable().optional(),
    comments: zod_1.z.string().nullable().optional(),
});
exports.ManagementCommentaryValidator = zod_1.z.object({
    period: zod_1.z.string().min(1),
    commentaryType: zod_1.z.string().min(1),
    summary: zod_1.z.string().min(1),
    source: zod_1.z.string().nullable().optional(),
});
