import React from 'react';
import { MarketOverviewResponse } from '../types';
import { Activity, ShieldCheck, TrendingUp, TrendingDown, Clock, Radio } from 'lucide-react';

interface TopStatusBarProps {
  overview: MarketOverviewResponse | null;
  selectedSymbol: string;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ overview, selectedSymbol }) => {
  const isMarketOpen = overview?.market_status === 'OPEN';
  const adv = overview?.advance_decline?.advances || 0;
  const dec = overview?.advance_decline?.declines || 0;
  const total = adv + dec || 1;
  const advPct = Math.round((adv / total) * 100);

  return (
    <header className="bg-[#0f1422] border-b border-[#1e2638] text-xs select-none">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[#1b2234] gap-2">
        {/* Brand & Market Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
              TIP
            </div>
            <span className="font-bold text-sm tracking-wide text-white">TRADING INTELLIGENCE PRO</span>
          </div>

          <span className="text-slate-500">|</span>

          {/* Market Session Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-opacity-30 bg-[#161f30]">
            <Radio className={`w-3 h-3 ${isMarketOpen ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className={isMarketOpen ? 'text-emerald-400' : 'text-slate-300'}>
              {overview?.exchange || 'NSE'} &bull; {isMarketOpen ? 'LIVE MARKET' : 'MARKET CLOSED (EOD)'}
            </span>
          </div>

          {/* Connection status */}
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Feed: {overview?.feed_health || 'CONNECTED'}</span>
          </div>
        </div>

        {/* Advance / Decline Bar & Timestamp */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Market Breadth:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-emerald-400 font-semibold">{adv} Adv</span>
              <div className="w-16 h-1.5 bg-rose-500/40 rounded-full overflow-hidden flex">
                <div style={{ width: `${advPct}%` }} className="bg-emerald-500 h-full"></div>
              </div>
              <span className="text-rose-400 font-semibold">{dec} Dec</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{overview?.last_updated || 'Updated Just Now'}</span>
          </div>
        </div>
      </div>

      {/* Indices Ticker Strip */}
      <div className="flex items-center space-x-3 px-4 py-1.5 bg-[#0b0e14] overflow-x-auto text-xs no-scrollbar">
        {overview?.indices?.map(idx => {
          const isUp = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              className="flex items-center space-x-2 px-3 py-1 bg-[#121826] border border-[#1d273b] rounded shrink-0 shadow-sm"
            >
              <span className="font-semibold text-slate-200">{idx.name}</span>
              <span className="font-mono font-bold text-white">₹{idx.last_price.toLocaleString()}</span>
              <span className={`flex items-center font-mono text-[11px] font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {isUp ? '+' : ''}{idx.change.toFixed(2)} ({isUp ? '+' : ''}{idx.change_pct.toFixed(2)}%)
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
                {idx.data_status}
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
};
