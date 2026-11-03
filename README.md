# Trading Intelligence Pro

An institutional-grade, full-stack AI financial analysis and trading terminal designed specifically for Indian Equity and Derivatives Markets (**NSE Equities, NIFTY 50, BANK NIFTY, Index & Stock F&O**), with an extensible architectural abstraction layer for global assets.

---

## 1. Core Principles & Architecture
- **Zero Fabrication**: All prices, market indices, OHLCV bars, and indicator readings are derived from real exchange data feeds or transparently tagged (`LIVE - NSE`, `EOD HISTORICAL`, `CACHED`).
- **Look-Ahead Bias Elimination**: All indicator series (SMA, EMA, Supertrend, Bollinger Bands, RSI, MACD, CPR) and pattern identification routines compute strictly over historical slices $t \le T_0$.
- **Integrated Risk Management**: Built-in institutional position sizing with precise Indian statutory regulatory deductions (Brokerage ₹20 cap, STT, Exchange Turnover charges, SEBI turnover fees, Stamp duty, and 18% GST).
- **Verified Trading Journal**: Transparent tracking of realized trades, win rates, and drawdowns directly from trade history.

---

## 2. Platform Modules & Features

### A. Market Overview & Watchlist
- **Top Indices Ticker**: Real-time NIFTY 50, BANK NIFTY, NIFTY IT, and INDIA VIX snapshots.
- **Market Breadth**: Real-time Advance/Decline ratio bar.
- **Searchable Instrument Master**: Master directory of NSE equities and indices (RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, SBIN, LT, ITC, etc.).

### B. Interactive Financial Charting Canvas
- High-performance, pixel-perfect HTML5 Canvas candlestick and volume engine.
- Timeframe switching: `1m`, `5m`, `15m`, `1h`, `1D`, `1W`.
- Chart styles: Candlestick, Heikin-Ashi, Line, and Area.
- Indicator Overlays with dynamic toggle controls:
  - SMA 20, SMA 50, SMA 200
  - Supertrend (10, 3) with dynamic green/red support & resistance trend bands
  - Central Pivot Range (CPR with Pivot, TC, BC, R1, S1, R2, S2)
  - Smart Money Concepts (SMC) Fair Value Gaps (FVG) highlight zones with unmitigated tracking
- Dynamic crosshair with real-time HUD showing Date, Open, High, Low, Close, Volume, and Change %.

### C. Technical Analysis & SMC Engine
- Automatic regime classification (`STRONG_BULLISH`, `STRONG_BEARISH`, `SIDEWAYS`).
- Rule-based Candlestick Pattern Detection (Hammer, Shooting Star, Bullish/Bearish Engulfing, Morning/Evening Star, Doji, Marubozu).
- Each pattern includes mathematical description, exact confirmation rules, and invalidation criteria.
- Smart Money Concepts (SMC):
  - Fair Value Gaps (FVG) with status tracking (`UNMITIGATED` vs `MITIGATED`).
  - Order Blocks (OB) demand & supply zones.
  - Break of Structure (BOS) & Change of Character (CHoCH).

### D. Trade Risk Planner & Position Calculator
- Real-time lot and share sizing based on user's capital and risk tolerance (e.g., 1%).
- Reward-to-Risk (R:R) computation.
- Comprehensive Indian statutory charges breakdown:
  - Brokerage (Flat ₹20 or 0.03%)
  - STT / CTT
  - Exchange Turnover Charges (0.00325%)
  - SEBI Turnover Fee (₹10 per crore)
  - Stamp Duty (0.003%)
  - GST (18%)
- Capital risk warnings and breakeven point calculation.
- One-click logging to Trading Journal.

### E. Additional Modules
- **SMC Scanner**: Multi-stock market structure matrix scanning top NSE instruments.
- **Options Chain & Greeks Analyzer**: Strike-wise option chain for NIFTY & BANK NIFTY with PCR and delta.
- **Strategy & Backtesting Lab**: Rule-based strategy formulation with historical equity curve simulation.
- **Trading Journal**: Performance metrics with win rate, profit factor, and maximum drawdown.

---

## 3. Quick Start & Execution

### One-Click Launch (Windows):
Double click `START_TRADING_PLATFORM.bat` in the project root directory.

### Manual Launch:

#### 1. Backend:
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

#### 2. Frontend:
```bash
cd frontend
npm run dev
```
Terminal interface available at: `http://localhost:5173`

#### 3. Run Unit Tests:
```bash
cd backend
python tests/test_engines.py
```
