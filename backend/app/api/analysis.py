from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List, Optional
import pandas as pd
from app.services.market_data import market_data_provider
from app.services.indicator_engine import IndicatorEngine
from app.services.pattern_engine import PatternEngine

router = APIRouter(prefix="/analysis", tags=["Technical & Smart Money Analysis"])

@router.get("/indicators")
def get_indicators(
    symbol: str = Query(..., description="Instrument symbol, e.g. RELIANCE.NS"),
    interval: str = Query("1d", description="Timeframe: 1m, 5m, 15m, 1h, 1d"),
    range_param: str = Query("6mo", description="Historical range: 1mo, 3mo, 6mo, 1y")
) -> Dict[str, Any]:
    """Calculates all key indicators with zero look-ahead bias over the series."""
    df = market_data_provider.fetch_ohlcv(symbol, interval=interval, range_param=range_param)
    if df.empty or len(df) < 5:
        raise HTTPException(status_code=400, detail="Insufficient price data to compute indicators.")

    close = df['close']
    high = df['high']
    low = df['low']
    volume = df['volume']

    # Trend Indicators
    sma_20 = IndicatorEngine.calculate_sma(close, 20)
    sma_50 = IndicatorEngine.calculate_sma(close, 50)
    sma_200 = IndicatorEngine.calculate_sma(close, 200) if len(df) >= 200 else [None] * len(df)
    ema_9 = IndicatorEngine.calculate_ema(close, 9)
    ema_21 = IndicatorEngine.calculate_ema(close, 21)
    ema_50 = IndicatorEngine.calculate_ema(close, 50)
    supertrend_res = IndicatorEngine.calculate_supertrend(high, low, close, period=10, multiplier=3.0)

    # Volatility Indicators
    bollinger = IndicatorEngine.calculate_bollinger_bands(close, period=20, num_std=2.0)
    atr = IndicatorEngine.calculate_atr(high, low, close, period=14)

    # Momentum Indicators
    rsi_14 = IndicatorEngine.calculate_rsi(close, 14)
    macd_res = IndicatorEngine.calculate_macd(close, fast=12, slow=26, signal=9)

    # Volume Indicators
    vwap = IndicatorEngine.calculate_vwap(high, low, close, volume)

    # Central Pivot Range (CPR) from prior session
    prev_h = float(high.iloc[-2]) if len(df) > 1 else float(high.iloc[-1])
    prev_l = float(low.iloc[-2]) if len(df) > 1 else float(low.iloc[-1])
    prev_c = float(close.iloc[-2]) if len(df) > 1 else float(close.iloc[-1])
    cpr = IndicatorEngine.calculate_cpr(prev_h, prev_l, prev_c)

    return {
        "symbol": symbol,
        "interval": interval,
        "count": len(df),
        "timestamps": df["datetime_str"].tolist(),
        "close": [round(float(c), 2) for c in close],
        "sma_20": sma_20,
        "sma_50": sma_50,
        "sma_200": sma_200,
        "ema_9": ema_9,
        "ema_21": ema_21,
        "ema_50": ema_50,
        "supertrend": supertrend_res["supertrend"],
        "supertrend_direction": supertrend_res["direction"],
        "bollinger_upper": bollinger["upper"],
        "bollinger_middle": bollinger["middle"],
        "bollinger_lower": bollinger["lower"],
        "rsi_14": rsi_14,
        "macd": macd_res["macd"],
        "macd_signal": macd_res["signal"],
        "macd_histogram": macd_res["histogram"],
        "atr_14": atr,
        "vwap": vwap,
        "cpr": cpr
    }

@router.get("/patterns")
def get_patterns(
    symbol: str = Query(..., description="Instrument symbol, e.g. RELIANCE.NS"),
    interval: str = Query("1d", description="Timeframe"),
    range_param: str = Query("3mo", description="Range")
) -> List[Dict[str, Any]]:
    """Identifies candlestick patterns with confirmation and invalidation rules."""
    df = market_data_provider.fetch_ohlcv(symbol, interval=interval, range_param=range_param)
    return PatternEngine.detect_candlestick_patterns(df)

