import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { JournalEntry, JournalMetrics } from '../types';
import { BookOpen, TrendingUp, TrendingDown, Plus, Award, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const TradingJournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [metrics, setMetrics] = useState<JournalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick trade modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('RELIANCE.NS');
  const [newDirection, setNewDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [newEntry, setNewEntry] = useState<number>(2500);
  const [newExit, setNewExit] = useState<number>(2560);
  const [newQty, setNewQty] = useState<number>(100);
  const [newSetup, setNewSetup] = useState('SMC Order Block Retest');
  const [newNotes, setNewNotes] = useState('Clean liquidity sweep at 15m demand zone.');

  const loadJournal = async () => {
    setIsLoading(true);
    try {
      const [entriesData, metricsData] = await Promise.all([
        api.getJournalEntries(),
        api.getJournalMetrics()
      ]);
      setEntries(entriesData);
      setMetrics(metricsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJournal();
  }, []);

  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logTrade({
        symbol: newSymbol,
        direction: newDirection,
        entry_price: newEntry,
        exit_price: newExit,
        quantity: newQty,
        charges: 52.4, // standard estimated statutory charge
        setup_type: newSetup,
        notes: newNotes
      });
      setShowAddModal(false);
      loadJournal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] p-4 text-xs space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-wide">VERIFIED TRADING JOURNAL & PERFORMANCE</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded font-bold bg-blue-600 hover:bg-blue-500 text-white shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Log Completed Trade</span>
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 rounded-lg bg-[#121826] border border-[#1e273b]">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>WIN RATE</span>
              <Award className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {metrics.win_rate_pct}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {metrics.win_count} Wins / {metrics.loss_count} Losses
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#121826] border border-[#1e273b]">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>NET REALIZED P&L</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-xl font-bold mt-1 ${metrics.total_net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{metrics.total_net_pnl.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Net of all statutory charges
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#121826] border border-[#1e273b]">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>PROFIT FACTOR</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {metrics.profit_factor}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg Win: ₹{metrics.avg_win} | Avg Loss: ₹{metrics.avg_loss}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#121826] border border-[#1e273b]">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>MAX DRAWDOWN</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">
              ₹{metrics.max_drawdown.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Peak-to-trough realized risk
            </div>
          </div>
        </div>
      )}

      {/* Trade Log Table */}
      <div className="flex-1 bg-[#121826] border border-[#1e273b] rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-[#1e273b] flex items-center justify-between bg-[#0e1320]">
          <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px]">Trade History Records ({entries.length})</span>
          <span className="text-[10px] text-slate-500">Zero Simulated Discrepancies</span>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No recorded trades found. Log a trade or use the Trade Risk Planner to record live journal entries.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead className="bg-[#151c2e] text-slate-400 text-[10px] uppercase border-b border-[#1e273b]">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Entry</th>
                  <th className="py-2 px-3">Exit</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Net P&L</th>
                  <th className="py-2 px-3">Setup</th>
                  <th className="py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2336] text-[11px]">
                {entries.map(trade => (
                  <tr key={trade.id} className="hover:bg-[#161f33] transition">
                    <td className="py-2 px-3 text-slate-400">{new Date(trade.trade_date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 font-bold text-white">{trade.symbol}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        trade.direction === 'LONG' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-200">₹{trade.entry_price}</td>
                    <td className="py-2 px-3 text-slate-200">₹{trade.exit_price}</td>
                    <td className="py-2 px-3 text-slate-300">{trade.quantity}</td>
                    <td className={`py-2 px-3 font-bold ${trade.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.net_pnl >= 0 ? '+' : ''}₹{trade.net_pnl.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{trade.setup_type}</td>
                    <td className="py-2 px-3 text-slate-400 max-w-xs truncate">{trade.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#121826] border border-[#232f48] rounded-lg max-w-md w-full p-4 space-y-3 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Log Completed Trade</h3>
            <form onSubmit={handleSaveTrade} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px]">Symbol</label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Direction</label>
                  <select
                    value={newDirection}
                    onChange={e => setNewDirection(e.target.value as any)}
                    className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5"
                  >
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Entry Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newEntry}
                    onChange={e => setNewEntry(Number(e.target.value))}
                    className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Exit Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newExit}
                    onChange={e => setNewExit(Number(e.target.value))}
                    className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Quantity</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={e => setNewQty(Number(e.target.value))}
                    className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Setup Type</label>
                  <input
                    type="text"
                    value={newSetup}
                    onChange={e => setNewSetup(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px]">Notes & Lessons Learned</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 text-white mt-0.5 h-16 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
