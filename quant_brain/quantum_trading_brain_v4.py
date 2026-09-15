"""
Quantum Trading Brain v4 - Unified Albert Quant Architecture (Zero-Dependency + NumPy Compatible)
=================================================================================================
"""

import math
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Sequence

@dataclass
class DistributionEstimate:
    mu: float
    sigma: float
    data_quality: float = 1.0
    model_quality: float = 1.0

@dataclass
class AlphaConfig:
    weights: Dict[str, float] = field(default_factory=lambda: {"momentum": 0.35, "reversal": 0.35, "volatility": 0.15, "order_flow": 0.15})
    winsor_z: float = 4.0
    half_life: int = 20

class MultiFactorAlpha:
    def __init__(self, config: Optional[AlphaConfig] = None):
        self.config = config or AlphaConfig()

    def score(self, factors: Dict[str, float]) -> float:
        total_w = sum(self.config.weights.values()) or 1.0
        weighted_score = sum(factors.get(k, 0.0) * w for k, w in self.config.weights.items()) / total_w
        return max(-self.config.winsor_z, min(self.config.winsor_z, weighted_score))

class RiskSizer:
    def __init__(self, max_fraction: float = 0.25, base_risk_bps: float = 150.0):
        self.max_fraction = max_fraction
        self.base_risk_bps = base_risk_bps

    def size(self, dist: DistributionEstimate, cost_return: float, portfolio_value: float,
             current_exposure: float = 0.0, max_gross: float = 1.0) -> Tuple[float, str]:
        if dist.sigma <= 1e-8:
            return 0.0, "ZERO_VARIANCE_NO_TRADE"
        
        edge = dist.mu - cost_return
        if edge <= 0:
            return 0.0, f"NEGATIVE_EDGE_AFTER_COST (mu={dist.mu:.4f}, cost={cost_return:.4f})"
        
        # Kelly: f* = edge / sigma^2
        raw_kelly = edge / (dist.sigma ** 2)
        confidence_discount = dist.data_quality * dist.model_quality
        safe_f = max(0.0, min(self.max_fraction, raw_kelly * 0.25 * confidence_discount))
        
        # Remaining capacity
        capacity = max(0.0, max_gross - current_exposure)
        allocated_fraction = min(safe_f, capacity)
        allocated_cash = allocated_fraction * portfolio_value
        
        if allocated_cash <= 0:
            return 0.0, "CAPACITY_EXHAUSTED"
            
        return allocated_fraction, f"KELLY_ALLOCATION_{allocated_fraction:.4f}_EV_{edge:.4f}"

