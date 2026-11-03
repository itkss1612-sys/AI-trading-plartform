import {
  MarketOverviewResponse,
  InstrumentItem,
  Quote,
  Candle,
  IndicatorDataset,
  CandlestickPatternMatch,
  SMCStructure,
  AnalysisSummary,
  RiskCalculationResult,
  JournalEntry,
  JournalMetrics
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  async getMarketOverview(): Promise<MarketOverviewResponse> {
    const res = await fetch(`${API_BASE}/market/overview`);
    if (!res.ok) throw new Error('Failed to fetch market overview');
    return res.json();
  },

  async searchInstruments(query?: string): Promise<InstrumentItem[]> {
    const url = query ? `${API_BASE}/market/instruments?q=${encodeURIComponent(query)}` : `${API_BASE}/market/instruments`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to search instruments');
    return res.json();
  },

  async getQuote(symbol: string): Promise<Quote> {
    const res = await fetch(`${API_BASE}/market/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
    return res.json();
  },

  async getHistory(symbol: string, interval = '1d', range = '3mo'): Promise<Candle[]> {
    const res = await fetch(`${API_BASE}/market/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range_param=${range}`);
    if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}`);
    return res.json();
  },

  async getIndicators(symbol: string, interval = '1d', range = '6mo'): Promise<IndicatorDataset> {
    const res = await fetch(`${API_BASE}/analysis/indicators?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range_param=${range}`);
    if (!res.ok) throw new Error(`Failed to fetch indicators for ${symbol}`);
    return res.json();
  },

  async getPatterns(symbol: string, interval = '1d'): Promise<CandlestickPatternMatch[]> {
    const res = await fetch(`${API_BASE}/analysis/patterns?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
    if (!res.ok) throw new Error(`Failed to fetch patterns for ${symbol}`);
    return res.json();
  },

  async getSMC(symbol: string, interval = '1d'): Promise<{ current_trend: string; fvgs: SMCStructure[]; order_blocks: SMCStructure[] }> {
    const res = await fetch(`${API_BASE}/analysis/smc?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
    if (!res.ok) throw new Error(`Failed to fetch SMC for ${symbol}`);
    return res.json();
  },

  async getAnalysisSummary(symbol: string, interval = '1d'): Promise<AnalysisSummary> {
    const res = await fetch(`${API_BASE}/analysis/summary?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
    if (!res.ok) throw new Error(`Failed to fetch summary for ${symbol}`);
    return res.json();
  },

  async calculateRisk(params: {
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entry_price: number;
    stop_loss: number;
    target: number;
    account_capital: number;
    risk_percentage: number;
    lot_size: number;
  }): Promise<RiskCalculationResult> {
    const res = await fetch(`${API_BASE}/risk/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Risk calculation error');
    }
    return res.json();
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    const res = await fetch(`${API_BASE}/journal`);
    if (!res.ok) throw new Error('Failed to load journal');
    return res.json();
  },

  async logTrade(entry: Partial<JournalEntry>): Promise<JournalEntry> {
    const res = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to save trade');
    return res.json();
  },

  async getJournalMetrics(): Promise<JournalMetrics> {
    const res = await fetch(`${API_BASE}/journal/metrics`);
    if (!res.ok) throw new Error('Failed to fetch journal metrics');
    return res.json();
  }
};
