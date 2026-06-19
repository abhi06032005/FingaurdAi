
/**
 * ============================================================
 * AI Report Generation Service  (token-optimised)
 * ============================================================
 * Data sources:
 *   1. MongoDB `stocks`        — live screener data
 *   2. MongoDB `annual_reports`— PDF-extracted structured insights
 *
 * Key design principles:
 *   • Extract ONLY the signal — specific numbers, not raw blobs
 *   • Last N periods only     — 4 quarters, 4 annual years
 *   • Skip null/all-null rows — don't send empty noise
 *   • Compact table format    — tokens, not JSON overhead
 *   • Limit arrays to top 3   — quality > quantity
 *   • Latest 2 annual reports — enough context, less waste
 * ============================================================
 */

import 'dotenv/config'; // must be first — loads env vars before any SDK client init
import { GoogleGenerativeAI } from '@google/generative-ai';
import Stock from '../models/Stock';
import { AnnualReport } from '../models/AnnualReport';
import { CompanyAIReport } from '../models/CompanyAIReport';
import { geminiQueue } from '../utils/geminiRateLimiter';


// ── Gemini client (lazy — always reads env var at call time, never at module load) ───
const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-2.5-pro';

function getGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ═════════════════════════════════════════════════════════════════════════════
// SMART DATA EXTRACTORS  — pull only what an analyst actually needs
// ═════════════════════════════════════════════════════════════════════════════

type MetricRow = Record<string, any>;

/**
 * Given array of {Metric, period1, period2, ...} rows, return a compact table
 * for only the requested metric names and last N periods.
 * Skips any column whose values are all null.
 */
function extractMetricTable(
  rows: MetricRow[],
  wantedMetrics: string[],
  lastNPeriods: number
): string {
  if (!Array.isArray(rows) || rows.length === 0) return 'No data';

  // Collect all period keys (everything except "Metric")
  const allPeriods = Object.keys(rows[0] || {}).filter((k) => k !== 'Metric');
  if (allPeriods.length === 0) return 'No data';

  // Take the last N periods
  const periods = allPeriods.slice(-lastNPeriods);

  // Filter rows to wanted metrics only
  const filteredRows = rows.filter((r) => wantedMetrics.includes(r.Metric));
  if (filteredRows.length === 0) return 'No data';

  // Skip periods where ALL selected rows have null values (truly empty columns)
  const usablePeriods = periods.filter((p) =>
    filteredRows.some((r) => r[p] !== null && r[p] !== undefined)
  );
  if (usablePeriods.length === 0) return 'No data';

  // Build header
  const header = ['Metric'.padEnd(28), ...usablePeriods.map((p) => p.padStart(10))].join(' | ');
  const divider = '-'.repeat(header.length);

  // Build rows
  const tableRows = filteredRows.map((r) => {
    const cells = [r.Metric.padEnd(28), ...usablePeriods.map((p) => {
      const v = r[p];
      return (v === null || v === undefined ? '-' : String(v)).padStart(10);
    })];
    return cells.join(' | ');
  });

  return [header, divider, ...tableRows].join('\n');
}

/**
 * Extract the latest available value for a metric from a row array.
 */
function latestValue(rows: MetricRow[], metricName: string): string {
  const row = rows?.find((r) => r.Metric === metricName);
  if (!row) return 'N/A';
  const periods = Object.keys(row).filter((k) => k !== 'Metric');
  // walk backwards to find last non-null
  for (let i = periods.length - 1; i >= 0; i--) {
    const v = row[periods[i]];
    if (v !== null && v !== undefined) return `${v}`;
  }
  return 'N/A';
}

/**
 * Extract shareholding trend — last N quarters.
 */
function extractShareholding(shareholding: any, lastNPeriods = 6): string {
  const quarterly: MetricRow[] = shareholding?.quarterly;
  if (!Array.isArray(quarterly) || quarterly.length === 0) return 'No data';

  // Get all period keys (e.g. "Jun 2023", "Sep 2023", etc.)
  const firstRow = quarterly[0];
  const labelKey = Object.keys(firstRow).find(k => k === '' || k === 'Metric') || '';
  const allPeriods = Object.keys(firstRow).filter((k) => k !== labelKey && k !== 'Metric' && k !== '__v');
  if (allPeriods.length === 0) return 'No data';

  // Take the last N periods
  const periods = allPeriods.slice(-lastNPeriods);

  // Build header
  const header = ['Category'.padEnd(20), ...periods.map((p) => p.padStart(10))].join(' | ');
  const divider = '-'.repeat(header.length);

  const lines: string[] = [header, divider];
  for (const row of quarterly) {
    const name = (row[labelKey] || '').replace(/ \+$/, '').trim();
    if (!name || name.toLowerCase().includes('shareholders')) continue;
    
    const cells = [name.padEnd(20), ...periods.map((p) => {
      const v = row[p];
      return (v === null || v === undefined ? '-' : `${v}%`).padStart(10);
    })];
    lines.push(cells.join(' | '));
  }
  return lines.join('\n');
}

/**
 * Extract compounded growth figures from P&L metadata.
 */