@router.get("/smc")
def get_smc_analysis(
    symbol: str = Query(..., description="Instrument symbol, e.g. RELIANCE.NS"),
    interval: str = Query("1d", description="Timeframe"),
    range_param: str = Query("6mo", description="Range")
) -> Dict[str, Any]:
    """Calculates Smart Money Concepts: FVGs, Order Blocks, and Market Structure (BOS/ChoCh)."""
    df = market_data_provider.fetch_ohlcv(symbol, interval=interval, range_param=range_param)
    return PatternEngine.detect_smart_money_concepts(df)

@router.get("/summary")
def get_analysis_summary(
    symbol: str = Query(..., description="Instrument symbol"),
    interval: str = Query("1d", description="Timeframe")
) -> Dict[str, Any]:
    """Unified technical summary with trend classification, key levels, and actionable setups."""
    df = market_data_provider.fetch_ohlcv(symbol, interval=interval, range_param="3mo")
    if df.empty or len(df) < 5:
        raise HTTPException(status_code=400, detail="Insufficient data for analysis")

    close = df['close']
    high = df['high']
    low = df['low']
    current_price = float(close.iloc[-1])

    # Indicators
    ema_21 = IndicatorEngine.calculate_ema(close, 21)
    ema_50 = IndicatorEngine.calculate_ema(close, 50)
    rsi = IndicatorEngine.calculate_rsi(close, 14)
    supertrend = IndicatorEngine.calculate_supertrend(high, low, close, 10, 3.0)

    last_ema_21 = [v for v in ema_21 if v is not None][-1] if any(v is not None for v in ema_21) else current_price
    last_ema_50 = [v for v in ema_50 if v is not None][-1] if any(v is not None for v in ema_50) else current_price
    last_rsi = [v for v in rsi if v is not None][-1] if any(v is not None for v in rsi) else 50.0
    last_st_dir = [v for v in supertrend["direction"] if v is not None][-1] if any(v is not None for v in supertrend["direction"]) else 1

    # Trend logic
    if current_price > last_ema_21 > last_ema_50 and last_st_dir == 1:
        trend = "STRONG_BULLISH"
    elif current_price < last_ema_21 < last_ema_50 and last_st_dir == -1:
        trend = "STRONG_BEARISH"
    elif current_price > last_ema_50:
        trend = "MODERATELY_BULLISH"
    elif current_price < last_ema_50:
        trend = "MODERATELY_BEARISH"
    else:
        trend = "SIDEWAYS / CONSOLIDATION"

    # CPR
    prev_h = float(high.iloc[-2]) if len(df) > 1 else float(high.iloc[-1])
    prev_l = float(low.iloc[-2]) if len(df) > 1 else float(low.iloc[-1])
    prev_c = float(close.iloc[-2]) if len(df) > 1 else float(close.iloc[-1])
    cpr = IndicatorEngine.calculate_cpr(prev_h, prev_l, prev_c)

    # Patterns & SMC
    candlestick_patterns = PatternEngine.detect_candlestick_patterns(df)
    smc = PatternEngine.detect_smart_money_concepts(df)

    latest_patterns = candlestick_patterns[-3:] if candlestick_patterns else []

    # Potential breakout/breakdown setups
    support_level = cpr["s1"]
    resistance_level = cpr["r1"]
    setup_status = "Awaiting breakout/pullback confirmation"
    if current_price > resistance_level:
        setup_status = f"Breakout above R1 ({resistance_level}) active. Watch for continuation towards R2 ({cpr['r2']})."
    elif current_price < support_level:
        setup_status = f"Breakdown below S1 ({support_level}) active. Watch for lower support at S2 ({cpr['s2']})."
    elif abs(current_price - cpr["pivot"]) / current_price < 0.005:
        setup_status = f"Testing Central Pivot ({cpr['pivot']}). Reversal or breakout setup forming."

    return {
        "symbol": symbol,
        "timeframe": interval,
        "current_price": current_price,
        "trend_classification": trend,
        "rsi_14": last_rsi,
        "supertrend_bias": "BULLISH" if last_st_dir == 1 else "BEARISH",
        "key_support": support_level,
        "key_resistance": resistance_level,
        "cpr": cpr,
        "setup_status": setup_status,
        "detected_patterns": latest_patterns,
        "unmitigated_fvgs": [f for f in smc.get("fvgs", []) if f.get("status") == "UNMITIGATED"][:3],
        "active_order_blocks": smc.get("order_blocks", [])[:2],
        "data_status": market_data_provider.get_data_status()
    }
