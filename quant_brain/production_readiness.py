"""
Production Readiness & Fail-Safe Architecture
==============================================
- Independent Kill Switches
- Adaptive Risk Limits & Breakers
- Champion / Challenger A/B Shadow Engine
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any

@dataclass
class KillSwitchLimits:
    max_daily_loss: float = 0.05
    max_drawdown: float = 0.10
    max_slippage_bps: float = 30.0
    max_agent_failures: int = 5
    max_data_age_seconds: float = 60.0

class IndependentKillSwitch:
    def __init__(self, limits: Optional[KillSwitchLimits] = None):
        self.limits = limits or KillSwitchLimits()
        self.is_tripped = False
        self.trip_reason = ""
        self.trip_timestamp: Optional[str] = None

    def status(self, metrics: Dict[str, Any]) -> Tuple[bool, str]:
        if self.is_tripped:
            return True, f"PERMANENT_KILL_SWITCH_ACTIVE: {self.trip_reason}"

        daily_loss = metrics.get("daily_loss", 0.0)
        drawdown = metrics.get("drawdown", 0.0)
        slippage_bps = metrics.get("slippage_bps", 0.0)
        agent_failures = metrics.get("agent_failures", 0)
        data_age_seconds = metrics.get("data_age_seconds", 0.0)

        if daily_loss >= self.limits.max_daily_loss:
            self.trip(f"DAILY_LOSS_EXCEEDED: {daily_loss:.2%} >= {self.limits.max_daily_loss:.2%}")
            return True, self.trip_reason

        if drawdown >= self.limits.max_drawdown:
            self.trip(f"MAX_DRAWDOWN_EXCEEDED: {drawdown:.2%} >= {self.limits.max_drawdown:.2%}")
            return True, self.trip_reason

        if slippage_bps > self.limits.max_slippage_bps:
            self.trip(f"MAX_SLIPPAGE_EXCEEDED: {slippage_bps:.1f}bps > {self.limits.max_slippage_bps:.1f}bps")
            return True, self.trip_reason

        if agent_failures >= self.limits.max_agent_failures:
            self.trip(f"AGENT_FAILURES_EXCEEDED: {agent_failures} >= {self.limits.max_agent_failures}")
            return True, self.trip_reason

        if data_age_seconds > self.limits.max_data_age_seconds:
            self.trip(f"STALE_MARKET_DATA: {data_age_seconds:.1f}s > {self.limits.max_data_age_seconds:.1f}s")
            return True, self.trip_reason

        return False, "KILL_SWITCH_HEALTHY"

    def trip(self, reason: str):
        self.is_tripped = True
        self.trip_reason = reason
        self.trip_timestamp = datetime.now(timezone.utc).isoformat()

    def reset(self):
        self.is_tripped = False
        self.trip_reason = ""
        self.trip_timestamp = None

class ChampionChallengerShadow:
    def __init__(self, champion: str, challenger: Optional[str] = None):
        self.champion = champion
        self.challenger = challenger
        self.records: List[Dict[str, Any]] = []

    def record_prediction(self, timestamp: str, champion_return: float, challenger_return: float, symbol: str = "GLOBAL"):
        self.records.append({
            "timestamp": timestamp,
            "symbol": symbol,
            "champion_return": champion_return,
            "challenger_return": challenger_return,
            "return_spread": challenger_return - champion_return
        })

    def summary(self) -> Dict[str, Any]:
        if not self.records:
            return {"champion": self.champion, "challenger": self.challenger, "sample_size": 0}
        
        champ_ret = sum(r["champion_return"] for r in self.records) / len(self.records)
        chall_ret = sum(r["challenger_return"] for r in self.records) / len(self.records)
        
        return {
            "champion": self.champion,
            "challenger": self.challenger,
            "sample_size": len(self.records),
            "champion_mean_return": champ_ret,
            "challenger_mean_return": chall_ret,
            "challenger_alpha_spread": chall_ret - champ_ret
        }
