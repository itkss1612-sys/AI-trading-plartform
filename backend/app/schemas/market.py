from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class Candle(BaseModel):
    timestamp: int  # UNIX timestamp (seconds) or ISO string
    datetime_str: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class Quote(BaseModel):
    symbol: str
    name: str
    exchange: str
    last_price: float
    previous_close: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    volume: float
    timestamp: str
    data_status: str  # e.g., "LIVE - NSE", "DELAYED - 15m", "EOD HISTORICAL", "SAMPLE"

class MarketIndexOverview(BaseModel):
    symbol: str
    name: str
    last_price: float
    change: float
    change_pct: float
    day_high: float
    day_low: float
    data_status: str

class MarketOverviewResponse(BaseModel):
    market_status: str  # "OPEN" or "CLOSED"
    exchange: str
    last_updated: str
    feed_health: str  # "CONNECTED", "DEGRADED", "OFFLINE"
    indices: List[MarketIndexOverview]
    advance_decline: Dict[str, int]

class InstrumentItem(BaseModel):
    symbol: str
    name: str
    exchange: str
    category: str  # "EQUITY", "INDEX", "FNO"
    lot_size: int = 1
    tick_size: float = 0.05
    sector: Optional[str] = "General"

class IndicatorConfig(BaseModel):
    symbol: str
    timeframe: str = "1d"  # 1m, 5m, 15m, 1h, 1d, 1wk
    indicators: List[str] = ["SMA", "EMA", "RSI", "MACD", "SUPERTREND", "BOLLINGER", "VWAP"]
    params: Optional[Dict[str, Any]] = None

class CandlestickPatternMatch(BaseModel):
    pattern_name: str
    direction: str  # "BULLISH", "BEARISH", "NEUTRAL"
    candle_index: int
    timestamp: str
    price: float
    description: str
    confirmation_rules: str
    invalidation_rules: str
    reliability: str  # "HIGH", "MEDIUM", "LOW"

class SMCStructureMatch(BaseModel):
    structure_type: str  # "ORDER_BLOCK", "FVG", "BOS", "CHOCH", "LIQUIDITY_SWEEP", "EQH", "EQL"
    direction: str  # "BULLISH", "BEARISH"
    top: float
    bottom: float
    timeframe: str
    timestamp: str
    status: str  # "UNMITIGATED", "MITIGATED", "ACTIVE", "CONFIRMED"
    description: str

class RiskCalculationRequest(BaseModel):
    symbol: str
    direction: str  # "LONG" or "SHORT"
    entry_price: float
    stop_loss: float
    target: float
    account_capital: float
    risk_percentage: float  # e.g. 1.0%
    lot_size: int = 1

class RiskCalculationResponse(BaseModel):
    symbol: str
    direction: str
    entry_price: float
    stop_loss: float
    target: float
    risk_per_share: float
    reward_per_share: float
    risk_reward_ratio: float
    calculated_quantity: int
    lots: int
    total_position_value: float
    monetary_risk: float
    monetary_reward: float
    risk_pct_of_capital: float
    is_risk_acceptable: bool
    warning_messages: List[str]
    estimated_brokerage_charges: Dict[str, float]
