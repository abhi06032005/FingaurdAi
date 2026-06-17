import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import SnapshotBar from '../../../components/analysis/SnapshotBar';
import PriceChart from '../../../components/analysis/PriceChart';
import PriceBehaviourEngine from '../../../components/analysis/PriceBehaviourEngine';
import VolumeBehaviourEngine from '../../../components/analysis/VolumeBehaviourEngine';
import MarketStructureEngine from '../../../components/analysis/MarketStructureEngine';
import HistoricalAnalogEngine from '../../../components/analysis/HistoricalAnalogEngine';
import WhatChangedPanel from '../../../components/analysis/WhatChangedPanel';
import MarketDNARadar from '../../../components/analysis/MarketDNARadar';
import ConfidenceEngine from '../../../components/analysis/ConfidenceEngine';
import AiNarrativeSummary from '../../../components/analysis/AiNarrativeSummary';
import RelativeStrengthPanel from '../../../components/analysis/RelativeStrengthPanel';

interface PageProps {
  params: Promise<{ ticker: string }>;
}

// Lookup a basic company name from ticker
const TICKER_NAMES: Record<string, string> = {
  'RELIANCE': 'Reliance Industries',
  'TCS': 'Tata Consultancy Services',
  'HDFCBANK': 'HDFC Bank',
  'ICICIBANK': 'ICICI Bank',
  'INFY': 'Infosys',
  'HINDUNILVR': 'Hindustan Unilever',
  'ITC': 'ITC Limited',
  'SBIN': 'State Bank of India',
  'BHARTIARTL': 'Bharti Airtel',
  'KOTAKBANK': 'Kotak Mahindra Bank',
  'LT': 'Larsen & Toubro',
  'AXISBANK': 'Axis Bank',
  'ASIANPAINT': 'Asian Paints',
  'HCLTECH': 'HCL Technologies',
  'WIPRO': 'Wipro',
  'MARUTI': 'Maruti Suzuki',
  'BAJFINANCE': 'Bajaj Finance',
  'TITAN': 'Titan Company',
  'SUNPHARMA': 'Sun Pharma',
  'ULTRACEMCO': 'UltraTech Cement',
  'NESTLEIND': 'Nestle India',
  'POWERGRID': 'Power Grid Corp',
  'NTPC': 'NTPC Limited',
  'COALINDIA': 'Coal India',
  'TECHM': 'Tech Mahindra',
  'DIVISLAB': "Divi's Laboratories",
  'CIPLA': 'Cipla',
  'DRREDDY': "Dr. Reddy's",
  'EICHERMOT': 'Eicher Motors',
  'BAJAJFINSV': 'Bajaj Finserv',
  'INDUSINDBK': 'IndusInd Bank',
  'TATACONSUM': 'Tata Consumer',
  'GRASIM': 'Grasim Industries',
  'BPCL': 'BPCL',
  'TATAMOTORS': 'Tata Motors',
  'ONGC': 'ONGC',
  'ADANIPORTS': 'Adani Ports',
  'HEROMOTOCO': 'Hero MotoCorp',
  'BRITANNIA': 'Britannia Industries',
  'JSWSTEEL': 'JSW Steel',
  'TATASTEEL': 'Tata Steel',
  'M&M': 'Mahindra & Mahindra',
  'APOLLOHOSP': 'Apollo Hospitals',
  'BAJAJ-AUTO': 'Bajaj Auto',
  'HINDALCO': 'Hindalco',
  'SBILIFE': 'SBI Life Insurance',
  'HDFCLIFE': 'HDFC Life Insurance',
  'UPL': 'UPL',
};