function extractGrowthRates(pnl: any): string {
  const salesGrowth: MetricRow[] = pnl?.['Compounded Sales Growth'];
  const profitGrowth: MetricRow[] = pnl?.['Compounded Profit Growth'];
  const stockPrice: MetricRow[] = pnl?.['Stock Price CAGR'];
  const roe: MetricRow[] = pnl?.['Return on Equity'];
  if (!salesGrowth && !profitGrowth) return 'No data';

  const fmt = (arr: any[], label: string) => {
    if (!Array.isArray(arr)) return '';
    return arr
      .map((item) => {
        const [k, v] = Object.entries(item)[0] || [];
        return k && v !== undefined ? `${label} ${k.trim()} ${v}%` : '';
      })
      .filter(Boolean)
      .join('  |  ');
  };

  const parts = [
    salesGrowth ? `Sales CAGR → ${fmt(salesGrowth, '')}` : '',
    profitGrowth ? `Profit CAGR → ${fmt(profitGrowth, '')}` : '',
    roe ? `ROE → ${fmt(roe, '')}` : '',
  ].filter(Boolean);

  return parts.join('\n');
}

/**
 * Extract peers — only name + key ratio columns, max 8 peers.
 */
function extractPeers(peers: any): string {
  if (!Array.isArray(peers)) return 'No data';

  // The peers array typically has [{}, {median_summary: [...]}] or actual peer rows
  const peerRows = peers.filter(
    (p: any) => p && typeof p === 'object' && !p.median_summary && Object.keys(p).length > 2
  );

  if (peerRows.length === 0) {
    // Try to extract median summary at minimum
    const median = peers.find((p: any) => p?.median_summary);
    if (median?.median_summary) {
      return `Sector median data available (${median.median_summary.filter(Boolean).join(', ')})`;
    }
    return 'Detailed peer data not available';
  }

  const top = peerRows.slice(0, 8);
  const keys = Object.keys(top[0]).slice(0, 6); // name + max 5 metrics
  const header = keys.join(' | ');
  const rows = top.map((p: any) => keys.map((k) => String(p[k] ?? '-')).join(' | '));
  return [header, ...rows].join('\n');
}

/**
 * Extract only the P&L annual_data array from the profit_and_loss object.
 */
function getPnLRows(pnl: any): MetricRow[] {
  if (Array.isArray(pnl)) return pnl; // fallback if stored as plain array
  if (Array.isArray(pnl?.annual_data)) return pnl.annual_data;
  return [];
}

// ═════════════════════════════════════════════════════════════════════════════
// DATA GATHERING
// ═════════════════════════════════════════════════════════════════════════════

export interface ReportDataBundle {
  stock: any | null;
  annualReports: any[];
  ticker: string;
  companyName: string;
}

export async function gatherCompanyData(ticker: string): Promise<ReportDataBundle> {
  const symbol = ticker.toUpperCase().trim();

  const [stockDoc, annualReportDocs] = await Promise.all([
    Stock.findOne({ ticker: symbol }).lean(),
    // Only fetch 2 most recent annual reports — latest + one prior for trend
    AnnualReport.find({ symbol })
      .sort({ fiscal_year: -1 })
      .limit(2)
      // Project only the fields we actually use in the prompt
      .select({
        symbol: 1,
        fiscal_year: 1,
        company_name: 1,
        business_description: 1,
        ceo_message: 1,
        management_discussion: 1,
        industry_outlook: 1,
        risk_factors: 1,
        capex_plans: 1,
        total_capex_guidance: 1,
        guidance: 1,
        operational_metrics: 1,
        corporate_actions: 1,
        overall_audit_opinion: 1,
        auditor_remarks: 1,
        esg_highlights: 1,
        ai_context: 1,
      })
      .lean(),
  ]);

  const companyName =
    (stockDoc as any)?.company_name ||
    (annualReportDocs[0] as any)?.company_name ||
    symbol;

  return { stock: stockDoc, annualReports: annualReportDocs, ticker: symbol, companyName };
}

// ═════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER  — compact, analyst-grade, token-efficient
// ═════════════════════════════════════════════════════════════════════════════

/** Limit array to N items, skip null/empty strings */
function top(arr: any[] | undefined, n = 3): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => x && typeof x === 'string' && x.trim()).slice(0, n);
}

/** One-line join of top N array items */
function topLine(arr: any[] | undefined, n = 3): string {
  const t = top(arr, n);
  return t.length ? t.join('; ') : 'N/A';
}

