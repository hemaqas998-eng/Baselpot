"""
Strategic Brain v1 - Macro Regime & Intermarket Markov Engine (Pure Python)
==========================================================================
"""

from typing import Dict, Any

class StrategicBrainV1:
    def __init__(self):
        self.regimes = ["RISK_ON_EXPANSION", "RISK_OFF_FLIGHT_TO_SAFETY", "RANGE_CONSOLIDATION", "HIGH_VOLATILITY_SQUEEZE"]

    def detect_macro_regime(self, dxy_change: float, spx_change: float, gold_change: float, btc_change: float, vix_level: float = 18.0) -> Dict[str, Any]:
        risk_score = (spx_change * 1.5 + btc_change * 1.0) - (dxy_change * 1.8 + (vix_level - 18.0) * 0.1)
        
        if vix_level > 28.0 or (abs(gold_change) > 2.0 and dxy_change > 0.8):
            regime = "RISK_OFF_FLIGHT_TO_SAFETY"
            bias_forex = "BUY_USD_JPY_CHF"
            bias_crypto = "DEFENSIVE_HOLD"
            multiplier = 0.75
        elif risk_score > 1.2:
            regime = "RISK_ON_EXPANSION"
            bias_forex = "SELL_USD_BUY_EQUITIES"
            bias_crypto = "AGGRESSIVE_LONG"
            multiplier = 1.25
        elif abs(risk_score) <= 1.2 and vix_level < 20.0:
            regime = "RANGE_CONSOLIDATION"
            bias_forex = "MEAN_REVERSION_GRID"
            bias_crypto = "RANGE_SCALP"
            multiplier = 0.90
        else:
            regime = "HIGH_VOLATILITY_SQUEEZE"
            bias_forex = "TIGHT_TRAILING_STOPS"
            bias_crypto = "BREAKOUT_FOLLOW"
            multiplier = 0.85

        return {
            "current_regime": regime,
            "risk_sentiment_score": round(risk_score, 2),
            "vix_level": round(vix_level, 2),
            "asset_class_biases": {
                "forex": bias_forex,
                "crypto": bias_crypto
            },
            "macro_sizing_multiplier": round(multiplier, 2)
        }
