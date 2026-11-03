import React from 'react';
import { AnalysisSummary } from '../types';
import { TrendingUp, TrendingDown, Target, AlertTriangle, ShieldCheck, Zap, Compass } from 'lucide-react';

interface AnalysisProps {
  summary: AnalysisSummary | null;
  isLoading: boolean;
}

export const AnalysisPanel: React.FC<AnalysisProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-slate-400 bg-[#0f1422] border border-[#1e2638] rounded-lg">
        <Compass className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <span>Evaluating Market Structure & Smart Money Zones...</span>
      </div>
    );
  }

  const isBullish = summary.trend_classification.includes('BULLISH');
  const isBearish = summary.trend_classification.includes('BEARISH');

  return (
    <div className="flex flex-col h-full bg-[#0f1422] border border-[#1e2638] rounded-lg overflow-y-auto p-3 text-xs space-y-3.5">
      {/* Trend Classification Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e2638]">
        <div>
          <span className="text-[10px] text-slate-400 font-medium">MARKET REGIME ({summary.timeframe.toUpperCase()})</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            {isBullish ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
            <span className={`font-bold text-sm ${isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'}`}>
              {summary.trend_classification.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-medium">RSI (14)</span>
          <div className="font-mono font-bold text-white text-sm">
            {summary.rsi_14.toFixed(1)}
            <span className={`text-[10px] ml-1 font-semibold ${
              summary.rsi_14 > 70 ? 'text-rose-400' : summary.rsi_14 < 30 ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {summary.rsi_14 > 70 ? '(Overbought)' : summary.rsi_14 < 30 ? '(Oversold)' : '(Neutral)'}
            </span>
          </div>
        </div>
      </div>

      {/* Setup Status Banner */}
      <div className="p-2.5 rounded bg-blue-950/30 border border-blue-800/40 text-blue-200">
        <div className="flex items-center space-x-1.5 font-semibold text-[11px] mb-1 text-blue-400">
          <Zap className="w-3.5 h-3.5" />
          <span>Active Setup Observation</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300">{summary.setup_status}</p>
      </div>

      {/* Key Levels & Central Pivot Range (CPR) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between font-bold text-slate-200 text-[11px]">
          <span>Central Pivot Range (CPR) & Key Levels</span>
          <span className="text-[10px] font-mono text-purple-400">
            Width: {summary.cpr?.cpr_width_pct || 0}% ({summary.cpr?.cpr_width_pct < 0.25 ? 'Trending Expected' : 'Range Expected'})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-[11px]">
          <div className="p-1.5 rounded bg-[#131b2c] border border-[#202b42]">
            <div className="text-[10px] text-slate-400">Key Support (S1)</div>
            <div className="font-bold text-emerald-400">₹{summary.key_support.toFixed(2)}</div>
          </div>
          <div className="p-1.5 rounded bg-[#131b2c] border border-[#202b42]">
            <div className="text-[10px] text-slate-400">Key Resistance (R1)</div>
            <div className="font-bold text-rose-400">₹{summary.key_resistance.toFixed(2)}</div>
          </div>
          <div className="p-1.5 rounded bg-[#131b2c] border border-[#202b42]">
            <div className="text-[10px] text-slate-400">Central Pivot (P)</div>
            <div className="font-bold text-purple-400">₹{summary.cpr?.pivot.toFixed(2)}</div>
          </div>
          <div className="p-1.5 rounded bg-[#131b2c] border border-[#202b42]">
            <div className="text-[10px] text-slate-400">Supertrend Bias</div>
            <div className={`font-bold ${summary.supertrend_bias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.supertrend_bias}
            </div>
          </div>
        </div>
      </div>

      {/* Detected Candlestick Patterns */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 font-bold text-slate-200 text-[11px]">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>Candlestick Formations ({summary.detected_patterns.length})</span>
        </div>

        {summary.detected_patterns.length === 0 ? (
          <div className="p-2 text-slate-500 italic bg-[#121827] rounded text-center">
            No high-conviction candlestick reversal patterns in recent candles.
          </div>
        ) : (
          <div className="space-y-2">
            {summary.detected_patterns.map((pat, idx) => (
              <div key={idx} className="p-2 rounded bg-[#121827] border border-[#1e2638] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{pat.pattern_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    pat.direction === 'BULLISH' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {pat.direction}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">{pat.description}</p>
                <div className="pt-1 text-[10px] space-y-0.5 border-t border-[#1c2438]">
                  <div className="text-emerald-300/90 font-medium">
                    <span className="text-slate-500">Confirm: </span>{pat.confirmation_rules}
                  </div>
                  <div className="text-rose-300/90 font-medium">
                    <span className="text-slate-500">Invalidate: </span>{pat.invalidation_rules}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Money Concepts (FVGs & Order Blocks) */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 font-bold text-slate-200 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Smart Money Zones (SMC)</span>
        </div>

        <div className="space-y-1.5">
          {summary.unmitigated_fvgs.map((fvg, idx) => (
            <div key={idx} className="p-2 rounded bg-[#121827] border border-[#1e2638] flex items-center justify-between">
              <div>
                <span className={`font-bold ${fvg.direction === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fvg.direction} FVG
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  ₹{fvg.bottom.toFixed(2)} &ndash; ₹{fvg.top.toFixed(2)}
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                UNMITIGATED
              </span>
            </div>
          ))}

          {summary.active_order_blocks.map((ob, idx) => (
            <div key={idx} className="p-2 rounded bg-[#121827] border border-[#1e2638] flex items-center justify-between">
              <div>
                <span className={`font-bold ${ob.direction === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {ob.direction} Order Block
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  Zone: ₹{ob.bottom.toFixed(2)} &ndash; ₹{ob.top.toFixed(2)}
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
