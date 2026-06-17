"use client";

import React from 'react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface ConfidenceScoreData {
  score: number;
  factors: {
    agreement: number;
    stability: number;
    sufficiency: number;
    volatility: number;
    reliability: number;
  };
}

interface ModelAgreement {
  overallAgreement: number;
  groups: Array<{
    name: string;
    score: number;
    state: string;
    direction: string;
    summary: string;
  }>;
  narrative: string;
}

interface ModelReliability {
  model: string;
  score: number;
  label: string;
  note: string;
}

interface ConfidenceEngineProps {
  confidenceScore: ConfidenceScoreData;
  modelAgreement: ModelAgreement;
  modelReliability: ModelReliability[];
}

const FACTOR_INFO: Record<string, { label: string; weight: string; what: string }> = {
  agreement: { label: 'Model Agreement', weight: '30%', what: 'How consistently trend, momentum, volume, and volatility models align.' },
  stability: { label: 'Regime Stability', weight: '20%', what: 'How long the current market regime has been in effect (more days = more stable).' },
  sufficiency: { label: 'Data Sufficiency', weight: '20%', what: 'How many trading days of data are available relative to 252 (one full year).' },
  volatility: { label: 'Volatility Consistency', weight: '15%', what: 'Penalty for high volatility, which makes all signals noisier.' },
  reliability: { label: 'Model Reliability', weight: '15%', what: 'Weighted average reliability of the top 10 analytical models used today.' }
};

const GROUP_COLORS: Record<string, string> = {
  Trend: '#6366F1',
  Momentum: '#10B981',
  Volume: '#F59E0B',
  Volatility: '#8B949E'
};

function ConfidenceArc({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = (clampedScore / 100) * 180 - 90;

  let mainColor = '#EF4444';
  let label = 'Low — Signals diverging';
  if (score >= 70) { mainColor = '#10B981'; label = 'High — Models broadly aligned'; }
  else if (score >= 50) { mainColor = '#6366F1'; label = 'Moderate — Partial alignment'; }
  else if (score >= 35) { mainColor = '#F59E0B'; label = 'Fair — Some disagreement'; }

  // Dash array for 180-degree arc (radius 60, circumference = 2πr = ~376.99; half = 188.5)
  const arcLen = 188.5;
  const filled = (clampedScore / 100) * arcLen;

  return (
    <div className="flex flex-col items-center space-y-3">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background zone arcs */}
        <path d="M 15 95 A 85 85 0 0 1 60 23" fill="none" stroke="#EF4444" strokeWidth="8" strokeLinecap="butt" opacity="0.2" />
        <path d="M 60 23 A 85 85 0 0 1 100 10" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="butt" opacity="0.2" />
        <path d="M 100 10 A 85 85 0 0 1 140 23" fill="none" stroke="#6366F1" strokeWidth="8" strokeLinecap="butt" opacity="0.2" />
        <path d="M 140 23 A 85 85 0 0 1 185 95" fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="butt" opacity="0.2" />

        {/* Background arc */}
        <path d="M 15 95 A 85 85 0 0 1 185 95" fill="none" stroke="#21262D" strokeWidth="8" strokeLinecap="round" />

        {/* Score arc */}
        <path
          d="M 15 95 A 85 85 0 0 1 185 95"
          fill="none"
          stroke={mainColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLen}`}
          style={{ transition: 'stroke-dasharray 0.8s ease-out, stroke 0.3s' }}
        />

        {/* Score text */}
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="monospace">
          {clampedScore}
        </text>
        <text x="100" y="103" textAnchor="middle" fill="#8B949E" fontSize="11" fontFamily="system-ui">
          out of 100
        </text>

        {/* Needle */}
        <circle cx="100" cy="95" r="5" fill="white" />
        <line
          x1="100" y1="95" x2="100" y2="18"
          stroke="white" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${angle} 100 95)`}
          style={{ transition: 'transform 0.7s ease-out' }}
        />

        {/* Scale labels */}
        <text x="12" y="108" textAnchor="middle" fill="#EF4444" fontSize="9" fontFamily="monospace" fontWeight="700">0</text>
        <text x="100" y="8" textAnchor="middle" fill="#8B949E" fontSize="9" fontFamily="monospace" fontWeight="700">50</text>
        <text x="188" y="108" textAnchor="middle" fill="#10B981" fontSize="9" fontFamily="monospace" fontWeight="700">100</text>
      </svg>
      <p className="text-sm font-bold" style={{ color: mainColor }}>{label}</p>
    </div>
  );
}

