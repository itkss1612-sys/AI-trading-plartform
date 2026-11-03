import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

class IndicatorEngine:
    """
    High-precision, look-ahead bias free technical indicator engine.
    Computes mathematical indicators strictly over historical slices [0..t].
    """

    @staticmethod
    def calculate_sma(series: pd.Series, period: int = 20) -> List[Optional[float]]:
        sma = series.rolling(window=period, min_periods=period).mean()
        return [None if np.isnan(v) else round(float(v), 2) for v in sma]

    @staticmethod
    def calculate_ema(series: pd.Series, period: int = 20) -> List[Optional[float]]:
        ema = series.ewm(span=period, adjust=False).mean()
        # Set values before the period to None to maintain consistency
        result = []
        for i, v in enumerate(ema):
            if i < period - 1:
                result.append(None)
            else:
                result.append(round(float(v), 2) if not np.isnan(v) else None)
        return result

    @staticmethod
    def calculate_wma(series: pd.Series, period: int = 20) -> List[Optional[float]]:
        weights = np.arange(1, period + 1)
        wma = series.rolling(period).apply(lambda prices: np.dot(prices, weights) / weights.sum(), raw=True)
        return [None if np.isnan(v) else round(float(v), 2) for v in wma]

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, period: int = 20, num_std: float = 2.0) -> Dict[str, List[Optional[float]]]:
        sma = series.rolling(window=period, min_periods=period).mean()
        std = series.rolling(window=period, min_periods=period).std()
        upper = sma + (std * num_std)
        lower = sma - (std * num_std)

        return {
            "middle": [None if np.isnan(v) else round(float(v), 2) for v in sma],
            "upper": [None if np.isnan(v) else round(float(v), 2) for v in upper],
            "lower": [None if np.isnan(v) else round(float(v), 2) for v in lower]
        }

    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> List[Optional[float]]:
        delta = series.diff()
        gain = delta.clip(lower=0)
        loss = -1 * delta.clip(upper=0)

        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()

        result = []
        for g, l in zip(avg_gain, avg_loss):
            if np.isnan(g) or np.isnan(l):
                result.append(None)
            elif l == 0:
                result.append(100.0 if g > 0 else 50.0)
            elif g == 0:
                result.append(0.0)
            else:
                rs = g / l
                rsi = 100.0 - (100.0 / (1.0 + rs))
                result.append(round(float(rsi), 2))
        return result

    @staticmethod
    def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[Optional[float]]]:
        fast_ema = series.ewm(span=fast, adjust=False).mean()
        slow_ema = series.ewm(span=slow, adjust=False).mean()
        macd_line = fast_ema - slow_ema
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line

        return {
            "macd": [round(float(v), 2) if not np.isnan(v) else None for v in macd_line],
            "signal": [round(float(v), 2) if not np.isnan(v) else None for v in signal_line],
            "histogram": [round(float(v), 2) if not np.isnan(v) else None for v in histogram]
        }

    @staticmethod
    def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> List[Optional[float]]:
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.ewm(alpha=1/period, adjust=False).mean()

        result = []
        for i, v in enumerate(atr):
            if i < period - 1:
                result.append(None)
            else:
                result.append(round(float(v), 2) if not np.isnan(v) else None)
        return result

    @staticmethod
    def calculate_supertrend(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 10, multiplier: float = 3.0) -> Dict[str, Any]:
        """
        Supertrend indicator calculation:
        Returns:
            supertrend: series of price values
            direction: 1 for bullish (green, below price), -1 for bearish (red, above price)
        """
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.ewm(alpha=1/period, adjust=False).mean()

        hl2 = (high + low) / 2
        upper_band = hl2 + (multiplier * atr)
        lower_band = hl2 - (multiplier * atr)

        st = [0.0] * len(close)
        direction = [1] * len(close)

        for i in range(1, len(close)):
            c = close.iloc[i]
            prev_st = st[i - 1]
            prev_dir = direction[i - 1]
            curr_ub = upper_band.iloc[i]
            curr_lb = lower_band.iloc[i]

            if prev_dir == 1:
                # Bullish
                if c < lower_band.iloc[i]:
                    direction[i] = -1
                    st[i] = curr_ub
                else:
                    direction[i] = 1
                    st[i] = max(curr_lb, prev_st) if prev_st > 0 else curr_lb
            else:
                # Bearish
                if c > upper_band.iloc[i]:
                    direction[i] = 1
                    st[i] = curr_lb
                else:
                    direction[i] = -1
                    st[i] = min(curr_ub, prev_st) if prev_st > 0 else curr_ub

        # Clear initial warmup values
        supertrend_vals = []
        direction_vals = []
        for i in range(len(close)):
            if i < period:
                supertrend_vals.append(None)
                direction_vals.append(None)
            else:
                supertrend_vals.append(round(float(st[i]), 2))
                direction_vals.append(int(direction[i]))

        return {
            "supertrend": supertrend_vals,
            "direction": direction_vals
        }

    @staticmethod
    def calculate_vwap(high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series) -> List[Optional[float]]:
        typical_price = (high + low + close) / 3.0
        cum_vol_price = (typical_price * volume).cumsum()
        cum_vol = volume.cumsum()
        vwap = cum_vol_price / cum_vol.replace(0, np.nan)
        return [round(float(v), 2) if not np.isnan(v) else None for v in vwap]

    @staticmethod
    def calculate_cpr(high_prev: float, low_prev: float, close_prev: float) -> Dict[str, float]:
        """
        Central Pivot Range (CPR) for Indian Intraday Trading:
        Pivot = (High + Low + Close) / 3
        Bottom Central (BC) = (High + Low) / 2
        Top Central (TC) = (Pivot - BC) + Pivot
        """
        pivot = (high_prev + low_prev + close_prev) / 3.0
        bc = (high_prev + low_prev) / 2.0
        tc = (pivot - bc) + pivot
        
        # Ensure TC is higher than BC in naming convention if flipped
        real_tc = max(tc, bc)
        real_bc = min(tc, bc)

        r1 = (2 * pivot) - low_prev
        s1 = (2 * pivot) - high_prev
        r2 = pivot + (high_prev - low_prev)
        s2 = pivot - (high_prev - low_prev)
        r3 = high_prev + 2 * (pivot - low_prev)
        s3 = low_prev - 2 * (high_prev - pivot)

        return {
            "pivot": round(pivot, 2),
            "tc": round(real_tc, 2),
            "bc": round(real_bc, 2),
            "r1": round(r1, 2),
            "s1": round(s1, 2),
            "r2": round(r2, 2),
            "s2": round(s2, 2),
            "r3": round(r3, 2),
            "s3": round(s3, 2),
            "cpr_width_pct": round(abs(real_tc - real_bc) / pivot * 100, 3)
        }
