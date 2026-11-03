import math
from typing import Dict, List, Any
from app.schemas.market import RiskCalculationRequest, RiskCalculationResponse

class RiskEngine:
    """
    Institutional Risk Management & Trade Planning Engine.
    Computes precise lot/position sizing, reward-to-risk ratio,
    and statutory Indian market costs (NSE charges, STT, GST, SEBI fee, Stamp duty).
    """

    @staticmethod
    def calculate_position_size(req: RiskCalculationRequest) -> RiskCalculationResponse:
        entry = req.entry_price
        sl = req.stop_loss
        target = req.target
        capital = req.account_capital
        risk_pct = req.risk_percentage
        lot_size = req.lot_size if req.lot_size > 0 else 1

        # Validation
        if entry <= 0 or sl <= 0 or target <= 0 or capital <= 0:
            raise ValueError("All price and capital inputs must be strictly positive.")

        direction = req.direction.upper()
        if direction == "LONG":
            risk_per_share = entry - sl
            reward_per_share = target - entry
        else:
            risk_per_share = sl - entry
            reward_per_share = entry - target

        if risk_per_share <= 0:
            raise ValueError(f"Invalid stop loss for {direction} trade. For LONG, SL must be below entry. For SHORT, SL must be above entry.")

        reward_to_risk = round(reward_per_share / risk_per_share, 2) if risk_per_share > 0 else 0.0

        # Maximum monetary capital risk allowed for this trade
        allowed_risk_amt = (risk_pct / 100.0) * capital

        # Raw quantity based on risk budget
        raw_qty = allowed_risk_amt / risk_per_share

        # Constrain to lot size (floor to nearest lot)
        if lot_size > 1:
            lots = max(1, math.floor(raw_qty / lot_size))
            calculated_qty = lots * lot_size
        else:
            calculated_qty = max(1, math.floor(raw_qty))
            lots = 1

        monetary_risk = round(calculated_qty * risk_per_share, 2)
        monetary_reward = round(calculated_qty * reward_per_share, 2)
        total_position_val = round(calculated_qty * entry, 2)
        actual_risk_pct = round((monetary_risk / capital) * 100.0, 2)

        # Indian statutory charges calculation (NSE Intraday Equities Model)
        turnover = calculated_qty * (entry + target)
        brokerage = min(20.0, 0.0003 * (calculated_qty * entry)) + min(20.0, 0.0003 * (calculated_qty * target))
        stt = round(0.00025 * (calculated_qty * target), 2)  # STT on sell side for intraday
        exchange_turnover_fee = round(0.0000325 * turnover, 2)  # NSE charge 0.00325%
        sebi_charges = round(0.000001 * turnover, 2)  # ₹10 per crore
        stamp_duty = round(0.00003 * (calculated_qty * entry), 2)  # 0.003% on buy side
        gst = round(0.18 * (brokerage + exchange_turnover_fee + sebi_charges), 2)  # 18% GST

        total_costs = round(brokerage + stt + exchange_turnover_fee + sebi_charges + stamp_duty + gst, 2)

        warnings = []
        is_acceptable = True

        if actual_risk_pct > 2.0:
            warnings.append(f"High Capital Risk Warning: Trade risks {actual_risk_pct}% of capital (limit recommended: ≤ 1.5%).")
            is_acceptable = False

        if reward_to_risk < 1.5:
            warnings.append(f"Suboptimal Risk/Reward: R:R is {reward_to_risk}:1 (minimum recommended: ≥ 1.5:1).")

        if total_position_val > (capital * 5.0):
            warnings.append(f"Excessive Leverage: Position value (₹{total_position_val:,.2f}) exceeds 5x account capital.")
            is_acceptable = False

        return RiskCalculationResponse(
            symbol=req.symbol,
            direction=direction,
            entry_price=round(entry, 2),
            stop_loss=round(sl, 2),
            target=round(target, 2),
            risk_per_share=round(risk_per_share, 2),
            reward_per_share=round(reward_per_share, 2),
            risk_reward_ratio=reward_to_risk,
            calculated_quantity=calculated_qty,
            lots=lots,
            total_position_value=total_position_val,
            monetary_risk=monetary_risk,
            monetary_reward=monetary_reward,
            risk_pct_of_capital=actual_risk_pct,
            is_risk_acceptable=is_acceptable,
            warning_messages=warnings,
            estimated_brokerage_charges={
                "brokerage": round(brokerage, 2),
                "stt_ctt": stt,
                "exchange_turnover_charges": exchange_turnover_fee,
                "sebi_turnover_fee": sebi_charges,
                "stamp_duty": stamp_duty,
                "gst_18pct": gst,
                "total_estimated_charges": total_costs,
                "breakeven_points": round(total_costs / calculated_qty, 2) if calculated_qty > 0 else 0.0
            }
        )

risk_engine = RiskEngine()
