from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.entities import User, RiskProfile, Watchlist, WatchlistItem
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        # Default demo trader user for instant frictionless terminal experience if unauthenticated
        demo_user = db.query(User).filter(User.email == "demo@tradingintelpro.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@tradingintelpro.com",
                hashed_password=get_password_hash("DemoTrader@2026"),
                full_name="Institutional Trader",
                role="PRO_TRADER"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            # Add default risk profile
            rp = RiskProfile(user_id=demo_user.id, account_capital=1000000.0, max_daily_loss=25000.0)
            db.add(rp)
            # Add default watchlist
            wl = Watchlist(user_id=demo_user.id, name="NIFTY Core", is_default=True)
            db.add(wl)
            db.commit()
            db.refresh(wl)
            for sym in ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "^NSEI"]:
                db.add(WatchlistItem(watchlist_id=wl.id, symbol=sym, exchange="NSE"))
            db.commit()
        return demo_user

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or "Trader",
        role="PRO_TRADER"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default risk profile and watchlist
    rp = RiskProfile(user_id=user.id, account_capital=500000.0, max_daily_loss=15000.0)
    db.add(rp)

    wl = Watchlist(user_id=user.id, name="Default Watchlist", is_default=True)
    db.add(wl)
    db.commit()
    db.refresh(wl)

    for sym in ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "^NSEI", "^NSEBANK"]:
        db.add(WatchlistItem(watchlist_id=wl.id, symbol=sym, exchange="NSE"))
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token({"sub": user.id, "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