export function buildAnalysisPrompt(bundle: ReportDataBundle): string {
  const { stock, annualReports, ticker, companyName } = bundle;

  const parts: string[] = [];

  // ── SECTION 1: Stock / Screener Data ─────────────────────────────────────
  if (stock) {
    const s = stock as any;
    const pnlRows = getPnLRows(s.profit_and_loss);
    const bsRows: MetricRow[] = Array.isArray(s.balance_sheet) ? s.balance_sheet : [];
    const cfRows: MetricRow[] = Array.isArray(s.cash_flow) ? s.cash_flow : [];
    const ratioRows: MetricRow[] = Array.isArray(s.ratios) ? s.ratios : [];
    const qtrRows: MetricRow[] = Array.isArray(s.quarters) ? s.quarters : [];

    parts.push(`## SCREENER DATA | ${companyName} (${ticker})`);

    // ── Quarterly: last 8 quarters ──────────────────
    parts.push(`\n### Quarterly Results (last 8 quarters, ₹ Cr)`);
    parts.push(extractMetricTable(qtrRows, ['Sales', 'Expenses', 'Operating Profit', 'OPM %', 'Interest', 'Depreciation', 'Net Profit'], 8));

    // ── P&L: last 8 annual years ──────────────────────
    parts.push(`\n### Annual P&L (last 8 years, ₹ Cr)`);
    parts.push(extractMetricTable(pnlRows, [
      'Sales', 'Expenses', 'Operating Profit', 'OPM %', 'Other Income',
      'Interest', 'Depreciation', 'Profit before tax', 'Tax %', 'Net Profit',
      'EPS in Rs', 'Dividend Payout %'
    ], 8));

    // Growth rates (compact)
    const growthStr = extractGrowthRates(s.profit_and_loss);
    if (growthStr && growthStr !== 'No data') {
      parts.push(`\n### Compounded Growth & ROE Rates`);
      parts.push(growthStr);
    }

    // ── Balance Sheet: last 6 years ───────────────────────
    parts.push(`\n### Balance Sheet (last 6 years, ₹ Cr)`);
    parts.push(extractMetricTable(
      bsRows,
      ['Equity Capital', 'Reserves', 'Borrowings', 'Total Liabilities', 'Fixed Assets', 'CWIP', 'Investments', 'Total Assets'],
      6
    ));

    // ── Cash Flow: last 6 years ───────────────────────────────────────────
    parts.push(`\n### Cash Flow (last 6 years, ₹ Cr)`);
    parts.push(extractMetricTable(
      cfRows,
      ['Cash from Operating Activity', 'Cash from Investing Activity', 'Cash from Financing Activity', 'Net Cash Flow', 'Free Cash Flow', 'CFO/OP'],
      6
    ));

    // ── Ratios: last 6 years ─────────────────
    parts.push(`\n### Efficiency & Return Ratios (last 6 years)`);
    parts.push(extractMetricTable(
      ratioRows,
      ['Debtor Days', 'Inventory Days', 'Days Payable', 'Cash Conversion Cycle', 'Working Capital Days', 'ROCE %'],
      6
    ));

    // ── Shareholding: last 6 quarters ───────────────────────────────
    const shaStr = extractShareholding(s.shareholding, 6);
    if (shaStr && shaStr !== 'No data') {
      parts.push(`\n### Shareholding Pattern (last 6 quarters)`);
      parts.push(shaStr);
    }

    // ── Peers: condensed ─────────────────────────────────────────────────
    const peerStr = extractPeers(s.peers);
    if (peerStr && peerStr !== 'No data') {
      parts.push(`\n### Peer Comparison`);
      parts.push(peerStr);
    }
  } else {
    parts.push(`## SCREENER DATA\n⚠ No stock data for ${ticker}. Base analysis on annual reports only.`);
  }

  // ── SECTION 2: Annual Reports ─────────────────────────────────────────────
  parts.push(`\n## ANNUAL REPORTS (${annualReports.length} year/s)`);

  for (const report of annualReports) {
    const r = report as any;
    parts.push(`\n### FY: ${r.fiscal_year || 'N/A'}`);

    if (r.business_summary) {
      parts.push(`Business Summary: ${r.business_summary}`);
    }

    // Business Overview
    const bd = r.business_description;
    if (bd) {
      parts.push(`Sector: ${bd.sector || 'N/A'}`);
      parts.push(`Model: ${bd.business_model || 'N/A'}`);
      if (Array.isArray(bd.competitive_advantages) && bd.competitive_advantages.length > 0) {
        parts.push(`Competitive Advantages / Economic Moats: ${bd.competitive_advantages.join('; ')}`);
      }
      if (Array.isArray(bd.segments) && bd.segments.length > 0) {
        parts.push(`Key Business Segments: ${bd.segments.join('; ')}`);
      }
      if (Array.isArray(bd.products) && bd.products.length > 0) {
        parts.push(`Key Products: ${bd.products.join('; ')}`);
      }
      if (Array.isArray(bd.services) && bd.services.length > 0) {
        parts.push(`Key Services: ${bd.services.join('; ')}`);
      }
      if (Array.isArray(bd.revenue_drivers) && bd.revenue_drivers.length > 0) {
        parts.push(`Revenue Drivers: ${bd.revenue_drivers.join('; ')}`);
      }
      if (Array.isArray(bd.geographies) && bd.geographies.length > 0) {
        parts.push(`Geographical Footprint: ${bd.geographies.join('; ')}`);
      }
    }

    // CEO Message & Tone
    const ceo = r.ceo_message;
    if (ceo) {
      if (ceo.summary) parts.push(`\nCEO Address Summary (Tone: ${ceo.tone || 'N/A'}): ${ceo.summary}`);
      if (ceo.vision) parts.push(`CEO Long-term Vision: ${ceo.vision}`);
      if (Array.isArray(ceo.key_achievements) && ceo.key_achievements.length > 0) {
        parts.push(`CEO Highlighted Achievements: ${ceo.key_achievements.join('; ')}`);
      }
      if (Array.isArray(ceo.priorities_for_next_year) && ceo.priorities_for_next_year.length > 0) {
        parts.push(`CEO Priorities for Coming Year: ${ceo.priorities_for_next_year.join('; ')}`);
      }
      if (Array.isArray(ceo.notable_quotes) && ceo.notable_quotes.length > 0) {
        parts.push(`CEO Key Quotes: ${ceo.notable_quotes.join('; ')}`);
      }
    }

    // MD&A
    const md = r.management_discussion;
    if (md) {
      if (md.revenue_explanation) parts.push(`\nMD&A Revenue Commentary: ${md.revenue_explanation}`);
      if (md.profit_explanation) parts.push(`MD&A Profit/Margin Commentary: ${md.profit_explanation}`);
      if (md.demand_outlook) parts.push(`MD&A Market Demand Outlook: ${md.demand_outlook}`);
      if (Array.isArray(md.growth_drivers) && md.growth_drivers.length > 0) {
        parts.push(`Key Industry Growth Drivers: ${md.growth_drivers.join('; ')}`);
      }
      if (Array.isArray(md.challenges) && md.challenges.length > 0) {
        parts.push(`Identified Operational Challenges: ${md.challenges.join('; ')}`);
      }
      if (Array.isArray(md.future_strategy) && md.future_strategy.length > 0) {
        parts.push(`Corporate Strategic Outlook: ${md.future_strategy.join('; ')}`);
      }
      if (Array.isArray(md.industry_trends) && md.industry_trends.length > 0) {
        parts.push(`MD&A Industry Trends: ${md.industry_trends.join('; ')}`);
      }
      if (Array.isArray(md.key_highlights) && md.key_highlights.length > 0) {
        parts.push(`Other Key MD&A Highlights: ${md.key_highlights.join('; ')}`);
      }
    }

    // Industry Outlook & Context
    if (report === annualReports[0]) {
      const io = r.industry_outlook;
      if (io) {
        parts.push(`\nIndustry Outlook (Sector: ${io.sector || 'N/A'}):`);
        if (io.market_size) parts.push(`  Market Size / Addressable Market: ${io.market_size}`);
        if (io.growth_rate) parts.push(`  Expected Sector Growth Rate: ${io.growth_rate}`);
        if (Array.isArray(io.tailwinds) && io.tailwinds.length > 0) {
          parts.push(`  Industry Tailwinds: ${io.tailwinds.join('; ')}`);
        }
        if (Array.isArray(io.headwinds) && io.headwinds.length > 0) {
          parts.push(`  Industry Headwinds / Barriers: ${io.headwinds.join('; ')}`);
        }
        if (io.regulatory_environment) parts.push(`  Regulatory Context: ${io.regulatory_environment}`);
        if (Array.isArray(io.key_trends) && io.key_trends.length > 0) {
          parts.push(`  Sector Key Trends: ${io.key_trends.join('; ')}`);
        }
        if (io.competitive_landscape) parts.push(`  Competitive Landscape Structure: ${io.competitive_landscape}`);
      }

      // Guidance
      const g = r.guidance;
      if (g) {
        parts.push(`\nManagement Outlook & Forecasts (Confidence: ${g.confidence_level || 'N/A'}):`);
        if (g.management_outlook) parts.push(`  Management Commentary: ${g.management_outlook}`);
        if (g.revenue_guidance) parts.push(`  Revenue Growth Guidance: ${g.revenue_guidance}`);
        if (g.margin_guidance) parts.push(`  Operating Margin Guidance: ${g.margin_guidance}`);
        if (g.volume_guidance) parts.push(`  Volume Growth target: ${g.volume_guidance}`);
        if (Array.isArray(g.key_assumptions) && g.key_assumptions.length > 0) {
          parts.push(`  Key Model Assumptions: ${g.key_assumptions.join('; ')}`);
        }
        if (Array.isArray(g.near_term_focus) && g.near_term_focus.length > 0) {
          parts.push(`  Near-term Strategic Focus: ${g.near_term_focus.join('; ')}`);
        }
      }

      // CapEx Plans
      if (Array.isArray(r.capex_plans) && r.capex_plans.length > 0) {
        parts.push(`\nPlanned Capital Expenditures (Total Budget Guidance: ${r.total_capex_guidance || 'N/A'}):`);
        r.capex_plans.forEach((cp: any) => {
          parts.push(`  • Project: ${cp.project || 'N/A'} | Type: ${cp.type || 'N/A'} | Budgeted Cost: ${cp.cost || 'N/A'} | Location: ${cp.location || 'N/A'} | Status: ${cp.status || 'N/A'} | Timeline: ${cp.completion || 'N/A'} | Added Capacity: ${cp.capacity_addition || 'N/A'} | Rationale: ${cp.strategic_rationale || 'N/A'}`);
        });
      }
    }

    // Corporate Actions
    if (Array.isArray(r.corporate_actions) && r.corporate_actions.length > 0) {
      parts.push(`\nCorporate Actions, M&A & Joint Ventures:`);
      r.corporate_actions.forEach((ca: any) => {
        parts.push(`  • [${ca.type || 'Action'}] Partner/Target: ${ca.entity || 'N/A'} | Transaction Value: ${ca.value || 'N/A'} | Timing: ${ca.date || 'N/A'} | Strategic Impact: ${ca.impact || 'N/A'} | Rationale: ${ca.rationale || 'N/A'}`);
      });
    }

    // Risk Factors
    if (Array.isArray(r.risk_factors) && r.risk_factors.length > 0) {
      parts.push(`\nKey Risk Factors & Mitigations:`);
      r.risk_factors.forEach((rf: any) => {
        parts.push(`  • [${rf.impact || 'Medium'} Impact] Risk: ${rf.risk || 'N/A'} (Category: ${rf.category || 'N/A'}) - Description: ${rf.description || 'N/A'} - Mitigation: ${rf.mitigation || 'N/A'}`);
      });
    }

    // Auditor remarks
    if (Array.isArray(r.auditor_remarks) && r.auditor_remarks.length > 0) {
      parts.push(`\nAuditor Opinion and Remarks (Overall Opinion: ${r.overall_audit_opinion || 'clean'}):`);
      r.auditor_remarks.forEach((am: any) => {
        parts.push(`  • Type: ${am.type || 'Remark'} (Severity: ${am.severity || 'green'}) - Auditor Notes: ${am.description || 'N/A'} - Financial Impact: ${am.financial_impact || 'N/A'}`);
      });
    }

    // ESG highlights
    const esg = r.esg_highlights;
    if (esg) {
      parts.push(`\nESG Performance:`);
      if (esg.csr_spend) parts.push(`  CSR Spend: ${esg.csr_spend}`);
      if (Array.isArray(esg.environmental) && esg.environmental.length > 0) parts.push(`  Environmental Initiatives: ${esg.environmental.join('; ')}`);
      if (Array.isArray(esg.social) && esg.social.length > 0) parts.push(`  Social & Employee Programs: ${esg.social.join('; ')}`);
      if (Array.isArray(esg.governance) && esg.governance.length > 0) parts.push(`  Board Governance & Controls: ${esg.governance.join('; ')}`);
      if (Array.isArray(esg.certifications) && esg.certifications.length > 0) parts.push(`  Accreditations & Certifications: ${esg.certifications.join('; ')}`);
      if (Array.isArray(esg.esg_ratings) && esg.esg_ratings.length > 0) parts.push(`  Third-Party ESG Ratings: ${esg.esg_ratings.join('; ')}`);
      if (Array.isArray(esg.sustainability_goals) && esg.sustainability_goals.length > 0) parts.push(`  Sustainability Goals: ${esg.sustainability_goals.join('; ')}`);
    }

    // Operational KPIs
    const metrics = r.operational_metrics?.metrics;
    if (Array.isArray(metrics) && metrics.length > 0) {
      parts.push(`\nOperational KPIs (Sector Category: ${r.operational_metrics.sector_type || 'N/A'}):`);
      metrics.forEach((m: any) => {
        parts.push(`  • ${m.name || 'N/A'}: ${m.value || 'N/A'} | Trend: ${m.trend || 'stable'} | Context: ${m.comment || 'N/A'}`);
      });
    }

    // AI context
    const ai = r.ai_context;
    if (ai?.bull_points?.length || ai?.bear_points?.length) {
      parts.push(`\nSynthesized Analyst Summary:`);
      if (ai.one_liner) parts.push(`   Bloomberg One-Liner: ${ai.one_liner}`);
      if (Array.isArray(ai.bull_points)) parts.push(`  Bull Arguments: ${ai.bull_points.join('; ')}`);
      if (Array.isArray(ai.bear_points)) parts.push(`  Bear Arguments: ${ai.bear_points.join('; ')}`);
    }
  }

  // ── INSTRUCTION BLOCK ────────────────────────────────────────────────────
  const instruction = `
## ROLE
You are a Managing Director of Equity Research at a tier-1 investment bank (such as JP Morgan or Goldman Sachs). You write exhaustive, high-conviction, professional investment research reports for sophisticated institutional asset managers.

Your analysis style is:
- **Exhaustive & Comprehensive**: Write in-depth, long, analysis-heavy prose. Avoid short summaries. Every text section must be long, dense, and provide deep strategic insights.
- **Deep-Dive Rationale**: Never write high-level lists without context. Explain the underlying unit economics, sector dynamics, raw material movements, input-cost fluctuations, and strategic management shifts.
- **Strictly Data-Backed**: Every analytical assertion must be backed by quoting specific figures, years, basis point shifts, or growth rates.
- **Zero Repetition (Critical)**: Each JSON field must represent a completely distinct analytical angle. Do not copy-paste or repeat descriptions across different sections. Specifically:
  - **executive_summary.company_overview**: Focus ONLY on core business model, segments, size, scale, and competitive positioning (moat). DO NOT discuss margins, FCF, or future guidance here.
  - **executive_summary.investment_thesis**: Focus ONLY on future long-term compounding growth catalysts, macro/industry tailwinds, and the single most critical structural threat (thesis-killer).
  - **financial_snapshot.revenue_trend**: Focus ONLY on multi-year revenue growth. Cite 3Y/5Y/10Y Sales CAGRs. Explain using business segments.
  - **financial_snapshot.profit_trend**: Focus ONLY on net profit growth (PAT). Cite PAT CAGRs. Explain factors like tax rate shifts, interest expenses, or other non-operating income contribution.
  - **financial_snapshot.margin_analysis**: Focus ONLY on OPM % trajectory, gross margin trends, raw material pricing pressure, capacity utilization, and operating leverage.
  - **financial_snapshot.balance_sheet_health**: Focus ONLY on borrowings, reserves, Debt-to-Equity ratio, fixed assets additions, and CWIP (Capital Work in Progress) growth.
  - **financial_snapshot.cash_flow_summary**: Focus ONLY on CFO, FCF, FCF/PAT conversion ratio, and earnings quality (CFO/OP). Detail how capex is funded.
  - **strategic_outlook.management_guidance**: Focus ONLY on management's targets, revenue growth guidance, operating margin targets, volume growth targets, and key near-term focus.
  - **strategic_outlook.capex_plans**: Focus ONLY on greenfield and brownfield projects, project costs, timelines, capacity additions, and strategic rationale.
  - **strategic_outlook.long_term_vision**: Focus ONLY on the 5-10 year corporate roadmap, digital leadership goals, sustainability targets (e.g. net-zero), and promoter alignment.

## JSON FORMATTING INSTRUCTIONS:
- Return ONLY a single valid JSON object matching the schema below.
- Do NOT wrap in markdown code fences (\`\`\`json). No conversational preamble or postscript.
- For text keys, use markdown formatting (like bold numbers, bullet lists) for readability. Make the text detailed and insight-dense.

{
  "executive_summary": {
    "company_overview": "A detailed 3-paragraph institutional-grade analysis of the company's business model, segments, size, scale, and strategic position.",
    "one_liner": "A single Bloomberg-terminal style sentence: '[Company Name] is a [industry segment] leader with ₹[latest revenue] Cr in revenue, driven by [core growth engine] and insulated by a [specific moat].'",
    "investment_thesis": "A substantive, 2-paragraph investment thesis detailing long-term structural drivers, economic moats, and the most critical risk that would impair the thesis."
  },
  "financial_snapshot": {
    "revenue_trend": "A detailed analysis of the multi-year revenue trend. Cite the 3Y, 5Y, and 10Y CAGRs. Contrast historical years with the latest annual figure (FY25/FY26) and explain the growth drivers or decelerations using business segments.",
    "profit_trend": "An analytical view of net profit growth. State the 10Y/5Y/3Y PAT CAGRs. Explain the profit volatility or growth in terms of tax rate shifts, interest expenses, or other income contribution (e.g. other income rising to ₹23,630 Cr in Mar 2026).",
    "margin_analysis": "Deconstruct the operating profit margin (OPM %) trajectory over the last 4-6 years. Explain margin compression or expansion (e.g. OPM ranging from 8% to 14%). Connect margin changes directly to input costs, operating leverage, or product mix.",
    "balance_sheet_health": "Detail the capital structure. Trace Borrowings vs. Reserves over the last 4-6 years. Compute the Debt-to-Equity ratio for the latest year. Analyze CWIP (Capital Work in Progress) growth to assess the capex pipeline and leverage risk.",
    "cash_flow_summary": "Assess cash flow strength. Quote latest CFO (₹Cr) and FCF (₹Cr). Calculate the FCF/PAT conversion ratio. Examine the CFO/OP ratio (earnings quality) over the years and explain if cash flows are keeping pace with reported profits.",
    "key_ratios": [
      {"name": "ROCE %", "value": "latest value", "benchmark": "sector average or >15% standard", "interpretation": "Capital efficiency trend over 6 years and its meaning for equity return."},
      {"name": "ROE %", "value": "latest value", "benchmark": "cost of equity (~12-14%)", "interpretation": "Deconstruct ROE using DuPont elements: margins, asset turnover, and leverage multiplier."},
      {"name": "OPM %", "value": "latest value", "benchmark": "historical 4-year range", "interpretation": "Operating margin trajectory and pricing power assessment."},
      {"name": "Debt/Equity", "value": "calculated value", "benchmark": "<1x conservative threshold", "interpretation": "Leverage and insolvency risk assessment based on Borrowings/Reserves."},
      {"name": "Sales CAGR (3Y)", "value": "latest 3Y CAGR", "benchmark": "5Y and 10Y CAGRs", "interpretation": "Is the company's growth accelerating, stable, or in decline?"},
      {"name": "FCF/PAT %", "value": "FCF/Net Profit %", "benchmark": ">80% is high quality", "interpretation": "Earnings-to-cash conversion quality. Are profits backed by actual free cash?"}
    ],
    "quarterly_highlights": "Analyze the latest quarter (Mar 2026 or latest). Compare Sales, OPM%, and Net Profit YoY and QoQ (using the quarterly results table). Highlight any sequential recovery or pressure."
  },
  "bull_bear_analysis": {
    "bull_case": [
      {"point": "Specific, non-generic title (e.g. Negative Cash Conversion Cycle)", "evidence": "Quantifiable metrics from data (e.g. WC Days of -116 and CCC of -29 days in FY26)", "strength": "strong|moderate|speculative"},
      {"point": "Growth Catalyst Title", "evidence": "Support with exact capex project cost/guidance or segment CAGR", "strength": "strong|moderate|speculative"},
      {"point": "Moat Title", "evidence": "ROCE/margin stability numbers as proof of competitive insulation", "strength": "strong|moderate|speculative"},
      {"point": "Capital Structure Title", "evidence": "Favorable leverage or cash conversion metrics", "strength": "strong|moderate|speculative"}
    ],
    "bear_case": [
      {"point": "Specific Value Destruction Mechanism (e.g. Rising Capex without FCF)", "evidence": "Metrics like CWIP rising to ₹1,37,569 Cr while OPM drops to 8% in Mar 2026", "severity": "high|medium|low"},
      {"point": "Margin Vulnerability", "evidence": "Specific input cost inflation or pricing power loss evidence", "severity": "high|medium|low"},
      {"point": "Debt Serviceability Risk", "evidence": "Interest expense/borrowings trend vs OCF trend", "severity": "high|medium|low"},
      {"point": "Segment Concentration Risk", "evidence": "Evidence showing reliance on a single segment that is facing headwinds", "severity": "high|medium|low"}
    ],
    "verdict": "A concise 3-sentence summary: Stance on the stock (bullish/bearish/neutral), the single most critical swing factor, and what specific metric threshold would change this stance."
  },
  "business_quality_score": {
    "revenue_visibility": 8,
    "management_quality": 7,
    "competitive_moat": 8,
    "balance_sheet_strength": 9,
    "earnings_quality": 8,
    "esg_practices": 7,
    "overall_score": 8,
    "score_rationale": "A highly specific 3-4 sentence justification for the overall score, quoting at least 3 distinct numbers/ratios from the tables (e.g. FCF/PAT conversion, 10Y Sales CAGR, or latest Debt/Equity ratio)."
  },
  "risk_matrix": {
    "risks": [
      {"name": "Company-specific risk 1", "category": "Financial|Operational|Regulatory|Macro|Execution|Governance", "probability": "high|medium|low", "impact": "high|medium|low", "mitigation": "Specific company action from annual report data."},
      {"name": "Company-specific risk 2", "category": "...", "probability": "...", "impact": "...", "mitigation": "..."},
      {"name": "Company-specific risk 3", "category": "...", "probability": "...", "impact": "...", "mitigation": "..."},
      {"name": "Company-specific risk 4", "category": "...", "probability": "...", "impact": "...", "mitigation": "..."},
      {"name": "Company-specific risk 5", "category": "...", "probability": "...", "impact": "...", "mitigation": "..."}
    ],
    "overall_risk_level": "high|medium|low"
  },
  "strategic_outlook": {
    "management_guidance": "Management's targets and outlook from the guidance block, citing specific vertical expansions and retail growth ambitions.",
    "capex_plans": "Detailed review of capex plans, referencing the greenfield/brownfield projects (e.g. ₹1,44,271 Cr planned across O2C, New Energy, Digital Services, and Retail) and comparing it with the CWIP trend.",
    "growth_catalysts": [
      "Catalyst 1: Specific growth project or segment expansion with mechanism and timeline.",
      "Catalyst 2: Market tailwind/regulation adoption.",
      "Catalyst 3: Operational efficiency/cost optimization driver.",
      "Catalyst 4: Moat-strengthening initiatives."
    ],
    "near_term_monitorables": [
      "Monitor [specific metric] in [timeframe] — thesis is impaired if [threshold breached].",
      "Monitor item 2",
      "Monitor item 3"
    ],
    "long_term_vision": "Stated 3-5 year corporate vision, digital leadership goals, or sustainability targets (e.g. net-zero by 2035) from the CEO message/annual report."
  },
  "industry_context": {
    "sector": "Sector from business description",
    "market_position": "market leader|strong challenger|niche player|commodity player",
    "peer_comparison": "<vs peer data if available — name peers and specific metrics; if no peer data, state sector position qualitatively>",
    "industry_tailwinds": ["<tailwind 1 with specifics>","<tailwind 2 with specifics>","<tailwind 3>"],
    "industry_headwinds": ["<headwind 1 with specifics>","<headwind 2 with specifics>"],
    "competitive_landscape": "<2-3 sentence analysis of competitive dynamics, barriers to entry, pricing environment>"
  },
  "esg_summary": {
    "environmental": "<specific initiative from data>",
    "social": "<workforce/community initiative from data>",
    "governance": "<promoter holding trend, audit opinion, board quality signals>",
    "csr_initiatives": "<CSR spend ₹X Cr on [programs] from data>",
    "esg_rating_notes": "<any certifications, goals, or ESG milestones from annual report>"
  },
  "key_monitorables": [
    "<#1 most critical: Watch [specific metric] in [specific timeframe] — thesis impaired if [specific threshold]>",
    "<#2: Watch [metric] — [threshold and implication]>",
    "<#3: Watch [metric] — [threshold and implication]>",
    "<#4: Watch [metric] — [threshold and implication]>"
  ],
  "disclaimer": "This AI-generated report is for investment bank analyst usage and sophisticated investment decision support. Past performance is not indicative of future results."
}`;

  parts.push(instruction);
  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI CALL
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiForReport(prompt: string): Promise<{ parsed: any; raw: string }> {
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    let attempts = 0;
    const maxAttempts = model === PRIMARY_MODEL ? 3 : 1;

    while (attempts < maxAttempts) {
      try {
        console.log(`[AIReport] Calling Gemini model: ${model} (attempt ${attempts + 1}/${maxAttempts}) | prompt: ${prompt.length.toLocaleString()} chars`);
        
        // Route through the global rate-limiter queue
        const response = await geminiQueue((genAI) => {
          const client = genAI.getGenerativeModel({
            model,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
            systemInstruction: 'You are a senior equity research analyst. Translate the complex financial data into clean, objective, structured business insights. Output ONLY a single valid JSON object matching the requested schema. No conversational text.',
          });
          return client.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
        });


        const rawContent = response.response.text();
        console.log(`[AIReport] response: ${rawContent.length} chars`);

        // Strip markdown fences if model added them (just in case)
        const cleaned = rawContent
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        try {
          const parsed = JSON.parse(cleaned);
          console.log(`[AIReport] ✓ Parsed response from ${model}`);
          return { parsed, raw: cleaned };
        } catch (parseErr: any) {
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log(`[AIReport] ✓ Extracted JSON from partial response (${model})`);
              return { parsed, raw: jsonMatch[0] };
            } catch (_) { /* fall through */ }
          }
          console.warn(`[AIReport] ✗ JSON parse failed (${model}): ${parseErr.message}`);
          break; // syntax error, don't retry same model
        }
      } catch (err: any) {
        attempts++;
        console.error(`[AIReport] ✗ Gemini API error (${model}) (attempt ${attempts}/${maxAttempts}): msg=${err.message}`);
        if (err.status === 429) {
          const waitTime = 15000 * attempts;
          console.warn(`[AIReport] Rate limited on ${model}, waiting ${waitTime / 1000}s...`);
          await delay(waitTime);
          if (attempts < maxAttempts) {
            continue; // Retry same model
          }
        }
        break; // Other error, don't retry same model
      }
    }
  }
  throw new Error('All Gemini models failed — check logs above for root cause');
}

