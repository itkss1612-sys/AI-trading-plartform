export interface Candle {
  timestamp: number;
  datetime_str: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  name: string;
  exchange: string;
  last_price: number;
  previous_close: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  data_status: string;
}

export interface MarketIndexOverview {
  symbol: string;
  name: string;
  last_price: number;
  change: number;
  change_pct: number;
  day_high: number;
  day_low: number;
  data_status: string;
}

export interface MarketOverviewResponse {
  market_status: "OPEN" | "CLOSED";
  exchange: string;
  last_updated: string;
  feed_health: string;
  indices: MarketIndexOverview[];
  advance_decline: {
    advances: number;
    declines: number;
    unchanged: number;
  };
}

export interface InstrumentItem {
  symbol: string;
  name: string;
  exchange: string;
  category: string;
  lot_size: number;
  tick_size: number;
  sector: string;
}

export interface CandlestickPatternMatch {
  pattern_name: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  candle_index: number;
  timestamp: string;
  price: number;
  description: string;
  confirmation_rules: string;
  invalidation_rules: string;
  reliability: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";
}

export interface SMCStructure {
  structure_type: string;
  direction: "BULLISH" | "BEARISH";
  top: number;
  bottom: number;
  timestamp: string;
  status: "ACTIVE" | "UNMITIGATED" | "MITIGATED" | "CONFIRMED";
  description: string;
}

export interface AnalysisSummary {
  symbol: string;
  timeframe: string;
  current_price: number;
  trend_classification: string;
  rsi_14: number;
  supertrend_bias: string;
  key_support: number;
  key_resistance: number;
  cpr: {
    pivot: number;
    tc: number;
    bc: number;
    r1: number;
    s1: number;
    r2: number;
    s2: number;
    cpr_width_pct: number;
  };
  setup_status: string;
  detected_patterns: CandlestickPatternMatch[];
  unmitigated_fvgs: SMCStructure[];
  active_order_blocks: SMCStructure[];
  data_status: string;
}

export interface IndicatorDataset {
  symbol: string;
  interval: string;
  count: number;
  timestamps: string[];
  close: number[];
  sma_20: (number | null)[];
  sma_50: (number | null)[];
  sma_200: (number | null)[];
  ema_9: (number | null)[];
  ema_21: (number | null)[];
  ema_50: (number | null)[];
  supertrend: (number | null)[];
  supertrend_direction: (number | null)[];
  bollinger_upper: (number | null)[];
  bollinger_middle: (number | null)[];
  bollinger_lower: (number | null)[];
  rsi_14: (number | null)[];
  macd: (number | null)[];
  macd_signal: (number | null)[];
  macd_histogram: (number | null)[];
  atr_14: (number | null)[];
  vwap: (number | null)[];
  cpr: Record<string, number>;
}

export interface RiskCalculationResult {
  symbol: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  target: number;
  risk_per_share: number;
  reward_per_share: number;
  risk_reward_ratio: number;
  calculated_quantity: number;
  lots: number;
  total_position_value: number;
  monetary_risk: number;
  monetary_reward: number;
  risk_pct_of_capital: number;
  is_risk_acceptable: boolean;
  warning_messages: string[];
  estimated_brokerage_charges: {
    brokerage: number;
    stt_ctt: number;
    exchange_turnover_charges: number;
    sebi_turnover_fee: number;
    stamp_duty: number;
    gst_18pct: number;
    total_estimated_charges: number;
    breakeven_points: number;
  };
}

export interface JournalEntry {
  id: string;
  user_id: string;
  trade_date: string;
  symbol: string;
  exchange: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  exit_price: number;
  quantity: number;
  stop_loss: number;
  target: number;
  net_pnl: number;
  charges: number;
  setup_type: string;
  timeframe: string;
  notes: string;
  screenshot_url: string;
}

export interface JournalMetrics {
  total_trades: number;
  win_count: number;
  loss_count: number;
  win_rate_pct: number;
  total_net_pnl: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  max_drawdown: number;
}
