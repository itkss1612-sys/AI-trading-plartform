import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), default="Trader")
    role = Column(String(20), default="PRO_TRADER")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("TradingJournal", back_populates="user", cascade="all, delete-orphan")
    risk_profile = relationship("RiskProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    strategies = relationship("SavedStrategy", back_populates="user", cascade="all, delete-orphan")

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), default="Primary Watchlist")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    watchlist_id = Column(String(36), ForeignKey("watchlists.id"), nullable=False)
    symbol = Column(String(50), nullable=False)
    exchange = Column(String(20), default="NSE")
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    watchlist = relationship("Watchlist", back_populates="items")

class RiskProfile(Base):
    __tablename__ = "risk_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    account_capital = Column(Float, default=500000.0)  # INR 5 Lakh default
    max_daily_loss = Column(Float, default=15000.0)    # INR 15k limit
    max_risk_per_trade_pct = Column(Float, default=1.5) # 1.5% max risk
    max_open_risk_pct = Column(Float, default=5.0)     # 5.0% total open risk
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="risk_profile")

class TradingJournal(Base):
    __tablename__ = "trading_journal"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    trade_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    symbol = Column(String(50), nullable=False)
    exchange = Column(String(20), default="NSE")
    direction = Column(String(10), default="LONG")  # LONG / SHORT
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    stop_loss = Column(Float, default=0.0)
    target = Column(Float, default=0.0)
    net_pnl = Column(Float, nullable=False)
    charges = Column(Float, default=0.0)
    setup_type = Column(String(100), default="SMC Order Block Retest")
    timeframe = Column(String(20), default="15m")
    notes = Column(Text, default="")
    screenshot_url = Column(String(500), default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="journal_entries")

class SavedStrategy(Base):
    __tablename__ = "saved_strategies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    entry_rules = Column(JSON, default=dict)
    exit_rules = Column(JSON, default=dict)
    risk_settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="strategies")
