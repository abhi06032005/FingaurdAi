"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchContextService = void 0;
const prisma_1 = require("../config/prisma");
const researchContext_repository_1 = require("../repositories/researchContext.repository");
const logger_1 = require("../utils/logger");
class ResearchContextService {
    /**
     * Helper to calculate CAGR (Compound Annual Growth Rate) in percentage.
     */
    static calculateCagr(start, end, periods) {
        if (start == null || end == null || start <= 0 || end <= 0 || periods <= 0)
            return null;
        try {
            const cagr = (Math.pow(end / start, 1 / periods) - 1) * 100;
            return parseFloat(cagr.toFixed(2));
        }
        catch {
            return null;
        }
    }
    /**
     * Generates the pre-computed JSON research context for a company and saves it in the DB.
     */
    static async generateResearchContext(companyId) {
        logger_1.logger.info(`[ResearchContextService] Generating research context for companyId: ${companyId}`);
        // Fetch the company and all relations from the DB
        const company = await prisma_1.prisma.company.findUnique({
            where: { id: companyId },
            include: {
                businessIntelligence: true,
                businessSegments: { orderBy: { year: 'desc' } },
                financialGrowth: { orderBy: { year: 'asc' } },
                qualityMetrics: { orderBy: { year: 'asc' } },
                valuationMetrics: true,
                ownershipHistory: { orderBy: { createdAt: 'desc' } }, // raw order or date
                corporateDevelopments: { orderBy: { announcementDate: 'desc' }, take: 15 },
                growthDrivers: true,
                risks: true,
                orderBookData: { orderBy: { year: 'desc' } },
                managementCommentary: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!company) {
            throw new Error(`Company not found with ID ${companyId}`);
        }
        // ── 1. Financial Growth and Growth Calculations ──
        const fg = company.financialGrowth;
        const growthYearsObj = [];
        let revenueCagr = null;
        let netProfitCagr = null;
        if (fg.length > 0) {
            // Calculate YoY growth rates
            for (let i = 0; i < fg.length; i++) {
                const current = fg[i];
                const prev = i > 0 ? fg[i - 1] : null;
                const revYoY = prev && prev.revenue && current.revenue
                    ? ((current.revenue - prev.revenue) / prev.revenue) * 100
                    : null;
                const profitYoY = prev && prev.netProfit && current.netProfit
                    ? ((current.netProfit - prev.netProfit) / prev.netProfit) * 100
                    : null;
                growthYearsObj.push({
                    year: current.year,
                    revenue: current.revenue,
                    ebitda: current.ebitda,
                    netProfit: current.netProfit,
                    eps: current.eps,
                    revenueYoY: revYoY ? parseFloat(revYoY.toFixed(2)) : null,
                    netProfitYoY: profitYoY ? parseFloat(profitYoY.toFixed(2)) : null,
                    bookValue: current.bookValue,
                    operatingCashFlow: current.operatingCashFlow,
                    freeCashFlow: current.freeCashFlow,
                });
            }
            // Calculate CAGRs (using first and last available records)
            if (fg.length > 1) {
                const first = fg[0];
                const last = fg[fg.length - 1];
                const periods = last.year - first.year;
                if (periods > 0) {
                    revenueCagr = this.calculateCagr(first.revenue, last.revenue, periods);
                    netProfitCagr = this.calculateCagr(first.netProfit, last.netProfit, periods);
                }
            }
        }
        // ── 2. Profitability and Cash Flow Analysis ──
        const qm = company.qualityMetrics;
        const profitabilityYears = [];
        let avgRoe = null;
        let avgRoce = null;
        if (qm.length > 0) {
            let roeSum = 0;
            let roceSum = 0;
            let roeCount = 0;
            let roceCount = 0;
            for (const m of qm) {
                if (m.roe != null) {
                    roeSum += m.roe;
                    roeCount++;
                }
                if (m.roce != null) {
                    roceSum += m.roce;
                    roceCount++;
                }
                profitabilityYears.push({
                    year: m.year,
                    roe: m.roe ? parseFloat(m.roe.toFixed(2)) : null,
                    roce: m.roce ? parseFloat(m.roce.toFixed(2)) : null,
                    roa: m.roa ? parseFloat(m.roa.toFixed(2)) : null,
                    grossMargin: m.grossMargin ? parseFloat(m.grossMargin.toFixed(2)) : null,
                    operatingMargin: m.operatingMargin ? parseFloat(m.operatingMargin.toFixed(2)) : null,
                    ebitdaMargin: m.ebitdaMargin ? parseFloat(m.ebitdaMargin.toFixed(2)) : null,
                    netMargin: m.netMargin ? parseFloat(m.netMargin.toFixed(2)) : null,
                    assetTurnover: m.assetTurnover ? parseFloat(m.assetTurnover.toFixed(2)) : null,
                    interestCoverage: m.interestCoverage ? parseFloat(m.interestCoverage.toFixed(2)) : null,
                    cashConversionRatio: m.cashConversionRatio ? parseFloat(m.cashConversionRatio.toFixed(2)) : null,
                });
            }
            avgRoe = roeCount > 0 ? parseFloat((roeSum / roeCount).toFixed(2)) : null;
            avgRoce = roceCount > 0 ? parseFloat((roceSum / roceCount).toFixed(2)) : null;
        }
        // ── 3. Balance Sheet metrics across years ──
        const balanceSheetYears = fg.map((f) => {
            const netDebt = (f.debt ?? 0) - (f.cash ?? 0);
            const debtToEquity = f.equity && f.debt ? f.debt / f.equity : null;
            return {
                year: f.year,
                assets: f.assets,
                equity: f.equity,
                cash: f.cash,
                debt: f.debt,
                netDebt: parseFloat(netDebt.toFixed(2)),
                debtToEquity: debtToEquity ? parseFloat(debtToEquity.toFixed(2)) : null,
            };
        });
        // ── 4. Ownership Pattern Trends ──
        const ownershipHistoryList = company.ownershipHistory.map((o) => ({
            quarter: o.quarter,
            promoter: o.promoter,
            promoterPledged: o.promoterPledged,
            fii: o.fii,
            dii: o.dii,
            publicHolding: o.publicHolding,
            others: o.others,
        }));
        let ownershipTrendNote = '';
        if (ownershipHistoryList.length >= 2) {
            const latestQ = ownershipHistoryList[0];
            const oldestQ = ownershipHistoryList[ownershipHistoryList.length - 1];
            if (latestQ.promoter != null && oldestQ.promoter != null) {
                const change = latestQ.promoter - oldestQ.promoter;
                ownershipTrendNote = `Promoter holding changed by ${change.toFixed(2)}% from ${oldestQ.quarter} to ${latestQ.quarter}`;
            }
        }
        // ── 5. Assemble unified Research Context JSON ──
        const contextJson = {
            profile: {
                ticker: company.ticker,
                companyName: company.companyName,
                isin: company.isin,
                sector: company.sector,
                industry: company.industry,
                marketCap: company.marketCap,
                website: company.website,
                description: company.description,
                headquarters: company.headquarters,
                employees: company.employees,
                listingDate: company.listingDate,
                lastUpdated: company.lastUpdated,
            },
            business: company.businessIntelligence
                ? {
                    businessSummary: company.businessIntelligence.businessSummary,
                    businessModel: company.businessIntelligence.businessModel,
                    competitiveAdvantages: company.businessIntelligence.competitiveAdvantages,
                    keyProducts: company.businessIntelligence.keyProducts,
                    keyServices: company.businessIntelligence.keyServices,
                    keyCustomers: company.businessIntelligence.keyCustomers,
                    majorSubsidiaries: company.businessIntelligence.majorSubsidiaries,
                    jointVentures: company.businessIntelligence.jointVentures,
                    geographicPresence: company.businessIntelligence.geographicPresence,
                    industryPosition: company.businessIntelligence.industryPosition,
                    marketLeadershipNotes: company.businessIntelligence.marketLeadershipNotes,
                }
                : {},
            segments: company.businessSegments.map((s) => ({
                segmentName: s.segmentName,
                revenueContribution: s.revenueContribution,
                profitContribution: s.profitContribution,
                segmentDescription: s.segmentDescription,
                year: s.year,
            })),
            growth: {
                revenueCagr,
                netProfitCagr,
                history: growthYearsObj,
            },
            profitability: {
                avgRoe,
                avgRoce,
                history: profitabilityYears,
            },
            balanceSheet: {
                history: balanceSheetYears,
            },
            valuation: company.valuationMetrics
                ? {
                    pe: company.valuationMetrics.pe,
                    forwardPe: company.valuationMetrics.forwardPe,
                    pb: company.valuationMetrics.pb,
                    ps: company.valuationMetrics.ps,
                    peg: company.valuationMetrics.peg,
                    evEbitda: company.valuationMetrics.evEbitda,
                    evSales: company.valuationMetrics.evSales,
                    dividendYield: company.valuationMetrics.dividendYield,
                    marketCap: company.valuationMetrics.marketCap,
                    enterpriseValue: company.valuationMetrics.enterpriseValue,
                }
                : {},
            ownership: {
                trendNote: ownershipTrendNote,
                history: ownershipHistoryList,
            },
            orderBook: company.orderBookData.map((o) => ({
                year: o.year,
                orderBookValue: o.orderBookValue,
                orderInflows: o.orderInflows,
                bookToBillRatio: o.bookToBillRatio,
                comments: o.comments,
            })),
            developments: company.corporateDevelopments.map((d) => ({
                title: d.title,
                category: d.category,
                summary: d.summary,
                announcementDate: d.announcementDate,
                sourceUrl: d.sourceUrl,
            })),
            growthDrivers: company.growthDrivers.map((g) => ({
                driverType: g.driverType,
                description: g.description,
                importanceScore: g.importanceScore,
                source: g.source,
            })),
            risks: company.risks.map((r) => ({
                riskType: r.riskType,
                description: r.description,
                severity: r.severity,
            })),
            managementCommentary: company.managementCommentary.map((m) => ({
                period: m.period,
                commentaryType: m.commentaryType,
                summary: m.summary,
                source: m.source,
            })),
        };
        // Store in DB
        await researchContext_repository_1.ResearchContextRepository.upsertResearchContext(companyId, contextJson);
        logger_1.logger.info(`[ResearchContextService] Successfully saved research context for ${company.ticker}`);
        return contextJson;
    }
}
exports.ResearchContextService = ResearchContextService;
