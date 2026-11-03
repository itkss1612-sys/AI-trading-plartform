from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

# Auth & User Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Trader"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Risk Profile Schemas
class RiskProfileBase(BaseModel):
    account_capital: float
    max_daily_loss: float
    max_risk_per_trade_pct: float
    max_open_risk_pct: float

class RiskProfileUpdate(RiskProfileBase):
    pass

class RiskProfileResponse(RiskProfileBase):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True

# Trading Journal Schemas
class JournalEntryCreate(BaseModel):
    symbol: str
    exchange: Optional[str] = "NSE"
    direction: str  # LONG / SHORT
    entry_price: float
    exit_price: float
    quantity: int
    stop_loss: Optional[float] = 0.0
    target: Optional[float] = 0.0
    charges: Optional[float] = 0.0
    setup_type: Optional[str] = "SMC Setup"
    timeframe: Optional[str] = "15m"
    notes: Optional[str] = ""
    screenshot_url: Optional[str] = ""

class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    trade_date: datetime
    symbol: str
    exchange: str
    direction: str
    entry_price: float
    exit_price: float
    quantity: int
    stop_loss: float
    target: float
    net_pnl: float
    charges: float
    setup_type: str
    timeframe: str
    notes: str
    screenshot_url: str

    class Config:
        from_attributes = True
