from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.risk_engine import risk_engine
from app.schemas.market import RiskCalculationRequest, RiskCalculationResponse
from app.schemas.user import RiskProfileResponse, RiskProfileUpdate
from app.api.auth import get_current_user
from app.models.entities import User, RiskProfile

router = APIRouter(prefix="/risk", tags=["Risk Management & Trade Planning"])

@router.post("/calculate", response_model=RiskCalculationResponse)
def calculate_trade_risk(req: RiskCalculationRequest):
    """
    Computes exact position size, lot allocation, reward-to-risk ratio,
    and statutory Indian market brokerage & tax deductions.
    """
    try:
        return risk_engine.calculate_position_size(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile", response_model=RiskProfileResponse)
def get_risk_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve user risk profile limits and capital allocation."""
    profile = db.query(RiskProfile).filter(RiskProfile.user_id == current_user.id).first()
    if not profile:
        profile = RiskProfile(user_id=current_user.id, account_capital=500000.0, max_daily_loss=15000.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return RiskProfileResponse.model_validate(profile)

@router.put("/profile", response_model=RiskProfileResponse)
def update_risk_profile(update_in: RiskProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update risk limits and trading parameters."""
    profile = db.query(RiskProfile).filter(RiskProfile.user_id == current_user.id).first()
    if not profile:
        profile = RiskProfile(user_id=current_user.id)
        db.add(profile)

    profile.account_capital = update_in.account_capital
    profile.max_daily_loss = update_in.max_daily_loss
    profile.max_risk_per_trade_pct = update_in.max_risk_per_trade_pct
    profile.max_open_risk_pct = update_in.max_open_risk_pct

    db.commit()
    db.refresh(profile)
    return RiskProfileResponse.model_validate(profile)
