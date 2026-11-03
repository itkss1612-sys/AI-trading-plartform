import React, { useState, useEffect } from 'react';
import { InstrumentItem, AnalysisSummary } from '../types';
import { api } from '../services/api';
import { Scan, TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';

interface ScannerProps {
  instruments: InstrumentItem[];
  onSelectInstrument: (symbol: string) => void;
}

export const SMCScannerView: React.FC<ScannerProps> = ({ instruments, onSelectInstrument }) => {
  const [scanResults, setScanResults] = useState<Record<string, AnalysisSummary>>({});
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsScanning(true);

    const topToScan = instruments.slice(0, 10);
    Promise.all(
      topToScan.map(inst =>
        api.getAnalysisSummary(inst.symbol, '1d')
          .then(res => ({ symbol: inst.symbol, data: res }))
          .catch(() => null)
      )
    ).then(results => {
      if (!isMounted) return;
      const map: Record<string, AnalysisSummary> = {};
      results.forEach(r => {
        if (r && r.data) map[r.symbol] = r.data;
      });
      setScanResults(map);
      setIsScanning(false);
    });

    return () => { isMounted = false; };
  }, [instruments]);

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] p-4 text-xs space-y-4 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
        <div className="flex items-center space-x-2">
          <Scan className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            SMART MONEY & TECHNICAL MARKET SCANNER
          </h2>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          {isScanning ? (
            <span className="text-blue-400 animate-pulse font-semibold">Scanning NSE Market Structure...</span>
          ) : (
            <span>Scan Complete &bull; Verified Calculations</span>
          )}
        </div>
      </div>

      {/* Scanner Matrix Table */}
      <div className="bg-[#121826] border border-[#1e273b] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-[#151c2e] text-slate-400 text-[10px] uppercase border-b border-[#1e273b]">
              <tr>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">LTP (₹)</th>
                <th className="py-2.5 px-3">Trend Regime</th>
                <th className="py-2.5 px-3">RSI (14)</th>
                <th className="py-2.5 px-3">Supertrend</th>
                <th className="py-2.5 px-3">Pivot (CPR)</th>
                <th className="py-2.5 px-3">Recent Patterns</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2336] text-[11px]">
              {instruments.slice(0, 10).map(inst => {
                const item = scanResults[inst.symbol];
                const isBull = item?.trend_classification.includes('BULLISH');
                const isBear = item?.trend_classification.includes('BEARISH');

                return (
                  <tr key={inst.symbol} className="hover:bg-[#161f33] transition">
                    <td className="py-2.5 px-3 font-bold text-white">
                      <div>{inst.symbol.replace('.NS', '')}</div>
                      <div className="text-[9px] text-slate-400 font-sans font-normal">{inst.name}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">
                      {item ? `₹${item.current_price.toFixed(2)}` : '...'}
                    </td>
                    <td className="py-2.5 px-3">
                      {item ? (
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center w-max space-x-1 ${
                          isBull ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          isBear ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {isBull ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                          <span>{item.trend_classification.replace('_', ' ')}</span>
                        </span>
                      ) : '...'}
                    </td>
                    <td className="py-2.5 px-3">
                      {item ? (
                        <span className={item.rsi_14 > 70 ? 'text-rose-400 font-bold' : item.rsi_14 < 30 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {item.rsi_14.toFixed(1)}
                        </span>
                      ) : '...'}
                    </td>
                    <td className="py-2.5 px-3">
                      {item ? (
                        <span className={`font-bold ${item.supertrend_bias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.supertrend_bias}
                        </span>
                      ) : '...'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {item ? `₹${item.cpr.pivot.toFixed(2)}` : '...'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {item?.detected_patterns.length ? (
                        item.detected_patterns.map(p => p.pattern_name).join(', ')
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectInstrument(inst.symbol)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center space-x-1 transition"
                      >
                        <span>Open Chart</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
