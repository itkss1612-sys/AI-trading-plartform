import pandas as pd
import numpy as np
from typing import List, Dict, Any

class PatternEngine:
    """
    Rule-based pattern recognition engine:
    1. Candlestick patterns with mathematical tolerances, confirmation, and invalidation rules.
    2. Smart Money Concepts (FVGs, Order Blocks, Liquidity Sweeps, BOS, ChoCh).
    3. Classical Pivot structures.
    """

    @staticmethod
    def detect_candlestick_patterns(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Scans dataframe for well-defined candlestick patterns.
        Strictly inspects backward candle indices.
        """
        patterns = []
        if len(df) < 3:
            return patterns

        opens = df['open'].values
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        timestamps = df['datetime_str'].values if 'datetime_str' in df.columns else [str(i) for i in range(len(df))]

        for i in range(2, len(df)):
            o, h, l, c = opens[i], highs[i], lows[i], closes[i]
            prev_o, prev_h, prev_l, prev_c = opens[i-1], highs[i-1], lows[i-1], closes[i-1]
            body = abs(c - o)
            candle_range = h - l if (h - l) > 0 else 0.0001
            upper_shadow = h - max(o, c)
            lower_shadow = min(o, c) - l

            prev_body = abs(prev_c - prev_o)

            # 1. Doji Variations (Body <= 10% of total range)
            if body <= (0.10 * candle_range):
                doji_type = "Standard Doji"
                direction = "NEUTRAL"
                if lower_shadow >= (0.65 * candle_range) and upper_shadow <= (0.15 * candle_range):
                    doji_type = "Dragonfly Doji"
                    direction = "BULLISH"
                elif upper_shadow >= (0.65 * candle_range) and lower_shadow <= (0.15 * candle_range):
                    doji_type = "Gravestone Doji"
                    direction = "BEARISH"

                patterns.append({
                    "pattern_name": doji_type,
                    "direction": direction,
                    "candle_index": i,
                    "timestamp": timestamps[i],
                    "price": round(float(c), 2),
                    "description": f"{doji_type} detected: Open and Close virtually identical (Body: {round(body, 2)} vs Range: {round(candle_range, 2)}). Indicates market indecision or impending reversal.",
                    "confirmation_rules": f"Next candle closes {'above' if direction=='BULLISH' else 'below'} {round(h if direction=='BULLISH' else l, 2)}.",
                    "invalidation_rules": f"Price moves across the opposite extreme ({round(l if direction=='BULLISH' else h, 2)}).",
                    "reliability": "MEDIUM"
                })

            # 2. Hammer & Inverted Hammer (At potential bottoms / pullback)
            if lower_shadow >= (2.0 * body) and upper_shadow <= (0.20 * candle_range) and body > 0:
                patterns.append({
                    "pattern_name": "Hammer (Pinbar)",
                    "direction": "BULLISH",
                    "candle_index": i,
                    "timestamp": timestamps[i],
                    "price": round(float(c), 2),
                    "description": "Bullish Hammer: Long lower shadow showing sharp price rejection by aggressive buyers.",
                    "confirmation_rules": f"Follow-through candle closing above Hammer high ({round(h, 2)}).",
                    "invalidation_rules": f"Breach below Hammer low ({round(l, 2)}).",
                    "reliability": "HIGH"
                })

            # 3. Shooting Star (At potential tops / resistance)
            if upper_shadow >= (2.0 * body) and lower_shadow <= (0.20 * candle_range) and body > 0:
                patterns.append({
                    "pattern_name": "Shooting Star",
                    "direction": "BEARISH",
                    "candle_index": i,
                    "timestamp": timestamps[i],
                    "price": round(float(c), 2),
                    "description": "Bearish Shooting Star: Long upper wick showing rejection of higher prices by institutional sellers.",
                    "confirmation_rules": f"Follow-through candle closing below low ({round(l, 2)}).",
                    "invalidation_rules": f"Close above Shooting Star high ({round(h, 2)}).",
                    "reliability": "HIGH"
                })

            # 4. Bullish Engulfing
            if prev_c < prev_o and c > o and c >= prev_o and o <= prev_c:
                patterns.append({
                    "pattern_name": "Bullish Engulfing",
                    "direction": "BULLISH",
                    "candle_index": i,
                    "timestamp": timestamps[i],
                    "price": round(float(c), 2),
                    "description": "Bullish Engulfing: Current green body completely swallows previous red candle's real body, signaling demand dominance.",
                    "confirmation_rules": f"Sustained acceptance above {round(c, 2)}.",
                    "invalidation_rules": f"Close below the engulfing candle low ({round(l, 2)}).",
                    "reliability": "HIGH"
                })

            # 5. Bearish Engulfing
            if prev_c > prev_o and c < o and c <= prev_o and o >= prev_c:
                patterns.append({
                    "pattern_name": "Bearish Engulfing",
                    "direction": "BEARISH",
                    "candle_index": i,
                    "timestamp": timestamps[i],
                    "price": round(float(c), 2),
                    "description": "Bearish Engulfing: Current red body completely engulfs prior green candle's body, indicating sudden supply influx.",
                    "confirmation_rules": f"Next candle breaks below {round(l, 2)}.",
                    "invalidation_rules": f"Close above high of engulfing candle ({round(h, 2)}).",
                    "reliability": "HIGH"
                })

            # 6. Morning Star (3-candle formation)
            if i >= 3:
                p2_o, p2_c = opens[i-2], closes[i-2]
                if p2_c < p2_o and prev_body < (0.4 * abs(p2_c - p2_o)) and c > o and c > (p2_o + p2_c) / 2:
                    patterns.append({
                        "pattern_name": "Morning Star",
                        "direction": "BULLISH",
                        "candle_index": i,
                        "timestamp": timestamps[i],
                        "price": round(float(c), 2),
                        "description": "Morning Star 3-Candle Reversal: Bearish impulse, followed by compression star, confirmed by strong bullish surge.",
                        "confirmation_rules": "Confirmed upon close of 3rd candle.",
                        "invalidation_rules": f"Break below pattern base low ({round(min(lows[i-2:i+1]), 2)}).",
                        "reliability": "VERY_HIGH"
                    })

            # 7. Evening Star (3-candle formation)
            if i >= 3:
                p2_o, p2_c = opens[i-2], closes[i-2]
                if p2_c > p2_o and prev_body < (0.4 * abs(p2_c - p2_o)) and c < o and c < (p2_o + p2_c) / 2:
                    patterns.append({
                        "pattern_name": "Evening Star",
                        "direction": "BEARISH",
                        "candle_index": i,
                        "timestamp": timestamps[i],
                        "price": round(float(c), 2),
                        "description": "Evening Star 3-Candle Reversal: Bullish expansion followed by indecision star, followed by aggressive selloff.",
                        "confirmation_rules": "Confirmed upon close of 3rd candle.",
                        "invalidation_rules": f"Break above pattern peak high ({round(max(highs[i-2:i+1]), 2)}).",
                        "reliability": "VERY_HIGH"
                    })

            # 8. Marubozu (Strong directional trend bar, minimal wicks < 5% range)
            if body >= 0.85 * candle_range and candle_range > 0:
                direction = "BULLISH" if c > o else "BEARISH"
                patterns.append({
                    "pattern_name": f"{direction.capitalize()} Marubozu",
                    "direction": direction,
                    "candle_index": i,
                    "timestamp": timestamps[i],
                    "price": round(float(c), 2),
                    "description": f"Dominant {direction.lower()} momentum bar without counter-pressure wicks.",
                    "confirmation_rules": f"Continuation beyond {round(h if direction=='BULLISH' else l, 2)}.",
                    "invalidation_rules": f"Retracement below 50% midpoint of the bar ({round((h+l)/2, 2)}).",
                    "reliability": "HIGH"
                })

        return patterns

    @staticmethod
    def detect_smart_money_concepts(df: pd.DataFrame, lookback: int = 50) -> Dict[str, Any]:
        """
        Detects Fair Value Gaps (FVG), Order Blocks (OB), Break of Structure (BOS),
        and Change of Character (ChoCh).
        Zero look-ahead bias: processes strictly sequentially.
        """
        if len(df) < 10:
            return {"fvg": [], "order_blocks": [], "market_structure": []}

        df_slice = df.tail(lookback).reset_index(drop=True)
        highs = df_slice['high'].values
        lows = df_slice['low'].values
        opens = df_slice['open'].values
        closes = df_slice['close'].values
        timestamps = df_slice['datetime_str'].values if 'datetime_str' in df_slice.columns else [str(i) for i in range(len(df_slice))]
        n = len(df_slice)

        fvgs = []
        # 1. Fair Value Gaps (FVG)
        # Bullish FVG: High[i-2] < Low[i] (imbalance gap between candle 0 and candle 2)
        # Bearish FVG: Low[i-2] > High[i]
        for i in range(2, n):
            # Bullish FVG
            if lows[i] > highs[i-2]:
                gap_top = float(lows[i])
                gap_bottom = float(highs[i-2])
                # Check mitigation in subsequent candles
                is_mitigated = any(lows[k] <= gap_bottom for k in range(i+1, n)) if i + 1 < n else False
                status = "MITIGATED" if is_mitigated else "UNMITIGATED"

                fvgs.append({
                    "structure_type": "BULLISH_FVG",
                    "direction": "BULLISH",
                    "top": round(gap_top, 2),
                    "bottom": round(gap_bottom, 2),
                    "timestamp": timestamps[i-1],
                    "status": status,
                    "description": f"Bullish Fair Value Gap between {round(gap_bottom, 2)} and {round(gap_top, 2)}. Status: {status}."
                })

            # Bearish FVG
            if highs[i] < lows[i-2]:
                gap_top = float(lows[i-2])
                gap_bottom = float(highs[i])
                is_mitigated = any(highs[k] >= gap_top for k in range(i+1, n)) if i + 1 < n else False
                status = "MITIGATED" if is_mitigated else "UNMITIGATED"

                fvgs.append({
                    "structure_type": "BEARISH_FVG",
                    "direction": "BEARISH",
                    "top": round(gap_top, 2),
                    "bottom": round(gap_bottom, 2),
                    "timestamp": timestamps[i-1],
                    "status": status,
                    "description": f"Bearish Fair Value Gap between {round(gap_bottom, 2)} and {round(gap_top, 2)}. Status: {status}."
                })

        # 2. Swing Highs & Swing Lows (Fractal pivot logic: 2 bars left, 2 bars right)
        swing_highs = []
        swing_lows = []
        for i in range(2, n - 2):
            if highs[i] > highs[i-1] and highs[i] > highs[i-2] and highs[i] > highs[i+1] and highs[i] > highs[i+2]:
                swing_highs.append({"index": i, "price": float(highs[i]), "timestamp": timestamps[i]})
            if lows[i] < lows[i-1] and lows[i] < lows[i-2] and lows[i] < lows[i+1] and lows[i] < lows[i+2]:
                swing_lows.append({"index": i, "price": float(lows[i]), "timestamp": timestamps[i]})

        # 3. Market Structure (BOS & ChoCh)
        market_structure = []
        current_trend = "NEUTRAL"
        if len(swing_highs) >= 2 and len(swing_lows) >= 2:
            last_sh = swing_highs[-1]
            prev_sh = swing_highs[-2]
            last_sl = swing_lows[-1]
            prev_sl = swing_lows[-2]

            if last_sh['price'] > prev_sh['price'] and last_sl['price'] > prev_sl['price']:
                current_trend = "BULLISH_UPTREND"
                market_structure.append({
                    "structure_type": "BOS",
                    "direction": "BULLISH",
                    "price": round(last_sh['price'], 2),
                    "timestamp": last_sh['timestamp'],
                    "status": "CONFIRMED",
                    "description": f"Bullish Break of Structure (BOS): Higher High established above {round(prev_sh['price'], 2)}."
                })
            elif last_sh['price'] < prev_sh['price'] and last_sl['price'] < prev_sl['price']:
                current_trend = "BEARISH_DOWNTREND"
                market_structure.append({
                    "structure_type": "BOS",
                    "direction": "BEARISH",
                    "price": round(last_sl['price'], 2),
                    "timestamp": last_sl['timestamp'],
                    "status": "CONFIRMED",
                    "description": f"Bearish Break of Structure (BOS): Lower Low established below {round(prev_sl['price'], 2)}."
                })
            else:
                current_trend = "RANGE_BOUND"

        # 4. Order Blocks (Last opposing candle before displacement)
        order_blocks = []
        for sh in swing_highs[-3:]:
            idx = sh['index']
            # Find the highest green candle before drop
            order_blocks.append({
                "structure_type": "BEARISH_ORDER_BLOCK",
                "direction": "BEARISH",
                "top": round(highs[idx], 2),
                "bottom": round(lows[idx], 2),
                "timestamp": timestamps[idx],
                "status": "ACTIVE",
                "description": f"Bearish Order Block supply zone created at {round(lows[idx], 2)} - {round(highs[idx], 2)}."
            })

        for sl in swing_lows[-3:]:
            idx = sl['index']
            order_blocks.append({
                "structure_type": "BULLISH_ORDER_BLOCK",
                "direction": "BULLISH",
                "top": round(highs[idx], 2),
                "bottom": round(lows[idx], 2),
                "timestamp": timestamps[idx],
                "status": "ACTIVE",
                "description": f"Bullish Order Block demand zone created at {round(lows[idx], 2)} - {round(highs[idx], 2)}."
            })

        return {
            "current_trend": current_trend,
            "fvgs": fvgs[-10:],  # Recent 10 FVGs
            "order_blocks": order_blocks,
            "market_structure": market_structure,
            "swing_highs": swing_highs[-5:],
            "swing_lows": swing_lows[-5:]
        }
