from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.entities import User, TradingJournal
from app.schemas.user import JournalEntryCreate, JournalEntryResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/journal", tags=["Trading Journal"])

@router.get("", response_model=List[JournalEntryResponse])
def get_journal_entries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve all logged trades for the user."""
    entries = db.query(TradingJournal).filter(TradingJournal.user_id == current_user.id).order_by(TradingJournal.trade_date.desc()).all()
    return [JournalEntryResponse.model_validate(e) for e in entries]

@router.post("", response_model=JournalEntryResponse)
def log_trade(entry_in: JournalEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log a completed or open trade."""
    if entry_in.direction.upper() == "LONG":
        gross_pnl = (entry_in.exit_price - entry_in.entry_price) * entry_in.quantity
    else:
        gross_pnl = (entry_in.entry_price - entry_in.exit_price) * entry_in.quantity

    net_pnl = round(gross_pnl - (entry_in.charges or 0.0), 2)

    entry = TradingJournal(
        user_id=current_user.id,
        trade_date=datetime.now(timezone.utc),
        symbol=entry_in.symbol,
        exchange=entry_in.exchange or "NSE",
        direction=entry_in.direction.upper(),
        entry_price=entry_in.entry_price,
        exit_price=entry_in.exit_price,
        quantity=entry_in.quantity,
        stop_loss=entry_in.stop_loss or 0.0,
        target=entry_in.target or 0.0,
        net_pnl=net_pnl,
        charges=entry_in.charges or 0.0,
        setup_type=entry_in.setup_type or "Breakout",
        timeframe=entry_in.timeframe or "15m",
        notes=entry_in.notes or "",
        screenshot_url=entry_in.screenshot_url or ""
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return JournalEntryResponse.model_validate(entry)

@router.get("/metrics")
def get_journal_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Calculate authentic verified statistics from logged trades without fabricated claims."""
    entries = db.query(TradingJournal).filter(TradingJournal.user_id == current_user.id).all()
    if not entries:
        return {
            "total_trades": 0,
            "win_rate_pct": 0.0,
            "total_net_pnl": 0.0,
            "avg_win": 0.0,
            "avg_loss": 0.0,
            "profit_factor": 0.0,
            "max_drawdown": 0.0,
            "message": "No recorded trades yet. Log actual trades to see verified statistics."
        }

    total_trades = len(entries)
    winning_trades = [e.net_pnl for e in entries if e.net_pnl > 0]
    losing_trades = [abs(e.net_pnl) for e in entries if e.net_pnl < 0]

    win_count = len(winning_trades)
    win_rate = round((win_count / total_trades) * 100.0, 1)

    total_net_pnl = round(sum(e.net_pnl for e in entries), 2)
    avg_win = round(sum(winning_trades) / win_count, 2) if win_count > 0 else 0.0
    avg_loss = round(sum(losing_trades) / len(losing_trades), 2) if losing_trades else 0.0

    sum_wins = sum(winning_trades)
    sum_losses = sum(losing_trades)
    profit_factor = round(sum_wins / sum_losses, 2) if sum_losses > 0 else (99.0 if sum_wins > 0 else 0.0)

    # Compute peak-to-trough drawdown from cumulative PnL
    cum_pnl = 0.0
    peak = 0.0
    max_dd = 0.0
    for e in entries:
        cum_pnl += e.net_pnl
        if cum_pnl > peak:
            peak = cum_pnl
        dd = peak - cum_pnl
        if dd > max_dd:
            max_dd = dd

    return {
        "total_trades": total_trades,
        "win_count": win_count,
        "loss_count": len(losing_trades),
        "win_rate_pct": win_rate,
        "total_net_pnl": total_net_pnl,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "profit_factor": profit_factor,
        "max_drawdown": round(max_dd, 2)
    }
