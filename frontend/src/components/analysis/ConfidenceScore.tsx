import React from 'react';

interface ConfidenceScoreProps {
  confidenceScore: {
    score: number;
    factors: {
      agreement: number;
      stability: number;
      sufficiency: number;
      volatility: number;
    };
  };
}

export default function ConfidenceScore({ confidenceScore }: ConfidenceScoreProps) {
  const { score, factors } = confidenceScore;

  // SVG parameters for radial gauge
  const radius = 45;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine indicator color based on score (premium neutral palette)
  const getGaugeColor = (val: number) => {
    if (val >= 70) return '#6366F1'; // Indigo (Highly aligned / stable)
    if (val >= 40) return '#F59E0B'; // Amber (Moderate confidence)
    return '#8B949E'; // Slate grey (Low confidence)
  };

  const getInterpretation = (val: number) => {
    if (val >= 70) return 'High model convergence. Indicators are highly aligned and regime is highly stable.';
    if (val >= 40) return 'Moderate model convergence. Conflicting indicators suggest cautious position sizing.';
    return 'Low model convergence. Highly noisy backdrop, indicators are conflicting, trade with extreme caution.';
  };

  const gaugeColor = getGaugeColor(score);

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200">
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Confidence Index
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          CONVICTION MODEL
        </span>
      </div>

      {/* Radial Gauge & Factors */}
      <div className="flex-1 flex flex-col gap-4 justify-center">
        <div className="flex items-center gap-6 justify-center my-1 select-none">
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              {/* Background Circle */}
              <circle
                stroke="#21262D"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Foreground Progress Circle */}
              <circle
                stroke={gaugeColor}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold text-white tracking-tighter">
                {score}
              </span>
              <span className="text-[8px] text-[#8B949E] uppercase font-bold tracking-widest">
                SCORE
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 select-none">
            {[
              { label: 'Agreement', val: factors.agreement },
              { label: 'Stability', val: factors.stability },
              { label: 'Sufficiency', val: factors.sufficiency },
              { label: 'Volatility', val: factors.volatility }
            ].map((f, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-white uppercase tracking-wide">{f.label}</span>
                  <span className="font-mono text-[#8B949E]">{f.val.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-[#0D1117] border border-[#21262D] w-full">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, f.val))}%`,
                      backgroundColor: getGaugeColor(f.val)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visible investor education block */}
        <div className="bg-[#0D1117]/60 border border-[#21262D]/60 p-4 space-y-2.5 rounded-sm select-none">
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
            <p className="text-xs text-white leading-relaxed mt-0.5">
              Aggregates indicator agreement, historical regime stability, data sample sufficiency, and volatility levels to check technical consensus.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              {getInterpretation(score)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>MODEL: MULTI-FACTOR SCORER</span>
        <span>SEBI EDUCATIONAL GUIDE</span>
      </div>
    </div>
  );
}
