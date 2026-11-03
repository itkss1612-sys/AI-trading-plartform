from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.market_data import market_data_provider
from app.schemas.market import MarketOverviewResponse, InstrumentItem, Quote, Candle
from app.api.auth import get_current_user
from app.models.entities import User, Watchlist, WatchlistItem

router = APIRouter(prefix="/market", tags=["Market Data"])

@router.get("/overview", response_model=MarketOverviewResponse)
def get_market_overview():
    """Returns top Indian indices, advance/decline stats, and market feed health."""
    return market_data_provider.get_market_overview()

@router.get("/instruments", response_model=List[InstrumentItem])
def search_instruments(q: Optional[str] = Query(None, description="Search query")):
    """Search master directory of Indian stocks and indices."""
    return market_data_provider.get_instruments(q)

@router.get("/quote", response_model=Quote)
def get_quote(symbol: str = Query(..., description="Instrument symbol, e.g., RELIANCE.NS, ^NSEI")):
    """Get snapshot quote with transparent data feed status."""
    return market_data_provider.fetch_quote(symbol)

@router.get("/history", response_model=List[Candle])
def get_history(
    symbol: str = Query(..., description="Instrument symbol, e.g. RELIANCE.NS"),
    interval: str = Query("1d", description="Interval: 1m, 5m, 15m, 1h, 1d, 1wk"),
    range_param: str = Query("3mo", description="Range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y")
):
    """Fetches verified OHLCV historical candlestick data."""
    df = market_data_provider.fetch_ohlcv(symbol, interval=interval, range_param=range_param)
    candles = []
    for _, row in df.iterrows():
        candles.append(Candle(
            timestamp=int(row["timestamp"]),
            datetime_str=str(row["datetime_str"]),
            open=float(row["open"]),
            high=float(row["high"]),
            low=float(row["low"]),
            close=float(row["close"]),
            volume=float(row["volume"])
        ))
    return candles

@router.get("/watchlist")
def get_user_watchlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns user watchlist with live quotes."""
    wl = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).first()
    if not wl:
        return []
    
    quotes = []
    for item in wl.items:
        q = market_data_provider.fetch_quote(item.symbol)
        quotes.append({
            "symbol": q.symbol,
            "name": q.name,
            "exchange": q.exchange,
            "last_price": q.last_price,
            "change": q.change,
            "change_pct": q.change_pct,
            "high": q.high,
            "low": q.low,
            "volume": q.volume,
            "data_status": q.data_status
        })
    return quotes

@router.post("/watchlist/add")
def add_to_watchlist(symbol: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add an instrument to user's primary watchlist."""
    wl = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).first()
    if not wl:
        wl = Watchlist(user_id=current_user.id, name="Default Watchlist", is_default=True)
        db.add(wl)
        db.commit()
        db.refresh(wl)

    existing = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == wl.id, WatchlistItem.symbol == symbol).first()
    if existing:
        return {"message": "Symbol already in watchlist", "symbol": symbol}

    item = WatchlistItem(watchlist_id=wl.id, symbol=symbol, exchange="NSE")
    db.add(item)
    db.commit()
    return {"message": "Symbol added to watchlist", "symbol": symbol}

@router.delete("/watchlist/remove")
def remove_from_watchlist(symbol: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove symbol from user watchlist."""
    wl = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).first()
    if not wl:
        return {"message": "No watchlist found"}

    item = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == wl.id, WatchlistItem.symbol == symbol).first()
    if item:
        db.delete(item)
        db.commit()
        return {"message": "Symbol removed", "symbol": symbol}
    return {"message": "Symbol not found in watchlist"}
