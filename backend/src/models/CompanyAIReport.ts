import mongoose, { Schema, Document } from 'mongoose';

// ─── Subsection types ──────────────────────────────────────────────────────────

export interface IExecutiveSummary {
    company_overview: string;           // 2-3 para about the business
    one_liner: string;                  // Bloomberg-style one-liner
    investment_thesis: string;          // Bull/bear balance in 1 para
}

export interface IFinancialSnapshot {
    revenue_trend: string;              // e.g. "Revenue grew 12% YoY to ₹8.97L Cr"
    profit_trend: string;
    margin_analysis: string;
    balance_sheet_health: string;       // debt, assets summary
    cash_flow_summary: string;
    key_ratios: Array<{
        name: string;
        value: string;
        benchmark: string;
        interpretation: string;
    }>;
    quarterly_highlights: string;       // latest quarter standouts
}

export interface IBullBearAnalysis {
    bull_case: Array<{
        point: string;
        evidence: string;
        strength: 'strong' | 'moderate' | 'speculative';
    }>;
    bear_case: Array<{
        point: string;
        evidence: string;
        severity: 'high' | 'medium' | 'low';
    }>;
    verdict: string;                    // overall balanced verdict
}

export interface IBusinessQualityScore {
    revenue_visibility: number;         // 1-10
    management_quality: number;
    competitive_moat: number;
    balance_sheet_strength: number;
    earnings_quality: number;
    esg_practices: number;
    overall_score: number;
    score_rationale: string;
}

export interface IRiskMatrix {
    risks: Array<{
        name: string;
        category: string;
        probability: 'high' | 'medium' | 'low';
        impact: 'high' | 'medium' | 'low';
        mitigation: string;
    }>;
    overall_risk_level: 'high' | 'medium' | 'low';
}

export interface IStrategicOutlook {
    management_guidance: string;
    capex_plans: string;
    growth_catalysts: string[];
    near_term_monitorables: string[];
    long_term_vision: string;
}

export interface IIndustryContext {
    sector: string;
    market_position: string;           // leader / challenger / niche
    peer_comparison: string;           // vs peers from screener data
    industry_tailwinds: string[];
    industry_headwinds: string[];
    competitive_landscape: string;
}

export interface IESGSummary {
    environmental: string;
    social: string;
    governance: string;
    csr_initiatives: string;
    esg_rating_notes: string;
}

export interface ICompanyAIReport extends Document {
    ticker: string;
    company_name: string;
    generated_at: Date;
    data_sources: {
        stock_data_available: boolean;
        annual_reports_count: number;
        fiscal_years_covered: string[];
        stock_last_updated?: Date;
    };
    executive_summary: IExecutiveSummary;
    financial_snapshot: IFinancialSnapshot;
    bull_bear_analysis: IBullBearAnalysis;
    business_quality_score: IBusinessQualityScore;
    risk_matrix: IRiskMatrix;
    strategic_outlook: IStrategicOutlook;
    industry_context: IIndustryContext;
    esg_summary: IESGSummary;
    key_monitorables: string[];
    disclaimer: string;
    generation_error?: string;
    raw_groq_response?: string;         // stored for debugging
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CompanyAIReportSchema = new Schema<ICompanyAIReport>(
    {
        ticker: { type: String, required: true, uppercase: true, unique: true, index: true },
        company_name: { type: String, required: true },
        generated_at: { type: Date, default: Date.now },
        data_sources: {
            stock_data_available: Boolean,
            annual_reports_count: Number,
            fiscal_years_covered: [String],
            stock_last_updated: Date,
        },
        executive_summary: {
            company_overview: String,
            one_liner: String,
            investment_thesis: String,
        },
        financial_snapshot: {
            revenue_trend: String,
            profit_trend: String,
            margin_analysis: String,
            balance_sheet_health: String,
            cash_flow_summary: String,
            key_ratios: [
                {
                    name: String,
                    value: String,
                    benchmark: String,
                    interpretation: String,
                },
            ],
            quarterly_highlights: String,
        },
        bull_bear_analysis: {
            bull_case: [
                {
                    point: String,
                    evidence: String,
                    strength: { type: String, enum: ['strong', 'moderate', 'speculative'] },
                },
            ],
            bear_case: [
                {
                    point: String,
                    evidence: String,
                    severity: { type: String, enum: ['high', 'medium', 'low'] },
                },
            ],
            verdict: String,
        },
        business_quality_score: {
            revenue_visibility: Number,
            management_quality: Number,
            competitive_moat: Number,
            balance_sheet_strength: Number,
            earnings_quality: Number,
            esg_practices: Number,
            overall_score: Number,
            score_rationale: String,
        },
        risk_matrix: {
            risks: [
                {
                    name: String,
                    category: String,
                    probability: { type: String, enum: ['high', 'medium', 'low'] },
                    impact: { type: String, enum: ['high', 'medium', 'low'] },
                    mitigation: String,
                },
            ],
            overall_risk_level: { type: String, enum: ['high', 'medium', 'low'] },
        },
        strategic_outlook: {
            management_guidance: String,
            capex_plans: String,
            growth_catalysts: [String],
            near_term_monitorables: [String],
            long_term_vision: String,
        },
        industry_context: {
            sector: String,
            market_position: String,
            peer_comparison: String,
            industry_tailwinds: [String],
            industry_headwinds: [String],
            competitive_landscape: String,
        },
        esg_summary: {
            environmental: String,
            social: String,
            governance: String,
            csr_initiatives: String,
            esg_rating_notes: String,
        },
        key_monitorables: [String],
        disclaimer: String,
        generation_error: String,
        raw_groq_response: String,
    },
    {
        collection: 'company_ai_reports',
        timestamps: true,
    }
);

export const CompanyAIReport =
    mongoose.models.CompanyAIReport ||
    mongoose.model<ICompanyAIReport>('CompanyAIReport', CompanyAIReportSchema);
