/**
 * ============================================================
 * Indian Equity Annual Report Scraper & AI Extractor
 * ============================================================
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import winston from 'winston';
import { AnnualReport } from '../models/AnnualReport';
import { AnnualReportFiling } from '../models/AnnualReportFiling';

// ── Logger setup ──────────────────────────────────────────────────────────────
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) =>
            `[${timestamp}] ${level}: ${message}`
        )
    ),
    transports: [new winston.transports.Console()],
});

// ── Config ────────────────────────────────────────────────────────────────────
interface AppConfig {
    groqApiKey: string;
    mongoUri: string;
    groqModel: string;
    groqFallbackModel: string;
    maxTokensPerSection: number;
    concurrency: number;
    pdfChunkSize: number;
    requestDelayMs: number;
    bseFilingUrl: string;
    nseFilingUrl: string;
    userAgent: string;
}

const CONFIG: AppConfig = {
    groqApiKey: process.env.GROQ_API_KEY || "",
    mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/equity_research",
    groqModel: "llama-3.3-70b-versatile",       // Free tier, best quality
    groqFallbackModel: "llama-3.1-8b-instant",  // Fallback if rate-limited
    maxTokensPerSection: 8000,   // Groq context sent per section (keeps costs low)
    concurrency: 2,              // Parallel Groq calls (respect free-tier rate limits)
    pdfChunkSize: 12000,         // Characters per chunk when splitting PDF text
    requestDelayMs: 1200,        // Delay between Groq API calls (free tier: ~30 req/min)

    // BSE filing search endpoint (public, no auth needed)
    bseFilingUrl: "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w",
    // NSE filing search
    nseFilingUrl: "https://www.nseindia.com/api/annual-reports",
    // User agent to avoid blocks
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// ── Groq client ───────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: CONFIG.groqApiKey });

// ═════════════════════════════════════════════════════════════════════════════
// STEP 1 — Find and download the annual report PDF
// ═════════════════════════════════════════════════════════════════════════════

interface PDFResult {
    url: string;
    buffer: Buffer;
    filename: string;
    source: string;
    date?: string;
}

async function fetchAnnualReportPDF(symbol: string, isin?: string): Promise<PDFResult> {
    logger.info(`[${symbol}] Searching for annual report PDF...`);

    try {
        const result = await fetchFromBSE(symbol, isin);
        if (result) return result;
    } catch (e: any) {
        logger.warn(`[${symbol}] BSE fetch failed: ${e.message}`);
    }

    try {
        const result = await fetchFromNSE(symbol);
        if (result) return result;
    } catch (e: any) {
        logger.warn(`[${symbol}] NSE fetch failed: ${e.message}`);
    }

    try {
        const result = await fetchFromScreener(symbol);
        if (result) return result;
    } catch (e: any) {
        logger.warn(`[${symbol}] Screener fetch failed: ${e.message}`);
    }

    throw new Error(`[${symbol}] Could not find annual report PDF from any source`);
}

async function fetchFromBSE(symbol: string, isin?: string): Promise<PDFResult | null> {
    const params = new URLSearchParams({
        strCat: "Annual Report",
        strPrevDate: getPrevYearDate(),
        strScrip: isin || "",
        strSearch: "P",
        strToDate: getTodayDate(),
        strType: "C",
    });

    const headers = {
        "User-Agent": CONFIG.userAgent,
        "Referer": "https://www.bseindia.com/",
        "Accept": "application/json",
    };

    const res = await axios.get(`${CONFIG.bseFilingUrl}?${params}`, {
        headers,
        timeout: 15000,
    });

    const filings = res.data?.Table || [];
    const annualReport = filings.find(
        (f: any) =>
            f.CATEGORYNAME?.toLowerCase().includes("annual report") ||
            f.SUBCATEGORYNAME?.toLowerCase().includes("annual report")
    );

    if (!annualReport || !annualReport.ATTACHMENTNAME) return null;

    const pdfUrl = `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${annualReport.ATTACHMENTNAME}`;
    logger.info(`[${symbol}] Found on BSE: ${annualReport.ATTACHMENTNAME}`);

    const buffer = await downloadPDF(pdfUrl, headers);
    return {
        url: pdfUrl,
        buffer,
        filename: annualReport.ATTACHMENTNAME,
        source: "BSE",
        date: annualReport.NEWS_DT,
    };
}

async function fetchFromNSE(symbol: string): Promise<PDFResult | null> {
    const session = axios.create({
        headers: {
            "User-Agent": CONFIG.userAgent,
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 20000,
    });

    await session.get("https://www.nseindia.com", { timeout: 10000 });
    await delay(500);

    const res = await session.get(
        `https://www.nseindia.com/api/annual-reports?index=equities&symbol=${symbol.toUpperCase()}`,
        {
            headers: {
                Referer: "https://www.nseindia.com/companies-listing/corporate-filings-annual-reports",
                "X-Requested-With": "XMLHttpRequest",
            },
        }
    );

    const data = res.data?.data || [];
    if (!data.length) return null;

    const latest = data[0];
    const pdfUrl = latest.fileName;
    if (!pdfUrl) return null;

    logger.info(`[${symbol}] Found on NSE: ${latest.fileName}`);
    const buffer = await downloadPDF(pdfUrl, {
        "User-Agent": CONFIG.userAgent,
        Referer: "https://www.nseindia.com/",
    });

    return {
        url: pdfUrl,
        buffer,
        filename: path.basename(pdfUrl),
        source: "NSE",
        date: latest.date,
    };
}

async function fetchFromScreener(symbol: string): Promise<PDFResult | null> {
    const url = `https://www.screener.in/company/${symbol.toUpperCase()}/`;
    const res = await axios.get(url, {
        headers: { "User-Agent": CONFIG.userAgent },
        timeout: 15000,
    });

    const $ = cheerio.load(res.data);
    let pdfUrl: string | null = null;

    $("a").each((_, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().toLowerCase();
        if (
            (text.includes("annual report") || text.includes("annual-report") || text.includes("financial year")) &&
            (href.endsWith(".pdf") || href.includes("pdf"))
        ) {
            pdfUrl = href.startsWith("http") ? href : `https://www.screener.in${href}`;
            return false;
        }
    });

    if (!pdfUrl) return null;

    logger.info(`[${symbol}] Found on Screener: ${pdfUrl}`);
    const buffer = await downloadPDF(pdfUrl, { "User-Agent": CONFIG.userAgent });
    return { url: pdfUrl, buffer, filename: path.basename(pdfUrl), source: "Screener" };
}

async function downloadPDF(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
    logger.info(`Downloading PDF: ${url.slice(0, 80)}...`);
    const res = await axios.get(url, {
        headers: { "User-Agent": CONFIG.userAgent, ...headers },
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024,
    });

    const buffer = Buffer.from(res.data);
    logger.info(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
    return buffer;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 2 — Extract and section the PDF text
// ═════════════════════════════════════════════════════════════════════════════

interface SectionDef {
    key: string;
    patterns: RegExp[];
    maxChars: number;
}

const SECTION_PATTERNS: SectionDef[] = [
    {
        key: "ceo_message",
        patterns: [
            /chairman['']?s?\s+(message|letter|statement|address)/i,
            /managing\s+director['']?s?\s+(message|letter)/i,
            /dear\s+shareholders/i,
            /message\s+from\s+the\s+(chairman|md|ceo)/i,
        ],
        maxChars: 6000,
    },
    {
        key: "management_discussion",
        patterns: [
            /management\s+discussion\s+(&|and)\s+analysis/i,
            /md\s*&\s*a\b/i,
            /management['']?s?\s+discussion/i,
        ],
        maxChars: 20000,
    },
    {
        key: "business_description",
        patterns: [
            /about\s+(the\s+)?company/i,
            /company\s+overview/i,
            /business\s+overview/i,
            /our\s+business/i,
            /corporate\s+overview/i,
        ],
        maxChars: 8000,
    },
    {
        key: "risk_factors",
        patterns: [
            /risk\s+(factors|management|framework)/i,
            /risks?\s+and\s+(concern|uncertaint|challenge)/i,
            /key\s+risks/i,
        ],
        maxChars: 10000,
    },
    {
        key: "industry_outlook",
        patterns: [
            /industry\s+(overview|analysis|landscape|outlook)/i,
            /sector\s+overview/i,
            /market\s+overview/i,
            /economic\s+review/i,
        ],
        maxChars: 6000,
    },
    {
        key: "capex_plans",
        patterns: [
            /capital\s+expenditure/i,
            /capex\b/i,
            /expansion\s+(plans?|projects?|strategy)/i,
            /greenfield|brownfield/i,
            /capacity\s+expansion/i,
        ],
        maxChars: 6000,
    },
    {
        key: "guidance",
        patterns: [
            /outlook\b/i,
            /future\s+(prospects?|outlook|guidance)/i,
            /strategic\s+(outlook|priorities)/i,
            /way\s+forward/i,
        ],
        maxChars: 5000,
    },
    {
        key: "operational_metrics",
        patterns: [
            /operational\s+(performance|highlights|review)/i,
            /key\s+(performance|operating)\s+indicators/i,
            /kpi\b/i,
            /business\s+performance/i,
        ],
        maxChars: 8000,
    },
    {
        key: "corporate_actions",
        patterns: [
            /acquisitions?\b/i,
            /mergers?\s+(&|and)\s+acquisitions/i,
            /joint\s+venture/i,
            /subsidiaries?\b/i,
            /divestment/i,
        ],
        maxChars: 5000,
    },
    {
        key: "auditor_remarks",
        patterns: [
            /auditor['']?s?\s+report/i,
            /independent\s+auditor/i,
            /statutory\s+auditor/i,
        ],
        maxChars: 4000,
    },
    {
        key: "esg",
        patterns: [
            /esg\b/i,
            /sustainability/i,
            /corporate\s+social\s+responsibility/i,
            /csr\b/i,
            /environmental\s+(performance|initiatives)/i,
        ],
        maxChars: 4000,
    },
];

interface ExtractedSectionsResult {
    sections: Record<string, string>;
    pageCount: number;
    fiscalYear: string;
    foundSections: string[];
}

async function extractPDFSections(buffer: Buffer): Promise<ExtractedSectionsResult> {
    logger.info("Parsing PDF...");

    const parser = new PDFParse({ data: buffer });
    let fullText: string;
    let pageCount: number;
    try {
        const data = await parser.getText({ first: 150 });
        fullText = data.text;
        pageCount = data.total;
    } finally {
        await parser.destroy().catch(() => {});
    }
    logger.info(`PDF parsed: ${pageCount} pages, ${fullText.length.toLocaleString()} chars`);

    const fiscalYear = detectFiscalYear(fullText);
    logger.info(`Detected fiscal year: ${fiscalYear}`);

    const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);

    const sections: Record<string, string> = {};
    const foundSections: string[] = [];

    for (const sectionDef of SECTION_PATTERNS) {
        let startIdx = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (sectionDef.patterns.some((p) => p.test(line))) {
                if (i > 30 || line.length > 20) {
                    startIdx = i;
                    break;
                }
            }
        }

        if (startIdx === -1) continue;

        let sectionText = "";
        for (let i = startIdx; i < lines.length; i++) {
            sectionText += lines[i] + "\n";
            if (sectionText.length >= sectionDef.maxChars) break;

            if (i > startIdx + 5) {
                const isNewSection = SECTION_PATTERNS.some(
                    (other) =>
                        other.key !== sectionDef.key &&
                        other.patterns.some((p) => p.test(lines[i])) &&
                        lines[i].length < 80
                );
                if (isNewSection) break;
            }
        }

        sections[sectionDef.key] = sectionText.slice(0, sectionDef.maxChars);
        foundSections.push(sectionDef.key);
        logger.info(
            `  ✓ Found section: ${sectionDef.key} (${sectionText.length.toLocaleString()} chars)`
        );
    }

    sections["_overview_raw"] = lines.slice(0, 300).join("\n");

    logger.info(`Sections found: ${foundSections.join(", ")}`);

    return { sections, pageCount, fiscalYear, foundSections };
}

function detectFiscalYear(text: string): string {
    const patterns = [
        /annual\s+report\s+(\d{4})/i,
        /fy\s*(\d{4})/i,
        /for\s+the\s+year\s+ended.*?(\d{4})/i,
        /(\d{4})-\d{2,4}/,
    ];

    for (const p of patterns) {
        const m = text.slice(0, 5000).match(p);
        if (m) {
            const year = parseInt(m[1]);
            if (year >= 2010 && year <= 2030) return `FY${year}`;
        }
    }
    return `FY${new Date().getFullYear()}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 3 — LLM extraction: send each section to Groq, get structured JSON
// ═════════════════════════════════════════════════════════════════════════════

const EXTRACTION_PROMPTS: Record<string, any> = {
    ceo_message: (text: string) => `
You are a financial analyst AI. Extract structured information from this CEO/Chairman letter from an Indian company's annual report.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "ceo_message": {
    "summary": "2-3 sentence summary of the letter's key message",
    "vision": "Company's stated vision or mission",
    "key_achievements": ["achievement 1", "achievement 2"],
    "priorities_for_next_year": ["priority 1", "priority 2"],
    "tone": "optimistic|cautious|mixed",
    "notable_quotes": ["most impactful direct quote (max 1)"]
  }
}`,

    management_discussion: (text: string) => `
You are a senior equity analyst. Extract structured insights from this Management Discussion & Analysis section from an Indian annual report.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "management_discussion": {
    "growth_drivers": ["driver 1", "driver 2", "driver 3"],
    "challenges": ["challenge 1", "challenge 2"],
    "future_strategy": ["strategy 1", "strategy 2"],
    "industry_trends": ["trend 1", "trend 2"],
    "demand_outlook": "One sentence on demand outlook",
    "revenue_explanation": "Why revenue went up or down this year",
    "profit_explanation": "Why margins or profits changed",
    "key_highlights": ["highlight 1", "highlight 2"]
  }
}`,

    business_description: (text: string) => `
You are a financial analyst. Extract business fundamentals from this company overview section of an Indian annual report.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "business_description": {
    "business_model": "2-3 sentence description of how the company makes money",
    "products": ["product/product line 1", "product 2"],
    "services": ["service 1"],
    "segments": ["segment 1", "segment 2"],
    "revenue_drivers": ["driver 1", "driver 2"],
    "competitive_advantages": ["moat 1", "moat 2"],
    "geographies": ["India", "Geography 2"],
    "company_name": "Official company name",
    "sector": "Sector (e.g. Cement, IT Services, FMCG)"
  }
}`,

    risk_factors: (text: string) => `
You are a risk analyst. Extract and categorize all risk factors from this Indian annual report section.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "risk_factors": [
    {
      "risk": "Concise risk name",
      "category": "commodity|currency|regulatory|operational|market|technology|credit|geopolitical|supply_chain|customer_concentration",
      "impact": "High|Medium|Low",
      "description": "One sentence explanation",
      "mitigation": "How management is addressing it (if mentioned)"
    }
  ]
}`,

    industry_outlook: (text: string) => `
You are an industry analyst. Extract market and industry context from this Indian annual report section.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "industry_outlook": {
    "sector": "Sector name",
    "market_size": "Market size if mentioned (e.g. ₹2.5 lakh crore)",
    "growth_rate": "Expected growth rate if mentioned",
    "tailwinds": ["tailwind 1", "tailwind 2"],
    "headwinds": ["headwind 1"],
    "regulatory_environment": "Brief note on regulations",
    "key_trends": ["trend 1", "trend 2"],
    "competitive_landscape": "Brief note on competition"
  }
}`,

    capex_plans: (text: string) => `
You are a financial analyst. Extract all capital expenditure, expansion, and investment plans from this Indian annual report.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "capex_plans": [
    {
      "project": "Project name/description",
      "type": "greenfield|brownfield|acquisition|r&d|maintenance|technology",
      "cost": "₹XXX crore or USD XX million if mentioned",
      "location": "Location if mentioned",
      "completion": "Expected completion (e.g. FY2027)",
      "capacity_addition": "What capacity or capability it adds",
      "status": "planned|under_construction|commissioned|announced",
      "strategic_rationale": "Why the company is doing this"
    }
  ],
  "total_capex_guidance": "Total capex budget if mentioned"
}`,

    guidance: (text: string) => `
You are an equity analyst. Extract forward guidance and outlook from this Indian annual report section.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "guidance": {
    "revenue_guidance": "Revenue/growth target if mentioned",
    "margin_guidance": "Margin target if mentioned",
    "volume_guidance": "Volume or operational target",
    "management_outlook": "Most important forward-looking statement",
    "confidence_level": "optimistic|cautious|mixed",
    "key_assumptions": ["assumption 1", "assumption 2"],
    "near_term_focus": ["focus area 1", "focus area 2"]
  }
}`,

    operational_metrics: (text: string) => `
You are an equity analyst. Extract key operational and financial metrics from this Indian annual report section.
Detect the company type (banking, IT, FMCG, manufacturing, pharma, etc.) and extract relevant KPIs.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "operational_metrics": {
    "sector_type": "banking|it|fmcg|manufacturing|pharma|infrastructure|real_estate|telecom|other",
    "metrics": [
      {
        "name": "Metric name (e.g. Capacity Utilization, NPA Ratio, Attrition Rate)",
        "value": "Value with unit (e.g. 87%, ₹500 crore, 18,500 employees)",
        "trend": "improving|declining|stable",
        "comment": "Brief context if available"
      }
    ]
  }
}`,

    corporate_actions: (text: string) => `
You are a financial analyst. Extract all corporate actions, M&A, JVs, and significant business events.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "corporate_actions": [
    {
      "type": "acquisition|divestment|joint_venture|subsidiary_added|merger|fundraise|buyback",
      "entity": "Name of entity involved",
      "value": "Deal value if mentioned",
      "rationale": "Strategic reason",
      "date": "Date or fiscal period",
      "impact": "Expected impact on business"
    }
  ]
}`,

    auditor_remarks: (text: string) => `
You are a forensic accounting analyst. Extract all auditor observations from this Indian annual report.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "auditor_remarks": [
    {
      "type": "qualified_opinion|unqualified_opinion|emphasis_of_matter|key_audit_matter|internal_control|going_concern",
      "severity": "red|amber|green",
      "description": "What the auditor said",
      "financial_impact": "Quantified impact if mentioned"
    }
  ],
  "overall_audit_opinion": "clean|qualified|adverse|disclaimer"
}`,

    esg: (text: string) => `
You are an ESG analyst. Extract sustainability and governance highlights from this Indian annual report.

TEXT:
${text}

Return ONLY valid JSON (no markdown, no explanation):
{
  "esg_highlights": {
    "environmental": ["initiative 1", "initiative 2"],
    "social": ["initiative 1"],
    "governance": ["governance practice 1"],
    "csr_spend": "CSR spend if mentioned",
    "certifications": ["ISO cert", "other cert"],
    "esg_ratings": ["rating 1"]
  }
}`,

    synthesis: (companyName: string, allExtractedData: any) => `
You are a senior equity research analyst at a top investment bank. Based on all the extracted data from this Indian company's annual report, generate a comprehensive AI-ready summary.

COMPANY: ${companyName}
EXTRACTED DATA:
${JSON.stringify(allExtractedData, null, 2).slice(0, 12000)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "business_summary": "2-3 paragraph comprehensive description of the company, its business model, competitive position, and recent performance",
  "ai_context": {
    "one_liner": "One sentence that perfectly describes this company (like a Bloomberg description)",
    "bull_points": [
      "Most compelling growth argument",
      "Second bull point",
      "Third bull point"
    ],
    "bear_points": [
      "Most significant risk or concern",
      "Second bear point",
      "Third bear point"
    ],
    "key_monitorables": [
      "What analysts should watch in next 1-2 quarters",
      "Second monitorable",
      "Third monitorable"
    ]
  }
}`,
};

async function callGroq(prompt: string, symbol: string, sectionKey: string): Promise<any> {
    const models = [CONFIG.groqModel, CONFIG.groqFallbackModel];

    for (const model of models) {
        try {
            await delay(CONFIG.requestDelayMs);

            const completion = await groq.chat.completions.create({
                model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a financial data extraction AI. Always respond with valid JSON only. No markdown fences, no explanation, no preamble. Just the JSON object.",
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0.1,
                max_tokens: 2000,
            });

            const raw = completion.choices[0]?.message?.content || "";

            const cleaned = raw
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();

            const parsed = JSON.parse(cleaned);
            logger.info(`  ✓ Extracted [${sectionKey}] via ${model}`);
            return parsed;
        } catch (err: any) {
            if (err.status === 429) {
                logger.warn(`  Rate limited on ${model}, waiting 30s...`);
                await delay(30000);
                continue;
            }
            if (err instanceof SyntaxError) {
                logger.warn(`  [${sectionKey}] JSON parse failed with ${model}: ${err.message}`);
                continue;
            }
            logger.warn(`  [${sectionKey}] Groq error (${model}): ${err.message}`);
        }
    }

    logger.error(`  [${sectionKey}] All models failed for ${symbol}`);
    return null;
}

function sanitizeExtractedData(data: any): any {
    if (!data) return data;

    const arrayKeys = ["risk_factors", "capex_plans", "corporate_actions", "auditor_remarks"];
    for (const key of arrayKeys) {
        if (data[key] && typeof data[key] === "string") {
            try {
                let cleanedStr = data[key].trim();
                if (cleanedStr.startsWith("```json")) {
                    cleanedStr = cleanedStr.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
                } else if (cleanedStr.startsWith("```")) {
                    cleanedStr = cleanedStr.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
                }
                const parsedArray = JSON.parse(cleanedStr);
                if (Array.isArray(parsedArray)) {
                    data[key] = parsedArray;
                    logger.info(`  [Sanitizer] Successfully parsed stringified array for key: ${key}`);
                }
            } catch (err: any) {
                logger.warn(`  [Sanitizer] Failed to parse stringified array for key ${key}: ${err.message}`);
            }
        }
    }

    if (data.esg_highlights && typeof data.esg_highlights === "object") {
        for (const subKey of ["environmental", "social", "governance", "certifications", "esg_ratings", "sustainability_goals"]) {
            if (data.esg_highlights[subKey] && typeof data.esg_highlights[subKey] === "string") {
                try {
                    const parsed = JSON.parse(data.esg_highlights[subKey]);
                    if (Array.isArray(parsed)) data.esg_highlights[subKey] = parsed;
                } catch {}
            }
        }
    }

    if (data.business_description && typeof data.business_description === "object") {
        for (const subKey of ["products", "services", "segments", "revenue_drivers", "competitive_advantages", "geographies"]) {
            if (data.business_description[subKey] && typeof data.business_description[subKey] === "string") {
                try {
                    const parsed = JSON.parse(data.business_description[subKey]);
                    if (Array.isArray(parsed)) data.business_description[subKey] = parsed;
                } catch {}
            }
        }
    }

    if (data.management_discussion && typeof data.management_discussion === "object") {
        for (const subKey of ["growth_drivers", "challenges", "future_strategy", "industry_trends", "key_highlights"]) {
            if (data.management_discussion[subKey] && typeof data.management_discussion[subKey] === "string") {
                try {
                    const parsed = JSON.parse(data.management_discussion[subKey]);
                    if (Array.isArray(parsed)) data.management_discussion[subKey] = parsed;
                } catch {}
            }
        }
    }

    if (data.ai_context && typeof data.ai_context === "object") {
        for (const subKey of ["bull_points", "bear_points", "key_monitorables"]) {
            if (data.ai_context[subKey] && typeof data.ai_context[subKey] === "string") {
                try {
                    const parsed = JSON.parse(data.ai_context[subKey]);
                    if (Array.isArray(parsed)) data.ai_context[subKey] = parsed;
                } catch {}
            }
        }
    }

    return data;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 4 — Orchestrate extraction for one company
// ═════════════════════════════════════════════════════════════════════════════

interface CompanyOptions {
    dryRun?: boolean;
}

export async function processCompany(symbol: string, isin?: string, options: CompanyOptions = {}) {
    logger.info(`\n${"═".repeat(60)}`);
    logger.info(`Processing: ${symbol} ${isin ? `(${isin})` : ""}`);
    logger.info(`${"═".repeat(60)}`);

    const errors: string[] = [];
    const reportDoc: any = {
        symbol: symbol.toUpperCase(),
        isin,
        processing_errors: [] as string[],
        raw_sections_extracted: [] as string[],
    };

    let pdfResult: PDFResult;
    try {
        pdfResult = await fetchAnnualReportPDF(symbol, isin);
        reportDoc.source_url = pdfResult.url;
        if (pdfResult.date) reportDoc.report_date = new Date(pdfResult.date);
        logger.info(`✓ PDF downloaded from ${pdfResult.source}`);
    } catch (err: any) {
        logger.error(`✗ PDF download failed: ${err.message}`);
        errors.push(`PDF download: ${err.message}`);
        reportDoc.processing_errors = errors;
        if (!options.dryRun) await upsertReport(reportDoc);
        return { success: false, symbol, error: err.message };
    }

    let sections: Record<string, string>, pageCount: number, fiscalYear: string, foundSections: string[];
    try {
        ({ sections, pageCount, fiscalYear, foundSections } =
            await extractPDFSections(pdfResult.buffer));
        reportDoc.pdf_pages = pageCount;
        reportDoc.fiscal_year = fiscalYear;
        reportDoc.raw_sections_extracted = foundSections;

        // Save filing metadata to MongoDB
        if (!options.dryRun) {
            await AnnualReportFiling.findOneAndUpdate(
                { symbol: reportDoc.symbol, fiscal_year: fiscalYear },
                {
                    symbol: reportDoc.symbol,
                    isin: reportDoc.isin,
                    pdfUrl: reportDoc.source_url,
                    source: pdfResult.source,
                    pdf_pages: pageCount,
                    fiscal_year: fiscalYear,
                    downloadedAt: new Date(),
                    reportDate: reportDoc.report_date
                },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
            logger.info(`✓ Saved filing metadata to MongoDB for ${symbol} ${fiscalYear}`);
        }
    } catch (err: any) {
        logger.error(`✗ PDF extraction failed: ${err.message}`);
        errors.push(`PDF extraction: ${err.message}`);
        reportDoc.processing_errors = errors;
        if (!options.dryRun) await upsertReport(reportDoc);
        return { success: false, symbol, error: err.message };
    }

    logger.info(`\nRunning LLM extraction on ${foundSections.length} sections...`);

    const allExtracted: any = {};
    const limit = pLimit(CONFIG.concurrency);

    const extractionTasks = Object.entries(EXTRACTION_PROMPTS)
        .filter(([key]) => key !== "synthesis" && sections[key])
        .map(([key, promptFn]) =>
            limit(async () => {
                const prompt = promptFn(sections[key]);
                let result = await callGroq(prompt, symbol, key);
                if (result) {
                    result = sanitizeExtractedData(result);
                    Object.assign(allExtracted, result);
                    Object.assign(reportDoc, result);
                } else {
                    errors.push(`LLM extraction failed for section: ${key}`);
                }
            })
        );

    await Promise.all(extractionTasks);

    logger.info("\nRunning synthesis pass...");
    const companyName =
        allExtracted.business_description?.company_name || symbol;

    const synthesisPrompt = EXTRACTION_PROMPTS.synthesis(companyName, allExtracted);
    const synthesis = await callGroq(synthesisPrompt, symbol, "synthesis");

    if (synthesis) {
        const sanitizedSynthesis = sanitizeExtractedData(synthesis);
        reportDoc.business_summary = sanitizedSynthesis.business_summary;
        reportDoc.ai_context = sanitizedSynthesis.ai_context;
        reportDoc.company_name = companyName;
    }

    reportDoc.processing_errors = errors;
    reportDoc.processed_at = new Date();

    if (options.dryRun) {
        logger.info("\n[DRY RUN] Would save this document:");
        console.log(JSON.stringify(reportDoc, null, 2));
        return { success: true, symbol, dryRun: true };
    }

    try {
        const savedId = await upsertReport(reportDoc);
        logger.info(`\n✓ Saved to MongoDB: ${savedId}`);
        return { success: true, symbol, mongoId: savedId, fiscalYear };
    } catch (err: any) {
        logger.error(`✗ MongoDB save failed: ${err.message}`);
        return { success: false, symbol, error: err.message };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 5 — MongoDB upsert
// ═════════════════════════════════════════════════════════════════════════════

async function upsertReport(doc: any) {
    const filter = { symbol: doc.symbol, fiscal_year: doc.fiscal_year };
    const result: any = await AnnualReport.findOneAndUpdate(filter, { $set: doc }, {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
    });
    return result._id;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 6 — Batch runner
// ═════════════════════════════════════════════════════════════════════════════

interface BatchCompany {
    symbol: string;
    isin?: string;
}

async function runBatch(companies: BatchCompany[], options: CompanyOptions = {}) {
    logger.info(`\nStarting batch: ${companies.length} companies`);
    logger.info(`Concurrency: ${CONFIG.concurrency}, Delay: ${CONFIG.requestDelayMs}ms\n`);

    const results = { success: [] as string[], failed: [] as any[] };

    for (let i = 0; i < companies.length; i++) {
        const { symbol, isin } = companies[i];
        logger.info(`\n[${i + 1}/${companies.length}] ${symbol}`);

        try {
            const result = await processCompany(symbol, isin, options);
            if (result.success) {
                results.success.push(symbol);
            } else {
                results.failed.push({ symbol, error: result.error });
            }
        } catch (err: any) {
            logger.error(`Unhandled error for ${symbol}: ${err.message}`);
            results.failed.push({ symbol, error: err.message });
        }

        if (i < companies.length - 1) {
            await delay(3000);
        }
    }

    logger.info(`\n${"═".repeat(60)}`);
    logger.info(`BATCH COMPLETE`);
    logger.info(`Success: ${results.success.length} | Failed: ${results.failed.length}`);
    if (results.failed.length) {
        logger.warn(`Failed companies:`);
        results.failed.forEach((f) => logger.warn(`  - ${f.symbol}: ${f.error}`));
    }

    return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// CLI entrypoint
// ═════════════════════════════════════════════════════════════════════════════

interface ParsedArgs {
    symbol?: string;
    isin?: string;
    batchFile?: string;
    dryRun: boolean;
    source?: string;
}

function parseArgs(): ParsedArgs {
    const args = process.argv.slice(2);
    const opts: ParsedArgs = { dryRun: false };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case "--symbol": opts.symbol = args[++i]; break;
            case "--isin": opts.isin = args[++i]; break;
            case "--batch": opts.batchFile = args[++i]; break;
            case "--dry-run": opts.dryRun = true; break;
            case "--source": opts.source = args[++i]; break;
            default: break;
        }
    }

    return opts;
}

async function main() {
    const opts = parseArgs();

    if (!CONFIG.groqApiKey) {
        logger.error("GROQ_API_KEY env variable is not set. Get one free at https://console.groq.com");
        process.exit(1);
    }

    // Connect to MongoDB (skip in dry-run) Only if running as CLI and not in Express
    if (!opts.dryRun) {
        try {
            await mongoose.connect(CONFIG.mongoUri);
            logger.info(`Connected to MongoDB: ${CONFIG.mongoUri}`);
        } catch (err: any) {
            logger.error(`MongoDB connection failed: ${err.message}`);
            process.exit(1);
        }
    }

    try {
        if (opts.batchFile) {
            const companies = JSON.parse(fs.readFileSync(opts.batchFile, "utf8"));
            await runBatch(companies, { dryRun: opts.dryRun });
        } else if (opts.symbol) {
            await processCompany(opts.symbol, opts.isin, { dryRun: opts.dryRun });
        }
    } finally {
        if (!opts.dryRun && mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

// ── Utility helpers ───────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
}

function getPrevYearDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
}

// Run only if executed directly via node or ts-node
if (require.main === module) {
    main().catch((err: any) => {
        logger.error(`Fatal: ${err.message}`);
        console.error(err);
        process.exit(1);
    });
}
