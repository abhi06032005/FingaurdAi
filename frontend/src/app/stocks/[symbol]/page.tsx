import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getStockName } from '../../../../../backend/src/services/dataIngestion/nifty50Symbols';
import TechnicalStrengthGauge from '../../../components/dashboard/TechnicalStrengthGauge';
import ScoreHistorySparkline from '../../../components/dashboard/ScoreHistorySparkline';
import OverviewCards from '../../../components/dashboard/OverviewCards';
import IndicatorTable from '../../../components/dashboard/IndicatorTable';
import DivergenceAlert from '../../../components/dashboard/DivergenceAlert';
import PriceChart from '../../../components/chart/PriceChart';
import EducationalSummaryCard from '../../../components/ai/EducationalSummaryCard';
import ErrorFallback from '../../../components/ui/ErrorFallback';
import DisclaimerBanner from '../../../components/ui/DisclaimerBanner';
import { TechnicalAnalysisResponseType } from '../../../types/analysis.types';

interface PageProps {
  params: {
    symbol: string;
  };
}

async function getAnalysisData(symbol: string): Promise<TechnicalAnalysisResponseType | null> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
  
  try {
    const res = await fetch(`${API_BASE_URL}/stocks/${symbol}/technical-analysis`, {
      cache: 'no-store', // Avoid Next.js caching raw API response
    });
    
    if (!res.ok) return null;
    return await res.json() as TechnicalAnalysisResponseType;
  } catch (error) {
    console.error('Server-side analysis fetch failed:', error);
    return null;
  }
}

export default async function StockAnalysisPage({ params }: PageProps) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase();
  const analysis = await getAnalysisData(symbol);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4">
        <ErrorFallback />
        <DisclaimerBanner />
      </div>
    );
  }

  const priceColor = analysis.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const priceSign = analysis.priceChangePct >= 0 ? '+' : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <Link 
              href="/stocks"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition duration-150 active:scale-95"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{analysis.symbol}</h1>
                <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 font-mono select-none">
                  NIFTY 50
                </span>
              </div>
              <p className="text-sm text-slate-400">{analysis.companyName}</p>
            </div>
          </div>

          {/* Pricing Quote info */}
          <div className="flex flex-col md:items-end">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              ₹{analysis.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-semibold font-mono ${priceColor}`}>
              {priceSign}{analysis.priceChange.toFixed(2)} ({priceSign}{analysis.priceChangePct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Divergences alert row */}
        {analysis.divergences.length > 0 && (
          <DivergenceAlert divergences={analysis.divergences} />
        )}

        {/* Overview cards: 4 columns */}
        <OverviewCards analysis={analysis} />

        {/* Grid: 3 columns (Gauge + Sparkline, TV chart, AI analysis) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Gauge & Sparkline */}
          <div className="flex flex-col gap-6">
            <TechnicalStrengthGauge 
              score={analysis.technicalScore}
              rating={analysis.technicalRating}
              confluence={analysis.confluenceScore}
            />
            <ScoreHistorySparkline history={analysis.scoreHistory} />
          </div>

          {/* Column 2 & 3: Interactive TradingView Chart */}
          <div className="lg:col-span-2">
            <PriceChart symbol={analysis.symbol} />
          </div>
        </div>

        {/* Grid: Indicators list + AI reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IndicatorTable analysis={analysis} />
          </div>
          <div>
            <EducationalSummaryCard 
              summary={analysis.aiSummary}
              generatedAt={analysis.aiGeneratedAt}
            />
          </div>
        </div>

      </div>

      {/* Persistent disclaimer footer */}
      <DisclaimerBanner />
    </div>
  );
}