export default function ConfidenceEngine({ confidenceScore, modelAgreement, modelReliability }: ConfidenceEngineProps) {
  const topReliable = modelReliability?.slice(0, 6) || [];

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 8 — Confidence Engine"
        question="How reliable is today's analysis?"
        accent="indigo"
        tooltipTitle="Confidence Score"
        tooltipWhat="Measures how consistently the analytical models agree with each other today."
        tooltipWhy="When indicators disagree, signals are less reliable. A high score means independent methods are pointing in the same direction."
        tooltipHow="Weighted from 5 factors: model agreement (30%), regime stability (20%), data sufficiency (20%), volatility consistency (15%), model reliability (15%)."
        tooltipLimitation="High confidence does NOT mean the stock will perform well. It only means the analytical signals are internally consistent."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Arc Gauge */}
        <div className="space-y-4">
          <ConfidenceArc score={confidenceScore.score} />

          {/* Important disclaimer */}
          <div className="bg-[#0D1117] border border-[#21262D] px-3 py-2">
            <p className="text-xs text-[#8B949E] leading-relaxed">
              This score measures consistency of analytical models — not a prediction of stock performance.
            </p>
          </div>
        </div>

        {/* Middle: Factor Breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Score Breakdown</p>
          {Object.entries(confidenceScore.factors).map(([key, value]) => {
            const info = FACTOR_INFO[key];
            if (!info) return null;
            const clampedVal = Math.max(0, Math.min(100, value));
            let barColor = '#EF4444';
            if (clampedVal >= 70) barColor = '#10B981';
            else if (clampedVal >= 50) barColor = '#6366F1';
            else if (clampedVal >= 35) barColor = '#F59E0B';

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{info.label}</span>
                    <InfoTooltip
                      title={info.label}
                      what={info.what}
                      why="Each factor contributes to the overall confidence score independently."
                      how={`Weighted at ${info.weight} of total score.`}
                      currentContext={`${clampedVal.toFixed(0)} / 100`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#8B949E] font-medium">{info.weight}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: barColor }}>{clampedVal.toFixed(0)}</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-[#21262D]">
                  <div className="h-full transition-all duration-700" style={{ width: `${clampedVal}%`, backgroundColor: barColor }} />
                </div>
              </div>
            );
          })}

          {/* Model agreement groups */}
          {modelAgreement && (
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Category Agreement</p>
              {modelAgreement.groups.map((group) => {
                const color = GROUP_COLORS[group.name] || '#8B949E';
                return (
                  <div key={group.name} className="flex items-center justify-between">
                    <span className="text-xs text-white font-bold">{group.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 bg-[#21262D]">
                        <div className="h-full" style={{ width: `${group.score}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-mono font-semibold" style={{ color }}>{group.score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Model Reliability Rankings */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Model Reliability Rankings</p>
          <div className="space-y-2">
            {topReliable.map((item) => {
              let labelColor = '#EF4444';
              if (item.label === 'High') labelColor = '#10B981';
              else if (item.label === 'Moderate') labelColor = '#6366F1';

              return (
                <div key={item.model} className="group bg-[#0D1117] border border-[#21262D] px-3 py-2 hover:border-[#30363D] transition-colors duration-150">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate pr-2">{item.model}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5" style={{ color: labelColor, borderColor: labelColor, border: '1px solid', borderRadius: 0 }}>
                        {item.label}
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: labelColor }}>{item.score}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8B949E] leading-normal font-medium">{item.note}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#8B949E]/70 italic mt-2 leading-relaxed">
            Reliability reflects data quality and statistical stability — not predictive accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
