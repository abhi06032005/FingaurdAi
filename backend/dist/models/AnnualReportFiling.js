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
exports.AnnualReportFiling = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const annualReportFilingSchema = new mongoose_1.Schema({
    symbol: { type: String, required: true, uppercase: true, index: true },
    isin: { type: String, uppercase: true },
    pdfUrl: { type: String, required: true },
    source: { type: String, required: true },
    pdf_pages: Number,
    fiscal_year: { type: String, required: true, index: true },
    downloadedAt: { type: Date, default: Date.now },
    reportDate: Date,
}, {
    collection: "annual_report_filings",
    timestamps: true,
});
annualReportFilingSchema.index({ symbol: 1, fiscal_year: 1 }, { unique: true });
exports.AnnualReportFiling = mongoose_1.default.models.AnnualReportFiling || mongoose_1.default.model("AnnualReportFiling", annualReportFilingSchema);
