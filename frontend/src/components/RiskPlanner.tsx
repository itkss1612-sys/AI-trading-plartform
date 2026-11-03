import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RiskCalculationResult } from '../types';
import { ShieldAlert, CheckCircle, Calculator, AlertTriangle, ArrowRight } from 'lucide-react';

interface RiskPlannerProps {
  symbol: string;
  currentPrice: number;
  onTradeLogged?: () => void;
}

export const RiskPlanner: React.FC<RiskPlannerProps> = ({
  symbol,
  currentPrice,
  onTradeLogged
}) => {
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 1000);
  const [stopLoss, setStopLoss] = useState<number>(currentPrice ? Math.round(currentPrice * 0.98 * 100) / 100 : 980);
  const [targetPrice, setTargetPrice] = useState<number>(currentPrice ? Math.round(currentPrice * 1.04 * 100) / 100 : 1040);
  const [accountCapital, setAccountCapital] = useState<number>(500000);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [lotSize, setLotSize] = useState<number>(symbol.includes('^') ? 25 : 1);

  const [calculation, setCalculation] = useState<RiskCalculationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync entry price when symbol changes
  useEffect(() => {
    if (currentPrice > 0) {
      setEntryPrice(currentPrice);
      if (direction === 'LONG') {
        setStopLoss(Math.round(currentPrice * 0.985 * 100) / 100);
        setTargetPrice(Math.round(currentPrice * 1.035 * 100) / 100);
      } else {
        setStopLoss(Math.round(currentPrice * 1.015 * 100) / 100);
        setTargetPrice(Math.round(currentPrice * 0.965 * 100) / 100);
      }
    }
  }, [symbol, currentPrice, direction]);

  // Recalculate automatically
  useEffect(() => {
    if (entryPrice > 0 && stopLoss > 0 && targetPrice > 0) {
      api.calculateRisk({
        symbol,
        direction,
        entry_price: entryPrice,
        stop_loss: stopLoss,
        target: targetPrice,
        account_capital: accountCapital,
        risk_percentage: riskPct,
        lot_size: lotSize
      })
      .then(res => {
        setCalculation(res);
        setErrorMsg(null);
      })
      .catch(err => {
        setErrorMsg(err.message);
        setCalculation(null);
      });
    }
  }, [symbol, direction, entryPrice, stopLoss, targetPrice, accountCapital, riskPct, lotSize]);

  const handleLogTrade = async () => {
    if (!calculation) return;
    setIsSaving(true);
    try {
      await api.logTrade({
        symbol,
        direction,
        entry_price: calculation.entry_price,
        exit_price: calculation.target,
        quantity: calculation.calculated_quantity,
        stop_loss: calculation.stop_loss,
        target: calculation.target,
        charges: calculation.estimated_brokerage_charges.total_estimated_charges,
        setup_type: 'Risk Planner Planned Trade',
        notes: `R:R ${calculation.risk_reward_ratio}:1. Risk: ₹${calculation.monetary_risk}. Capital: ₹${accountCapital}.`
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onTradeLogged) onTradeLogged();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1422] border border-[#1e2638] rounded-lg p-3 text-xs overflow-y-auto space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e2638]">
        <div className="flex items-center space-x-1.5">
          <Calculator className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wide">Institutional Trade & Risk Planner</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">NSE Cash & F&O Model</span>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-400 font-semibold">Direction</label>
          <div className="flex rounded bg-[#0b0e14] p-0.5 border border-[#1e2638] mt-1">
            <button
              onClick={() => setDirection('LONG')}
              className={`flex-1 py-1 rounded font-bold transition ${direction === 'LONG' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
            >
              LONG
            </button>
            <button
              onClick={() => setDirection('SHORT')}
              className={`flex-1 py-1 rounded font-bold transition ${direction === 'SHORT' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
            >
              SHORT
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-semibold">Account Capital (₹)</label>
          <input
            type="number"
            value={accountCapital}
            onChange={e => setAccountCapital(Number(e.target.value))}
            className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 mt-1 font-mono text-white"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-semibold">Entry Price (₹)</label>
          <input
            type="number"
            step="0.05"
            value={entryPrice}
            onChange={e => setEntryPrice(Number(e.target.value))}
            className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 mt-1 font-mono text-white"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-semibold">Risk Per Trade (%)</label>
          <input
            type="number"
            step="0.1"
            value={riskPct}
            onChange={e => setRiskPct(Number(e.target.value))}
            className="w-full bg-[#0b0e14] border border-[#1e2638] rounded px-2 py-1 mt-1 font-mono text-white"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-semibold">Stop Loss (₹)</label>
          <input
            type="number"
            step="0.05"
            value={stopLoss}
            onChange={e => setStopLoss(Number(e.target.value))}
            className="w-full bg-[#0b0e14] border border-rose-900/60 rounded px-2 py-1 mt-1 font-mono text-rose-300"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-semibold">Target Price (₹)</label>
          <input
            type="number"
            step="0.05"
            value={targetPrice}
            onChange={e => setTargetPrice(Number(e.target.value))}
            className="w-full bg-[#0b0e14] border border-emerald-900/60 rounded px-2 py-1 mt-1 font-mono text-emerald-300"
          />
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-[11px] flex items-center space-x-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Calculated Position Results */}
      {calculation && (
        <div className="space-y-2.5 pt-1">
          {/* Key Metrics Badges */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
            <div className="p-2 rounded bg-[#121827] border border-[#1e2638]">
              <div className="text-[9px] text-slate-400">Position Size</div>
              <div className="font-bold text-white text-sm">{calculation.calculated_quantity} Shares</div>
              <div className="text-[9px] text-slate-500">{calculation.lots} Lot(s)</div>
            </div>

            <div className="p-2 rounded bg-[#121827] border border-[#1e2638]">
              <div className="text-[9px] text-slate-400">Reward : Risk</div>
              <div className={`font-bold text-sm ${calculation.risk_reward_ratio >= 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {calculation.risk_reward_ratio} : 1
              </div>
              <div className="text-[9px] text-slate-500">
                {calculation.risk_reward_ratio >= 1.5 ? 'Favorable' : 'Poor R:R'}
              </div>
            </div>

            <div className="p-2 rounded bg-[#121827] border border-[#1e2638]">
              <div className="text-[9px] text-slate-400">Capital At Risk</div>
              <div className="font-bold text-rose-400 text-sm">₹{calculation.monetary_risk.toLocaleString()}</div>
              <div className="text-[9px] text-slate-500">{calculation.risk_pct_of_capital}% of capital</div>
            </div>
          </div>

          {/* Potential Reward & Exposure */}
          <div className="p-2 rounded bg-[#131a29] border border-[#212c42] flex justify-between font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Potential Gross Profit: </span>
              <span className="font-bold text-emerald-400">₹{calculation.monetary_reward.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">Total Position Value: </span>
              <span className="font-bold text-white">₹{calculation.total_position_value.toLocaleString()}</span>
            </div>
          </div>

          {/* Indian Statutory Charges Breakdown */}
          <div className="p-2 rounded bg-[#0b0e14] border border-[#1b2336] space-y-1 font-mono text-[10px]">
            <div className="flex justify-between text-slate-300 font-bold border-b border-[#1e273a] pb-1">
              <span>Estimated NSE & Statutory Charges:</span>
              <span className="text-amber-400">₹{calculation.estimated_brokerage_charges.total_estimated_charges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Brokerage (₹20 cap)</span>
              <span>₹{calculation.estimated_brokerage_charges.brokerage.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>STT / CTT (Securities Transaction Tax)</span>
              <span>₹{calculation.estimated_brokerage_charges.stt_ctt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Exchange Turnover & SEBI Fees</span>
              <span>₹{(calculation.estimated_brokerage_charges.exchange_turnover_charges + calculation.estimated_brokerage_charges.sebi_turnover_fee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST (18%) & Stamp Duty</span>
              <span>₹{(calculation.estimated_brokerage_charges.gst_18pct + calculation.estimated_brokerage_charges.stamp_duty).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold pt-1 border-t border-[#1e273a]">
              <span>Breakeven Per Share:</span>
              <span className="text-white">₹{calculation.estimated_brokerage_charges.breakeven_points.toFixed(2)}</span>
            </div>
          </div>

          {/* Risk Warnings */}
          {calculation.warning_messages.length > 0 && (
            <div className="p-2 rounded bg-amber-950/30 border border-amber-800/50 space-y-1 text-[10px] text-amber-200">
              {calculation.warning_messages.map((warn, i) => (
                <div key={i} className="flex items-start space-x-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Button: Log to Journal */}
          <button
            onClick={handleLogTrade}
            disabled={isSaving}
            className="w-full py-2 px-3 rounded font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Trade Logged to Journal!</span>
              </>
            ) : (
              <>
                <span>Save to Trading Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
