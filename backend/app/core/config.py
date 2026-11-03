import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "Trading Intelligence Pro"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Secret Key for JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "trading_intelligence_pro_super_secret_key_2026_jwt_token_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trading_intelligence.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    # Target Market & Default Instruments (India NSE Focus)
    DEFAULT_EXCHANGE: str = "NSE"
    DEFAULT_SYMBOL: str = "RELIANCE.NS"
    SUPPORTED_INDICES: List[dict] = [
        {"symbol": "^NSEI", "name": "NIFTY 50", "category": "INDEX", "exchange": "NSE"},
        {"symbol": "^NSEBANK", "name": "BANK NIFTY", "category": "INDEX", "exchange": "NSE"},
        {"symbol": "^CNXIT", "name": "NIFTY IT", "category": "INDEX", "exchange": "NSE"},
        {"symbol": "^INDIAVIX", "name": "INDIA VIX", "category": "VOLATILITY", "exchange": "NSE"}
    ]

settings = Settings()
