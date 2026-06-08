"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnualReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const annualReportSchema = new mongoose_1.Schema({
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
}, {
    collection: "annual_reports",
    timestamps: true,
});
annualReportSchema.index({ symbol: 1, fiscal_year: 1 }, { unique: true });
exports.AnnualReport = mongoose_1.default.models.AnnualReport || mongoose_1.default.model("AnnualReport", annualReportSchema);