export default async function Page({ params }: PageProps) {
  const { ticker } = await params;
  const decodedTicker = decodeURIComponent(ticker).toUpperCase();
  const cleanTicker = decodedTicker.replace('.NS', '');

  let data: any = null;
  let errorMsg = '';

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/${decodedTicker}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      data = await res.json();
    } else {
      const errorJson = await res.json().catch(() => ({}));
      errorMsg = errorJson.error || `Failed to fetch analysis: ${res.statusText}`;
    }
  } catch (err: any) {
    errorMsg = err.message || 'Could not connect to the analysis engine service.';
  }

  // Error state
  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#8B949E] flex flex-col justify-center items-center font-sans px-4">
        <div className="max-w-md w-full bg-[#161B22] border border-[#21262D] p-6 text-center">
          <AlertCircle size={28} className="text-[#F59E0B] mx-auto mb-3" />
          <h2 className="text-white text-base font-bold uppercase tracking-wider mb-2">
            Analysis Unavailable
          </h2>
          <p className="text-xs text-[#8B949E] leading-relaxed mb-6">
            {errorMsg || `Could not fetch analysis data for "${decodedTicker}". Please check if this is a NIFTY 50 stock and the backend is running.`}
          </p>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#21262D] text-white border border-[#30363D] hover:bg-[#30363D] text-xs font-mono font-bold tracking-widest uppercase transition-all duration-150"
          >
            <ArrowLeft size={12} /> All Stocks
          </Link>
        </div>
      </div>
    );
  }

  // Computed props
  const companyName = TICKER_NAMES[cleanTicker] || '';
  const currentRegime = data.regimeDetection?.currentRegime || 'Balanced';
  const latestClose = data.priceSnapshot?.close || 0;

  // Rough daily change — use relative strength 5d returns as a proxy if no explicit open-to-close change is available
  // The API doesn't expose today's open directly so we show 0 gracefully
  const priceChange = 0;
  const priceChangePct = 0;

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#8B949E] font-sans">
      {/* ══════════════════════════════════════════════
          SECTION 1 — Snapshot Bar
          ══════════════════════════════════════════════ */}
      <SnapshotBar
        ticker={data.ticker}
        companyName={companyName}
        asOf={data.asOf}
        dataWindowDays={data.dataWindowDays}
        close={latestClose}
        priceChange={priceChange}
        priceChangePct={priceChangePct}
        percentileRank={data.priceSnapshot?.percentileRank || 50}
        zScore={data.priceSnapshot?.zScore || 0}
        currentRegime={currentRegime}
        confidenceScore={data.confidenceScore || { score: 50 }}
      />

      {/* ══════════════════════════════════════════════
          Main Content
          ══════════════════════════════════════════════ */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-8 space-y-6 pb-24">

        {/* ─── SECTION 0 — Price Chart (full width) ─── */}
        <div>
          <div className="border-l-2 border-[#21262D] pl-3 py-0.5 mb-4">
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1">Interactive Chart</p>
            <h2 className="text-base font-bold text-white">Price & Volume History</h2>
          </div>
          <PriceChart symbol={data.ticker} />
        </div>

        {/* ─── SECTIONS 6 + 2 — What Changed + Price Behaviour (side by side) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <WhatChangedPanel dailyDelta={data.dailyDelta} />
          </div>
          <div className="lg:col-span-2">
            <PriceBehaviourEngine
              priceBehaviour={data.priceBehaviour}
              classicIndicators={data.classicIndicators}
              quantModels={data.quantModels}
              priceSnapshot={data.priceSnapshot}
              modelAgreement={data.modelAgreement}
            />
          </div>
        </div>

        {/* ─── SECTION 3 — Volume Behaviour (full width) ─── */}
        <VolumeBehaviourEngine
          volumeBehaviour={data.volumeBehaviour}
          quantModels={data.quantModels}
          classicIndicators={data.classicIndicators}
          currentPrice={latestClose}
        />

        {/* ─── SECTION 4 — Market Structure (full width) ─── */}
        <MarketStructureEngine regimeDetection={data.regimeDetection} />

        {/* ─── SECTIONS 5 + 6b — Historical Analogs + Relative Strength ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HistoricalAnalogEngine analogs={data.historicalAnalogs} />
          </div>
          <div>
            <RelativeStrengthPanel
              relativeStrength={data.relativeStrength}
              ticker={data.ticker}
            />
          </div>
        </div>

        {/* ─── SECTION 7 — Market DNA Radar (full width) ─── */}
        <MarketDNARadar marketDNA={data.marketDNA} ticker={data.ticker} />

        {/* ─── SECTION 8 — Confidence Engine (full width) ─── */}
        <ConfidenceEngine
          confidenceScore={data.confidenceScore}
          modelAgreement={data.modelAgreement}
          modelReliability={data.modelReliability}
        />

        {/* ─── SECTION 9 — AI Narrative Summary (full width) ─── */}
        <AiNarrativeSummary
          aiSummary={data.aiSummary}
          ticker={data.ticker}
          confidenceScore={data.confidenceScore?.score || 50}
          currentRegime={currentRegime}
        />

        {/* Platform Disclaimer Footer */}
        <div className="border border-[#21262D] bg-[#0D1117] px-6 py-4">
          <p className="text-xs text-[#8B949E] leading-relaxed text-center">
            <strong className="text-white">Educational Platform Disclaimer:</strong> All analytical content on FinGuard AI is generated for educational and informational purposes only.
            Nothing on this platform constitutes financial advice, investment recommendations, or solicitation to buy or sell any security.
            Technical indicators describe historical price behaviour and do not predict future performance. Always consult a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </main>
    </div>
  );
}
