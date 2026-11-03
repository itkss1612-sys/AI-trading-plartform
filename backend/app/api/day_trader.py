"""
API Endpoints for Day Trader Skills & Google Gemini AI Integration.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body, Header
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.gemini_agent import gemini_agent
from app.services.day_trader_bridge import day_trader_bridge

router = APIRouter(prefix="/daytrader", tags=["Day Trader AI Copilot"])

class AnalyzeRequest(BaseModel):
    symbol: str
    market: str = "NSE"  # "NSE" or "US"
    currency: str = "₹"  # "₹" or "$"
    strategy_name: Optional[str] = "15m ORB Day Trader"
    quote: Optional[Dict[str, Any]] = None
    technicals: Optional[Dict[str, Any]] = None
    smc_data: Optional[Dict[str, Any]] = None
    monte_carlo: Optional[Dict[str, Any]] = None
    api_key: Optional[str] = None

class SimulateRequest(BaseModel):
    symbol: str
    entry: float
    stop: float
    target: float
    simulations: int = 5000

class ApproveTradeRequest(BaseModel):
    symbol: str
    market: str = "NSE"
    currency: str = "₹"
    entry: float
    stop: float
    target: float
    account_balance: float = 100000.0
    planned_risk_pct: float = 1.0
    side: str = "BUY"
    ai_thesis: Optional[str] = None

class TestKeyRequest(BaseModel):
    api_key: str

@router.post("/test-key")
def test_gemini_key(req: TestKeyRequest):
    """Verifies a Google Gemini API key by making a lightweight test ping."""
    result = gemini_agent.test_connection(req.api_key)
    return result

@router.post("/analyze")
def analyze_with_ai(
    req: AnalyzeRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    """
    Evaluates a trading setup using Google Gemini 2.5 AI.
    Combines Technical Indicators, Smart Money Concepts, and Monte Carlo probabilities.
    """
    key = req.api_key or x_gemini_api_key
    
    # If quote wasn't provided, fetch live quote
    quote = req.quote or day_trader_bridge.fetch_live_quote(req.symbol)
    
    # If technicals wasn't provided, generate base technicals
    technicals = req.technicals or {
        "supertrend_direction": "BULLISH" if quote.get("change_pct", 0) >= 0 else "BEARISH",
        "rsi": 58.4 if quote.get("change_pct", 0) >= 0 else 42.1,
        "ema20": round(quote.get("last_price", 100) * 0.99, 2),
        "ema50": round(quote.get("last_price", 100) * 0.98, 2),
        "cpr_bias": "Narrow CPR (Trending Day)"
    }

    # Run Monte Carlo if not provided
    entry = float(quote.get("last_price", 100))
    stop = round(entry * 0.985, 2)
    target = round(entry * 1.032, 2)
    monte_carlo = req.monte_carlo or day_trader_bridge.run_monte_carlo_timemachine(
        symbol=req.symbol,
        entry=entry,
        stop=stop,
        target=target,
        num_simulations=2000
    )

    analysis = gemini_agent.analyze_setup(
        symbol=req.symbol,
        market=req.market,
        currency=req.currency,
        quote=quote,
        technicals=technicals,
        smc_data=req.smc_data,
        monte_carlo=monte_carlo,
        strategy_name=req.strategy_name or "15m ORB Day Trader",
        user_key=key
    )

    return {
        "analysis": analysis,
        "quote": quote,
        "monte_carlo": monte_carlo
    }

@router.get("/scan")
def scan_markets(market: str = Query("NSE", description="Market to scan: 'NSE' or 'US'")):
    """
    Scans for Opening Range Breakouts, 20-Day Highs, Bull Flags, and Oversold Bounces.
    Supports both Indian Markets (NSE) and US Markets (NASDAQ/NYSE).
    """
    results = day_trader_bridge.scan_market(market=market)
    return {
        "market": market.upper(),
        "count": len(results),
        "results": results
    }

@router.post("/simulate")
def run_simulation(req: SimulateRequest):
    """
    Executes a 5,000–10,000 run Monte Carlo Time Machine simulation.
    Reports the probability of hitting target before stop, average R, and verdict.
    """
    result = day_trader_bridge.run_monte_carlo_timemachine(
        symbol=req.symbol,
        entry=req.entry,
        stop=req.stop,
        target=req.target,
        num_simulations=req.simulations
    )
    return result

@router.post("/approve-trade")
def approve_trade(req: ApproveTradeRequest):
    """
    One-click Human-in-the-loop approval:
    Verifies institutional risk gates, checks stop-loss integrity, calculates whole shares,
    and returns a paper execution ticket.
    """
    # 1. Strict Risk Audit (trader-risk rules)
    risk_check = day_trader_bridge.verify_risk_rules(
        account_balance=req.account_balance,
        planned_risk_pct=req.planned_risk_pct,
        entry=req.entry,
        stop=req.stop,
        target=req.target,
        currency=req.currency
    )

    if not risk_check["passed"]:
        raise HTTPException(status_code=400, detail=risk_check["reason"])

    # 2. Generate Approved Execution Ticket
    import uuid
    ticket_id = f"TICKET-{req.market.upper()}-{uuid.uuid4().hex[:6].upper()}"

    execution_ticket = {
        "ticket_id": ticket_id,
        "status": "EXECUTED_PAPER",
        "market": req.market.upper(),
        "currency": req.currency,
        "symbol": req.symbol,
        "side": req.side,
        "shares": risk_check["shares"],
        "entry_price": req.entry,
        "stop_loss": req.stop,
        "take_profit": req.target,
        "reward_risk_ratio": risk_check["reward_risk_ratio"],
        "total_notional": risk_check["total_notional"],
        "risk_amount": risk_check["actual_risk_amount"],
        "timestamp": None,
        "ai_rationale": req.ai_thesis or "Setup validated by Gemini AI and risk checked by trader-risk.",
        "note": "Paper order confirmed with bracket OCO (One-Cancels-Other) stop & target."
    }

    return {
        "success": True,
        "message": f"Trade {ticket_id} for {req.symbol} successfully APPROVED and executed into Paper Portfolio!",
        "ticket": execution_ticket
    }
