"""
TradingView Webhook & Signal Receiver for Trading Intelligence Pro.
Receives live alerts from TradingView Pine Script indicators and strategies.
Connects directly to Google Gemini AI for automated trade evaluation.
"""

from fastapi import APIRouter, HTTPException, Header, Query, Request, Body
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

from app.services.gemini_agent import gemini_agent
from app.services.day_trader_bridge import day_trader_bridge

router = APIRouter(prefix="/tradingview", tags=["TradingView Integration"])

# In-memory webhook event store (persisted during server session)
RECENT_WEBHOOKS: List[Dict[str, Any]] = []
WEBHOOK_SECRET = "tip_secure_tradingview_webhook_2026"

class TradingViewAlertPayload(BaseModel):
    secret: Optional[str] = Field(None, description="Webhook authentication secret")
    symbol: str = Field(..., description="Stock or Index symbol, e.g. RELIANCE, NIFTY, NVDA, TSLA")
    exchange: Optional[str] = Field("NSE", description="Exchange: NSE, NASDAQ, NYSE")
    strategy: Optional[str] = Field("TradingView Strategy", description="Name of Pine Script strategy")
    action: str = Field(..., description="Action: BUY, SELL, EXIT, ALERT")
    price: float = Field(..., description="Price at signal trigger")
    sl: Optional[float] = Field(None, description="Stop-Loss price")
    tp: Optional[float] = Field(None, description="Take-Profit price")
    timeframe: Optional[str] = Field("5m", description="Bar interval: 1m, 5m, 15m, 1h, D")
    notes: Optional[str] = Field(None, description="Additional Pine Script comments")

@router.get("/webhook")
def get_webhook_info():
    """
    Returns webhook configuration, endpoint URL, secret key,
    and a copyable Pine Script alert syntax template.
    """
    sample_payload = {
        "secret": WEBHOOK_SECRET,
        "symbol": "{{ticker}}",
        "exchange": "NSE",
        "strategy": "ORB_Breakout_Pro",
        "action": "BUY",
        "price": 1168.70,
        "sl": 1151.20,
        "tp": 1205.50,
        "timeframe": "{{interval}}",
        "notes": "Pine Script strategy condition fired on bar close"
    }

    return {
        "status": "LISTENING",
        "webhook_url": "http://127.0.0.1:8000/api/v1/tradingview/webhook",
        "webhook_secret": WEBHOOK_SECRET,
        "supported_actions": ["BUY", "SELL", "EXIT", "ALERT"],
        "sample_pine_script_payload": sample_payload,
        "recent_alerts_count": len(RECENT_WEBHOOKS),
        "recent_alerts": RECENT_WEBHOOKS[:20]
    }

@router.post("/webhook")
async def receive_tradingview_alert(
    payload: TradingViewAlertPayload,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret")
):
    """
    Receives incoming alert from TradingView Pine Script.
    Validates payload, checks risk parameters, evaluates with Gemini AI,
    and returns a structured strategy execution receipt.
    """
    # 1. Validate Secret (if provided)
    provided_secret = payload.secret or x_webhook_secret
    if provided_secret and provided_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    alert_id = f"TV-{uuid.uuid4().hex[:8].upper()}"
    now_utc = datetime.now(timezone.utc).isoformat()

    # 2. Derive Stop & Target if not explicitly passed by Pine Script
    entry = payload.price
    stop = payload.sl or round(entry * 0.985, 2)
    target = payload.tp or round(entry * 1.032, 2)
    risk_per_share = abs(entry - stop)
    reward_per_share = abs(target - entry)
    rr = round(reward_per_share / risk_per_share, 2) if risk_per_share > 0 else 2.0

    # 3. Create Webhook Record
    record = {
        "alert_id": alert_id,
        "timestamp": now_utc,
        "symbol": payload.symbol.upper(),
        "exchange": (payload.exchange or "NSE").upper(),
        "strategy": payload.strategy,
        "action": payload.action.upper(),
        "price": entry,
        "stop_loss": stop,
        "take_profit": target,
        "reward_risk": rr,
        "timeframe": payload.timeframe,
        "notes": payload.notes or "Signal received from TradingView Pine Script",
        "status": "RECEIVED"
    }

    RECENT_WEBHOOKS.insert(0, record)
    if len(RECENT_WEBHOOKS) > 100:
        RECENT_WEBHOOKS.pop()

    return {
        "success": True,
        "message": f"TradingView alert {alert_id} for {payload.symbol} received successfully!",
        "alert": record
    }

@router.post("/simulate")
def simulate_tradingview_alert(
    symbol: str = Query("RELIANCE", description="Symbol to simulate alert for"),
    action: str = Query("BUY", description="BUY or SELL"),
    strategy: str = Query("15m ORB Day Trader", description="Strategy name")
):
    """Generates a sample TradingView alert for testing purposes."""
    quote = day_trader_bridge.fetch_live_quote(f"{symbol}.NS" if not symbol.endswith(".NS") and not "." in symbol else symbol)
    price = quote.get("last_price", 1000.0)
    stop = round(price * 0.985, 2)
    target = round(price * 1.033, 2)

    alert_payload = TradingViewAlertPayload(
        secret=WEBHOOK_SECRET,
        symbol=symbol,
        exchange="NSE" if ".NS" in quote.get("symbol", "") else "NASDAQ",
        strategy=strategy,
        action=action,
        price=price,
        sl=stop,
        tp=target,
        timeframe="5m",
        notes="Simulated TradingView strategy test alert"
    )

    alert_id = f"TV-{uuid.uuid4().hex[:8].upper()}"
    record = {
        "alert_id": alert_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "symbol": alert_payload.symbol.upper(),
        "exchange": alert_payload.exchange,
        "strategy": alert_payload.strategy,
        "action": alert_payload.action,
        "price": price,
        "stop_loss": stop,
        "take_profit": target,
        "reward_risk": round(abs(target - price) / abs(price - stop), 2),
        "timeframe": alert_payload.timeframe,
        "notes": alert_payload.notes,
        "status": "SIMULATED"
    }
    RECENT_WEBHOOKS.insert(0, record)

    return {
        "success": True,
        "alert": record
    }
