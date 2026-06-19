import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnualReportFiling extends Document {
    symbol: string;
    isin?: string;
    pdfUrl: string;
    source: string;
    pdf_pages?: number;
    fiscal_year: string;
    downloadedAt: Date;
    reportDate?: Date;
}

const annualReportFilingSchema: Schema = new Schema(
    {
        symbol: { type: String, required: true, uppercase: true, index: true },
        isin: { type: String, uppercase: true },
        pdfUrl: { type: String, required: true },
        source: { type: String, required: true },
        pdf_pages: Number,
        fiscal_year: { type: String, required: true, index: true },
        downloadedAt: { type: Date, default: Date.now },
        reportDate: Date,
    },
    {
        collection: "annual_report_filings",
        timestamps: true,
    }
);

annualReportFilingSchema.index({ symbol: 1, fiscal_year: 1 }, { unique: true });

export const AnnualReportFiling = (mongoose.models.AnnualReportFiling || mongoose.model<IAnnualReportFiling>("AnnualReportFiling", annualReportFilingSchema)) as any;
