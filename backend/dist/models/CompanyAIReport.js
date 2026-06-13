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
exports.CompanyAIReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// ─── Schema ───────────────────────────────────────────────────────────────────
const CompanyAIReportSchema = new mongoose_1.Schema({
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
}, {
    collection: 'company_ai_reports',
    timestamps: true,
});
exports.CompanyAIReport = mongoose_1.default.models.CompanyAIReport ||
    mongoose_1.default.model('CompanyAIReport', CompanyAIReportSchema);
