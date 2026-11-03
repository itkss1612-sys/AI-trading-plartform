import React, { useState } from 'react';
import { InstrumentItem, Quote } from '../types';
import { Search, TrendingUp, TrendingDown, Star, Plus } from 'lucide-react';

interface WatchlistProps {
  instruments: InstrumentItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  quotesMap: Record<string, Quote>;
}

export const WatchlistPanel: React.FC<WatchlistProps> = ({
  instruments,
  selectedSymbol,
  onSelectSymbol,
  quotesMap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'INDEX' | 'EQUITY'>('ALL');

  const filtered = instruments.filter(inst => {
    const matchesSearch = inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inst.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || inst.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col h-full bg-[#0f1422] border border-[#1e2638] rounded-lg overflow-hidden text-xs">
      {/* Header & Search */}
      <div className="p-2.5 border-b border-[#1e2638] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">Watchlist (NSE)</span>
          <span className="text-[10px] text-slate-400 font-mono">{filtered.length} Instruments</span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search NSE stock or index..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0e14] border border-[#1e2638] rounded pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1">
          {(['ALL', 'EQUITY', 'INDEX'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-[#151c2d] text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Instruments List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1b2234]">
        {filtered.map(inst => {
          const quote = quotesMap[inst.symbol];
          const isSelected = inst.symbol === selectedSymbol;
          const isUp = quote ? quote.change >= 0 : true;

          return (
            <div
              key={inst.symbol}
              onClick={() => onSelectSymbol(inst.symbol)}
              className={`flex items-center justify-between p-2.5 cursor-pointer transition select-none ${
                isSelected
                  ? 'bg-blue-900/20 border-l-4 border-blue-500'
                  : 'hover:bg-[#151c2d] border-l-4 border-transparent'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-100 truncate">{inst.symbol.replace('.NS', '')}</span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#1c2438] text-slate-400 rounded">
                    {inst.exchange}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{inst.name}</div>
              </div>

              {quote ? (
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-slate-100">₹{quote.last_price.toLocaleString()}</div>
                  <div className={`font-mono text-[10px] font-medium flex items-center justify-end ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{quote.change_pct.toFixed(2)}%
                  </div>
                </div>
              ) : (
                <div className="text-right shrink-0 font-mono text-[10px] text-slate-500">
                  Loading...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
