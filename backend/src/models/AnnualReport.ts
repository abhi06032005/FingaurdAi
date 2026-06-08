import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnualReport extends Document {
    symbol: string;
    isin?: string;
    company_name?: string;
    fiscal_year?: string;
    report_date?: Date;
    source_url?: string;
    pdf_pages?: number;
    extraction_version?: number;
    business_summary?: string;
    ceo_message?: {
        summary?: string;
        vision?: string;
        key_achievements?: string[];
        priorities_for_next_year?: string[];
        tone?: string;
        notable_quotes?: string[];
    };
    business_description?: {
        business_model?: string;
        products?: string[];
        services?: string[];
        segments?: string[];
        revenue_drivers?: string[];
        competitive_advantages?: string[];
        geographies?: string[];
        company_name?: string;
        sector?: string;
    };
    management_discussion?: {
        growth_drivers?: string[];
        challenges?: string[];
        future_strategy?: string[];
        industry_trends?: string[];
        demand_outlook?: string;
        revenue_explanation?: string;
        profit_explanation?: string;
        key_highlights?: string[];
    };
    industry_outlook?: {
        sector?: string;
        market_size?: string;
        growth_rate?: string;
        tailwinds?: string[];
        headwinds?: string[];
        regulatory_environment?: string;
        key_trends?: string[];
        competitive_landscape?: string;
    };
    risk_factors?: Array<{
        risk: string;
        category: string;
        impact: string;
        description?: string;
        mitigation: string;
    }>;
    capex_plans?: Array<{
        project: string;
        type: string;
        cost: string;
        location: string;
        completion: string;
        capacity_addition: string;
        status: string;
        strategic_rationale?: string;
    }>;
    total_capex_guidance?: string;
    operational_metrics?: {
        sector_type?: string;
        metrics?: Array<{
            name: string;
            value: string;
            trend: string;
            comment: string;
        }>;
    };
    guidance?: {
        revenue_guidance?: string;
        margin_guidance?: string;
        volume_guidance?: string;
        management_outlook?: string;
        confidence_level?: string;
        key_assumptions?: string[];
        near_term_focus?: string[];
    };
    corporate_actions?: Array<{
        type: string;
        entity: string;
        value: string;
        rationale: string;
        date: string;
        impact?: string;
    }>;
    auditor_remarks?: Array<{
        type: string;
        severity: string;
        description: string;
        financial_impact?: string;
    }>;
    overall_audit_opinion?: string;
    esg_highlights?: {
        environmental?: string[];
        social?: string[];
        governance?: string[];
        csr_spend?: string;
        certifications?: string[];
        esg_ratings?: string[];
        sustainability_goals?: string[];
    };
    ai_context?: {
        one_liner?: string;
        bull_points?: string[];
        bear_points?: string[];
        key_monitorables?: string[];
    };
    processed_at?: Date;
    processing_errors?: string[];
    raw_sections_extracted?: string[];
}

const annualReportSchema: Schema = new Schema(
    {
        symbol: { type: String, required: true, uppercase: true, index: true },
        isin: { type: String, uppercase: true, index: true },
        company_name: String,
        fiscal_year: { type: String, index: true },
        report_date: Date,
        source_url: String,
        pdf_pages: Number,
        extraction_version: { type: Number, default: 1 },
        business_summary: String,
        ceo_message: {
            summary: String,
            vision: String,
            key_achievements: [String],
            priorities_for_next_year: [String],
            tone: String,
            notable_quotes: [String],
        },
        business_description: {
            business_model: String,
            products: [String],
            services: [String],
            segments: [String],
            revenue_drivers: [String],
            competitive_advantages: [String],
            geographies: [String],
            company_name: String,
            sector: String,
        },
        management_discussion: {
            growth_drivers: [String],
            challenges: [String],
            future_strategy: [String],
            industry_trends: [String],
            demand_outlook: String,
            revenue_explanation: String,
            profit_explanation: String,
            key_highlights: [String],
        },
        industry_outlook: {
            sector: String,
            market_size: String,
            growth_rate: String,
            tailwinds: [String],
            headwinds: [String],
            regulatory_environment: String,
            key_trends: [String],
            competitive_landscape: String,
        },
        risk_factors: [
            {
                risk: String,
                category: String,
                impact: String,
                description: String,
                mitigation: String,
            },
        ],
        capex_plans: [
            {
                project: String,
                type: { type: String },
                cost: String,
                location: String,
                completion: String,
                capacity_addition: String,
                status: String,
                strategic_rationale: String,
            },
        ],
        total_capex_guidance: String,
        operational_metrics: {
            sector_type: String,
            metrics: [
                {
                    name: String,
                    value: String,
                    trend: String,
                    comment: String,
                },
            ],
        },
        guidance: {
            revenue_guidance: String,
            margin_guidance: String,
            volume_guidance: String,
            management_outlook: String,
            confidence_level: String,
            key_assumptions: [String],
            near_term_focus: [String],
        },
        corporate_actions: [
            {
                type: { type: String },
                entity: String,
                value: String,
                rationale: String,
                date: String,
                impact: String,
            },
        ],
        auditor_remarks: [
            {
                type: { type: String },
                severity: String,
                description: String,
                financial_impact: String,
            },
        ],
        overall_audit_opinion: String,
        esg_highlights: {
            environmental: [String],
            social: [String],
            governance: [String],
            csr_spend: String,
            certifications: [String],
            esg_ratings: [String],
            sustainability_goals: [String],
        },
        ai_context: {
            one_liner: String,
            bull_points: [String],
            bear_points: [String],
            key_monitorables: [String],
        },
        processed_at: { type: Date, default: Date.now },
        processing_errors: [String],
        raw_sections_extracted: [String],
    },
    {
        collection: "annual_reports",
        timestamps: true,
    }
);

annualReportSchema.index({ symbol: 1, fiscal_year: 1 }, { unique: true });

export const AnnualReport = mongoose.models.AnnualReport || mongoose.model<IAnnualReport>("AnnualReport", annualReportSchema);
