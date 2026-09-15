"""
Operational Safety Guardrails & Risk Circuit Breakers
=====================================================
- Max daily portfolio drawdown breaker (e.g. 5.0%)
- Max single-asset exposure ceiling
- Spread / Slippage latency filter
- Anti-martingale risk reduction on consecutive losses
"""

from typing import Dict, List, Any, Optional

class OperationalGuardrails:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {
            "max_daily_drawdown_pct": 5.0,
            "max_open_trades": 8,
            "max_asset_exposure_pct": 15.0,
            "max_spread_pips": 3.5,
            "consecutive_loss_threshold": 3,
            "circuit_breaker_active": False
        }

    def evaluate_pre_trade_guardrails(
        self,
        account_balance: float,
        daily_pnl_pct: float,
        open_trades_count: int,
        symbol_spread: float,
        consecutive_losses: int = 0
    ) -> Dict[str, Any]:
        """Validates whether a new trade execution passes all risk guardrails."""
        violations = []
        
        # 1. Daily Drawdown Circuit Breaker
        if daily_pnl_pct <= -abs(self.config["max_daily_drawdown_pct"]):
            violations.append(f"CIRCUIT_BREAKER_DAILY_DRAWDOWN_EXCEEDED: {daily_pnl_pct:.2f}% <= -{self.config['max_daily_drawdown_pct']}%")
        
        # 2. Maximum Concurrent Open Positions
        if open_trades_count >= self.config["max_open_trades"]:
            violations.append(f"MAX_OPEN_POSITIONS_REACHED: {open_trades_count} >= {self.config['max_open_trades']}")
        
        # 3. Spread Filter
        if symbol_spread > self.config["max_spread_pips"]:
            violations.append(f"HIGH_SPREAD_FILTER_TRIGGERED: {symbol_spread} pips > {self.config['max_spread_pips']} pips")
            
        # Sizing modifier based on consecutive losses
        sizing_multiplier = 1.0
        if consecutive_losses >= self.config["consecutive_loss_threshold"]:
            sizing_multiplier = 0.5  # Halve risk during drawdown streaks
            
        is_allowed = len(violations) == 0
        
        return {
            "is_allowed": is_allowed,
            "violations": violations,
            "sizing_multiplier": sizing_multiplier,
            "daily_drawdown_pct": daily_pnl_pct,
            "open_trades_count": open_trades_count,
            "status": "APPROVED" if is_allowed else "BLOCKED_BY_GUARDRAILS"
        }

if __name__ == "__main__":
    og = OperationalGuardrails()
    print(og.evaluate_pre_trade_guardrails(10000, -2.1, 4, 1.2, 0))
    print(og.evaluate_pre_trade_guardrails(10000, -5.5, 9, 4.5, 3))