// Helper function to recursively clean garbled symbols from Groq JSON outputs
function cleanResponseData(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/Ôé╣/g, '₹')
      .replace(/âé╣/g, '₹')
      .replace(/ÔÇó/g, '•')
      .replace(/âÇó/g, '•')
      .replace(/ÔöÇ/g, '─')
      .replace(/âöÇ/g, '─')
      .replace(/â\u0080\u0094/g, '—')
      .replace(/â\u0080\u0093/g, '–')
      .replace(/â\u0080\u0099/g, "'")
      .replace(/â\u0080\u009c/g, '"')
      .replace(/â\u0080\u009d/g, '"')
      .replace(/â\u0080\u00a2/g, '•')
      .replace(/â\u0082\u00b9/g, '₹');
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanResponseData(item));
  }
  if (data !== null && typeof data === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanResponseData(data[key]);
    }
    return cleaned;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateReportResult {
  success: boolean;
  ticker: string;
  companyName: string;
  reportId?: string;
  error?: string;
  cached?: boolean;
  promptChars?: number;
}

export async function generateAndStoreAIReport(
  ticker: string,
  forceRegenerate = false
): Promise<GenerateReportResult> {
  const symbol = ticker.toUpperCase().trim();
  console.log(`\n[AIReport] ══ Generating for: ${symbol} ══`);

  // ── Cache check (72h TTL) ────────────────────────────────────────────────
  if (!forceRegenerate) {
    const existing = (await CompanyAIReport.findOne({ ticker: symbol }).lean()) as any;
    if (existing && existing.executive_summary) {
      const ageHours = (Date.now() - new Date(existing.generated_at).getTime()) / 3_600_000;
      if (ageHours < 72) {
        console.log(`[AIReport] ✓ Cache hit (${ageHours.toFixed(1)}h old)`);
        return {
          success: true,
          ticker: symbol,
          companyName: existing.company_name,
          reportId: existing._id?.toString(),
          cached: true,
        };
      }
    }
  }

  // ── Gather data ──────────────────────────────────────────────────────────
  const rawBundle = await gatherCompanyData(symbol);
  const bundle = cleanResponseData(rawBundle);

  if (!bundle.stock && bundle.annualReports.length === 0) {
    const err = `No data in MongoDB for ${symbol}. Run /admin/scrape and /admin/annual-report/scrape first.`;
    await CompanyAIReport.findOneAndUpdate(
      { ticker: symbol },
      {
        ticker: symbol, company_name: symbol, generated_at: new Date(),
        data_sources: { stock_data_available: false, annual_reports_count: 0, fiscal_years_covered: [] },
        generation_error: err,
        disclaimer: 'Report generation failed — no data.',
      },
      { upsert: true, new: true }
    );
    return { success: false, ticker: symbol, companyName: symbol, error: err };
  }

  console.log(`[AIReport] Data: stock=${!!bundle.stock}, annualReports=${bundle.annualReports.length}`);

  // ── Build optimised prompt ───────────────────────────────────────────────
  const prompt = buildAnalysisPrompt(bundle);
  console.log(`[AIReport] Prompt size: ${prompt.length.toLocaleString()} chars`);

  // ── Call Gemini ───────────────────────────────────────────────────────────
  let parsed: any, rawResponse: string;
  try {
    ({ parsed, raw: rawResponse } = await callGeminiForReport(prompt));
    parsed = cleanResponseData(parsed);
  } catch (err: any) {
    await CompanyAIReport.findOneAndUpdate(
      { ticker: symbol },
      {
        ticker: symbol, company_name: bundle.companyName, generated_at: new Date(),
        data_sources: {
          stock_data_available: !!bundle.stock,
          annual_reports_count: bundle.annualReports.length,
          fiscal_years_covered: bundle.annualReports.map((r: any) => r.fiscal_year).filter(Boolean),
          stock_last_updated: (bundle.stock as any)?.lastUpdated,
        },
        generation_error: err.message,
        disclaimer: 'Report generation failed. Retry with force=true.',
      },
      { upsert: true, new: true }
    );
    return { success: false, ticker: symbol, companyName: bundle.companyName, error: err.message };
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const saved = await CompanyAIReport.findOneAndUpdate(
    { ticker: symbol },
    {
      $set: {
        ticker: symbol,
        company_name: bundle.companyName,
        generated_at: new Date(),
        data_sources: {
          stock_data_available: !!bundle.stock,
          annual_reports_count: bundle.annualReports.length,
          fiscal_years_covered: bundle.annualReports.map((r: any) => r.fiscal_year).filter(Boolean),
          stock_last_updated: (bundle.stock as any)?.lastUpdated,
        },
        executive_summary: parsed.executive_summary,
        financial_snapshot: parsed.financial_snapshot,
        bull_bear_analysis: parsed.bull_bear_analysis,
        business_quality_score: parsed.business_quality_score,
        risk_matrix: parsed.risk_matrix,
        strategic_outlook: parsed.strategic_outlook,
        industry_context: parsed.industry_context,
        esg_summary: parsed.esg_summary,
        key_monitorables: parsed.key_monitorables,
        disclaimer: parsed.disclaimer,
        raw_groq_response: rawResponse,
      },
      // Explicitly unset stale error from any previous failed attempt
      $unset: { generation_error: "" },
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log(`[AIReport] ✓ Stored. ID: ${saved._id}`);
  return {
    success: true,
    ticker: symbol,
    companyName: bundle.companyName,
    reportId: saved._id?.toString(),
    promptChars: prompt.length,
  };
}