class QuantumTradingBrainV4:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {
            "state_dimension": 3,
            "entropy_threshold": 0.72,
            "min_quantum_amplitude": 0.65,
            "max_kelly_fraction": 0.25,
            "base_risk_per_trade": 0.015,
            "volatility_lookback": 20,
            "slippage_model_bps": 2.5
        }
        self.version = "4.2.0-UNIFIED-QUANT"

    def compute_quantum_state_vector(self, price_series: List[float], volume_series: List[float]) -> Dict[str, Any]:
        """
        Maps multi-dimensional market inputs to a normalized 3D Hilbert state vector:
        |Psi> = alpha |BULL> + beta |BEAR> + gamma |RANGE>
        where |alpha|^2 + |beta|^2 + |gamma|^2 = 1.0
        """
        if len(price_series) < 10:
            return {
                "alpha_bull": 0.333,
                "beta_bear": 0.333,
                "gamma_range": 0.334,
                "prob_bull": 0.333,
                "prob_bear": 0.333,
                "prob_range": 0.334,
                "dominant_state": "RANGE",
                "quantum_coherence": 0.5,
                "entropy": 1.0
            }

        returns = [(price_series[i] - price_series[i-1]) / price_series[i-1] for i in range(1, len(price_series))]
        
        # Momentum gradient (alpha)
        recent_returns = returns[-5:] if len(returns) >= 5 else returns
        momentum_score = sum(recent_returns) / len(recent_returns)
        norm_mom = 1.0 / (1.0 + math.exp(-max(-10.0, min(10.0, momentum_score * 100.0))))
        
        # Trend regression slope
        recent_prices = price_series[-14:]
        n = len(recent_prices)
        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(recent_prices) / n
        numer = sum((x[i] - x_mean) * (recent_prices[i] - y_mean) for i in range(n))
        denom = sum((x[i] - x_mean)**2 for i in range(n)) or 1e-8
        slope = numer / denom
        norm_slope = slope / (y_mean + 1e-8)
        
        # Volatility / Range factor (gamma)
        vol = (sum((r - sum(returns[-14:]) / len(returns[-14:]))**2 for r in returns[-14:]) / max(1, len(returns[-14:])))**0.5 if len(returns) >= 14 else 0.01
        range_factor = math.exp(-abs(norm_slope) * 50.0)
        
        # Compute raw amplitudes
        raw_bull = max(0.01, norm_mom * (1.0 + norm_slope * 20.0))
        raw_bear = max(0.01, (1.0 - norm_mom) * (1.0 - norm_slope * 20.0))
        raw_range = max(0.01, range_factor * (1.0 + vol * 10.0))
        
        total = math.sqrt(raw_bull**2 + raw_bear**2 + raw_range**2)
        alpha = raw_bull / total
        beta = raw_bear / total
        gamma = raw_range / total
        
        prob_bull = alpha**2
        prob_bear = beta**2
        prob_range = gamma**2
        
        # Von Neumann / Shannon Entropy
        probs = [p for p in [prob_bull, prob_bear, prob_range] if p > 0]
        entropy = -sum(p * math.log2(p) for p in probs) / math.log2(3.0)
        coherence = 1.0 - entropy
        
        dominant = "BULL" if prob_bull > max(prob_bear, prob_range) else ("BEAR" if prob_bear > prob_range else "RANGE")
        
        return {
            "alpha_bull": round(alpha, 4),
            "beta_bear": round(beta, 4),
            "gamma_range": round(gamma, 4),
            "prob_bull": round(prob_bull, 4),
            "prob_bear": round(prob_bear, 4),
            "prob_range": round(prob_range, 4),
            "dominant_state": dominant,
            "quantum_coherence": round(coherence, 4),
            "entropy": round(entropy, 4)
        }

    def calculate_fractional_kelly(self, win_rate: float, win_loss_ratio: float, volatility: float, liquidity_depth: float = 1.0) -> Dict[str, float]:
        p = max(0.01, min(0.99, win_rate))
        q = 1.0 - p
        b = max(0.1, win_loss_ratio)
        
        raw_kelly = (p * b - q) / b
        vol_penalty = 1.0 / (1.0 + max(0.0, volatility - 0.02) * 25.0)
        kappa = self.config["max_kelly_fraction"] * vol_penalty * min(1.0, liquidity_depth)
        optimal_f = max(0.0, raw_kelly * kappa)
        safe_allocation = min(self.config["base_risk_per_trade"] * 3.0, max(0.005, optimal_f))
        
        return {
            "raw_kelly_pct": round(raw_kelly * 100.0, 2),
            "conservative_kelly_pct": round(safe_allocation * 100.0, 2),
            "expected_value_ev": round(p * b - q, 4),
            "volatility_penalty_ratio": round(vol_penalty, 4),
            "suggested_risk_factor": round(safe_allocation, 4)
        }

    def evaluate_signal_quantum_confluence(self, signal: Dict[str, Any], market_context: Dict[str, Any]) -> Dict[str, Any]:
        prices = market_context.get("prices", [100.0] * 20)
        volumes = market_context.get("volumes", [1000.0] * 20)
        
        state = self.compute_quantum_state_vector(prices, volumes)
        direction = signal.get("direction", "LONG")
        alignment = state["prob_bull"] if direction == "LONG" else state["prob_bear"]
        
        base_win_rate = signal.get("winRate", 65.0) / 100.0
        dynamic_win_rate = min(0.88, max(0.35, base_win_rate * (0.8 + 0.4 * alignment)))
        rr_ratio = signal.get("riskRewardRatio", 2.0)
        
        returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices))]
        vol = (sum(r**2 for r in returns) / len(returns))**0.5 if returns else 0.015
        
        kelly = self.calculate_fractional_kelly(dynamic_win_rate, rr_ratio, vol)
        
        is_approved = (
            alignment >= self.config["min_quantum_amplitude"] * 0.75 and
            state["entropy"] <= self.config["entropy_threshold"] and
            kelly["expected_value_ev"] > 0.05
        )
        
        verdict = "APPROVED_QUANTUM_CONFLUENCE" if is_approved else (
            "CONDITIONAL_PULLBACK" if alignment >= 0.45 else "REJECTED_QUANTUM_DECOHERENCE"
        )
        
        return {
            "verdict": verdict,
            "is_approved": bool(is_approved),
            "quantum_state": state,
            "directional_alignment": round(alignment, 4),
            "dynamic_win_rate": round(dynamic_win_rate * 100.0, 2),
            "kelly_metrics": kelly,
            "composite_quantum_score": round((alignment * 0.4 + state["quantum_coherence"] * 0.3 + (1.0 - state["entropy"]) * 0.3) * 100.0, 2),
            "timestamp": market_context.get("timestamp", 0)
        }
