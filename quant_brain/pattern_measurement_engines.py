"""
Pattern Measurement & Structural Market Geometry Engines (Pure Python)
======================================================================
"""

import math
from typing import Dict, List, Any, Optional

class PatternMeasurementEngine:
    def __init__(self):
        self.version = "1.4.0"

    def detect_order_block(self, candles: List[Dict[str, float]]) -> Optional[Dict[str, Any]]:
        if len(candles) < 5:
            return None
        c_prev = candles[-3]
        c_displace = candles[-2]
        
        is_bull_ob = (
            c_prev["close"] < c_prev["open"] and
            c_displace["close"] > c_displace["open"] and
            (c_displace["close"] - c_displace["open"]) > 1.8 * abs(c_prev["close"] - c_prev["open"])
        )
        is_bear_ob = (
            c_prev["close"] > c_prev["open"] and
            c_displace["close"] < c_displace["open"] and
            (c_displace["open"] - c_displace["close"]) > 1.8 * abs(c_prev["close"] - c_prev["open"])
        )
        
        if is_bull_ob:
            return {
                "type": "BULLISH_ORDER_BLOCK",
                "high": c_prev["high"],
                "low": c_prev["low"],
                "displacement_pct": round((c_displace["close"] - c_prev["close"]) / c_prev["close"] * 100.0, 2),
                "confidence": 88.5
            }
        elif is_bear_ob:
            return {
                "type": "BEARISH_ORDER_BLOCK",
                "high": c_prev["high"],
                "low": c_prev["low"],
                "displacement_pct": round((c_prev["close"] - c_displace["close"]) / c_prev["close"] * 100.0, 2),
                "confidence": 88.5
            }
        return None

    def detect_fair_value_gap(self, candles: List[Dict[str, float]]) -> Optional[Dict[str, Any]]:
        if len(candles) < 3:
            return None
        c1 = candles[-3]
        c3 = candles[-1]
        
        if c3["low"] > c1["high"]:
            return {
                "type": "BULLISH_FVG",
                "top": c3["low"],
                "bottom": c1["high"],
                "gap_size": round(c3["low"] - c1["high"], 5),
                "confidence": 85.0
            }
        if c3["high"] < c1["low"]:
            return {
                "type": "BEARISH_FVG",
                "top": c1["low"],
                "bottom": c3["high"],
                "gap_size": round(c1["low"] - c3["high"], 5),
                "confidence": 85.0
            }
        return None

    def calculate_hurst_exponent(self, price_series: List[float]) -> float:
        if len(price_series) < 20:
            return 0.5
        n = len(price_series)
        returns = [price_series[i] - price_series[i-1] for i in range(1, n)]
        mean_r = sum(returns) / len(returns)
        cum_dev = []
        c = 0.0
        for r in returns:
            c += (r - mean_r)
            cum_dev.append(c)
        r_range = max(cum_dev) - min(cum_dev)
        std_dev = (sum((r - mean_r)**2 for r in returns) / len(returns))**0.5 or 1e-8
        rs = r_range / std_dev
        hurst = math.log(max(1.01, rs)) / math.log(n)
        return round(max(0.05, min(0.95, hurst)), 3)
