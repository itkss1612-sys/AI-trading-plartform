import pandas as pd
import numpy as np
from app.services.indicator_engine import IndicatorEngine
from app.services.pattern_engine import PatternEngine
from app.services.risk_engine import risk_engine
from app.schemas.market import RiskCalculationRequest

def test_sma_calculation():
    series = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    sma = IndicatorEngine.calculate_sma(series, period=3)
    # Window of 3: index 0 and 1 should be None, index 2 should be (10+20+30)/3 = 20.0
    assert sma[0] is None
    assert sma[1] is None
    assert sma[2] == 20.0
    assert sma[3] == 30.0
    assert sma[4] == 40.0

def test_rsi_bounds():
    # Strict 14-period RSI must always be within [0, 100]
    prices = [100 + i * 2 for i in range(30)]
    series = pd.Series(prices)
    rsi = IndicatorEngine.calculate_rsi(series, period=14)
    valid_rsi = [r for r in rsi if r is not None]
    assert len(valid_rsi) > 0
    for r in valid_rsi:
        assert 0.0 <= r <= 100.0

def test_cpr_calculation():
    # High: 1000, Low: 900, Close: 950
    # Pivot = (1000 + 900 + 950) / 3 = 950.0
    # BC = (1000 + 900) / 2 = 950.0
    # TC = (950 - 950) + 950 = 950.0
    cpr = IndicatorEngine.calculate_cpr(1000.0, 900.0, 950.0)
    assert cpr["pivot"] == 950.0
    assert cpr["tc"] == 950.0
    assert cpr["bc"] == 950.0
    assert cpr["r1"] == 2 * 950.0 - 900.0  # 1000.0
    assert cpr["s1"] == 2 * 950.0 - 1000.0 # 900.0

def test_risk_management_position_sizing():
    req = RiskCalculationRequest(
        symbol="RELIANCE.NS",
        direction="LONG",
        entry_price=2500.0,
        stop_loss=2450.0,     # Risk per share = 50
        target=2600.0,        # Reward per share = 100
        account_capital=500000.0,
        risk_percentage=1.0,  # 1% = 5000 max risk
        lot_size=1
    )
    res = risk_engine.calculate_position_size(req)
    assert res.risk_per_share == 50.0
    assert res.reward_per_share == 100.0
    assert res.risk_reward_ratio == 2.0
    assert res.calculated_quantity == 100
    assert res.monetary_risk == 5000.0
    assert res.monetary_reward == 10000.0
    assert res.estimated_brokerage_charges["total_estimated_charges"] > 0
    assert res.is_risk_acceptable == True

def test_candlestick_hammer_detection():
    # Create test candles where candle 3 is a hammer: small body at high, long lower wick
    records = [
        {"open": 100.0, "high": 102.0, "low": 98.0, "close": 99.0, "datetime_str": "T0"},
        {"open": 99.0, "high": 101.0, "low": 97.0, "close": 98.0, "datetime_str": "T1"},
        {"open": 96.0, "high": 98.0, "low": 90.0, "close": 97.5, "datetime_str": "T2"},  # Hammer (body 1.5, lower shadow 6.0, upper shadow 0.5)
    ]
    df = pd.DataFrame(records)
    patterns = PatternEngine.detect_candlestick_patterns(df)
    hammer_matches = [p for p in patterns if "Hammer" in p["pattern_name"]]
    assert len(hammer_matches) >= 1
    assert hammer_matches[0]["direction"] == "BULLISH"
    assert hammer_matches[0]["reliability"] == "HIGH"

if __name__ == "__main__":
    test_sma_calculation()
    test_rsi_bounds()
    test_cpr_calculation()
    test_risk_management_position_sizing()
    test_candlestick_hammer_detection()
    print("ALL UNIT TESTS PASSED SUCCESSFULLY!")
