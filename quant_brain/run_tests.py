"""
Quant Brain Test Suite & Validation Runner
==========================================
Executes unit tests across all Albert Quant & Quantum Trading Brain v4 modules.
"""

import sys
from quantum_trading_brain_v4 import QuantumTradingBrainV4
from strategic_brain_v1 import StrategicBrainV1
from pattern_measurement_engines import PatternMeasurementEngine
from operational_guardrails import OperationalGuardrails
from deep_signal_weighter import DeepSignalWeighter
from time_market_awareness import TimeMarketAwareness
from quantum_trading_brain_v4 import DistributionEstimate, RiskSizer
from production_readiness import IndependentKillSwitch, KillSwitchLimits, ChampionChallengerShadow
from quantum_trading_brain_extensions import (
    HurstRegimeDetector,
    RegimeConditionalSizer,
    MarketRegime,
    CorrelationRegimeShiftGuard,
    L2Snapshot,
    RealOrderBookImbalance,
    MomentumBreakoutAlpha,
    StrategyEnsemble,
    TCAReport,
    AdaptiveKillSwitchLimits,
    NewsSentimentVolatilityFactor,
    PortfolioMeanVarianceOptimizer,
    AutoPromotionShadowRunner,
    pd,
    np
)
from datetime import datetime, timezone

def run_all_tests():
    print("==================================================")
    print("🔬 RUNNING QUANTUM TRADING BRAIN V4 TEST SUITE")
    print("==================================================")
    
    passed = 0
    total = 0
    
    # 1. Quantum State Vector Normalization Test
    total += 1
    brain = QuantumTradingBrainV4()
    state = brain.compute_quantum_state_vector([100 + i * 0.5 for i in range(25)], [1000] * 25)
    sum_prob = state["prob_bull"] + state["prob_bear"] + state["prob_range"]
    assert abs(sum_prob - 1.0) < 1e-4, f"State normalization failed: {sum_prob}"
    print("✅ TEST 1: Hilbert Space State Vector Normalization [PASSED]")
    passed += 1

    # 2. Fractional Kelly Risk Cap Test
    total += 1
    kelly = brain.calculate_fractional_kelly(win_rate=0.65, win_loss_ratio=2.0, volatility=0.015)
    assert 0 < kelly["conservative_kelly_pct"] <= 5.0, f"Kelly allocation out of bounds: {kelly}"
    print("✅ TEST 2: Fractional Kelly Risk Sizing & Caps [PASSED]")
    passed += 1

    # 3. Macro Regime Classification Test
    total += 1
    sb = StrategicBrainV1()
    regime = sb.detect_macro_regime(dxy_change=-0.5, spx_change=1.5, gold_change=0.2, btc_change=4.0, vix_level=14.0)
    assert regime["current_regime"] == "RISK_ON_EXPANSION"
    print("✅ TEST 3: Intermarket Markov Regime Classification [PASSED]")
    passed += 1

    # 4. Pattern Measurement Engine (OB / FVG) Test
    total += 1
    pme = PatternMeasurementEngine()
    candles = [
        {"open": 100, "high": 101, "low": 99, "close": 99.5},
        {"open": 99.5, "high": 105, "low": 99.4, "close": 104.8},
        {"open": 104.8, "high": 106, "low": 102.5, "close": 105.5}
    ]
    fvg = pme.detect_fair_value_gap(candles)
    assert fvg is not None and fvg["type"] == "BULLISH_FVG"
    print("✅ TEST 4: Microstructure FVG Geometric Imbalance [PASSED]")
    passed += 1

    # 5. Operational Risk Guardrail Drawdown Test
    total += 1
    og = OperationalGuardrails()
    guard = og.evaluate_pre_trade_guardrails(10000, -5.2, 2, 1.0)
    assert not guard["is_allowed"], "Drawdown circuit breaker failed to trigger"
    print("✅ TEST 5: Operational Drawdown Circuit Breaker [PASSED]")
    passed += 1

    # 6. Deep Bayesian Signal Weighter Test
    total += 1
    dsw = DeepSignalWeighter()
    weights = dsw.compute_composite_weight({
        "quantum_state_alignment": 90.0,
        "order_block_fvg_geometry": 85.0,
        "dual_ai_sentiment": 80.0,
        "intermarket_macro_regime": 75.0,
        "orderbook_liquidity_depth": 85.0
    })
    assert weights["composite_score"] >= 80.0
    print("✅ TEST 6: Deep Multi-Factor Bayesian Signal Weighting [PASSED]")
    passed += 1

    # 7. Hurst Regime & Regime-Conditional Sizer Test
    total += 1
    hrd = HurstRegimeDetector(window=20)
    fake_returns = pd.Series(np.random.normal(0.001, 0.01, 50))
    detected_regime = hrd.detect(fake_returns)
    sizer = RegimeConditionalSizer(max_fraction=0.20)
    dist = DistributionEstimate(mu=0.03, sigma=0.02)
    size_qty, reason = sizer.size(dist, cost_return=0.005, portfolio_value=10000, regime=MarketRegime.MEAN_REVERTING)
    assert size_qty > 0, f"Sizer failed: {size_qty}, reason: {reason}"
    print("✅ TEST 7: Hurst Regime Detector & Conditional Sizer [PASSED]")
    passed += 1

    # 8. Cross-Asset Correlation Regime Shift Guard Test
    total += 1
    guard = CorrelationRegimeShiftGuard(short_window=10, long_window=30, spike_threshold=1.3)
    df_ret = pd.DataFrame({
        "BTC": np.random.normal(0, 0.02, 40),
        "ETH": np.random.normal(0, 0.02, 40),
        "SOL": np.random.normal(0, 0.03, 40)
    })
    scale_factor, corr_reason = guard.scale(df_ret)
    assert 0.15 <= scale_factor <= 1.0
    print("✅ TEST 8: Cross-Asset Correlation Regime Shift Guard [PASSED]")
    passed += 1

    # 9. Real L2 Order Flow Imbalance (OFI) Test
    total += 1
    ofi_calc = RealOrderBookImbalance(depth_levels=3)
    s1 = L2Snapshot(datetime.now(timezone.utc), [100, 99.5, 99], [10, 15, 20], [100.5, 101, 101.5], [12, 14, 18])
    s2 = L2Snapshot(datetime.now(timezone.utc), [100.2, 100, 99.5], [14, 12, 22], [100.6, 101.1, 101.6], [8, 10, 15])
    ofi_val = ofi_calc.order_flow_imbalance(s1, s2)
    assert isinstance(ofi_val, float)
    print("✅ TEST 9: Microstructure Real L2 OFI Calculation [PASSED]")
    passed += 1

    # 10. Strategy Ensemble Dynamic IC Weighting Test
    total += 1
    ensemble = StrategyEnsemble()
    ensemble.record_ic("mean_reversion", pd.Series([1, 2, 3]), pd.Series([1, 2, 3]))
    weights_dict = ensemble.current_weights()
    assert "mean_reversion" in weights_dict and sum(weights_dict.values()) > 0.99
    print("✅ TEST 10: Dynamic Strategy Ensemble & Rolling IC [PASSED]")
    passed += 1

    # 11. Transaction Cost Analysis (TCA) Drift Report Test
    total += 1
    tca = TCAReport()
    tca.log(expected_cost_bps=3.0, actual_shortfall_bps=3.8, cost_status="FILL_NORMAL", symbol="EUR/USD", timestamp=datetime.now(timezone.utc))
    assert len(tca.records) == 1
    print("✅ TEST 11: TCA Transaction Cost Analysis & Slippage Drift [PASSED]")
    passed += 1

    # 12. Adaptive Kill-Switch Limits Test
    total += 1
    base_limits = KillSwitchLimits(max_slippage_bps=25.0)
    adaptive_switch = AdaptiveKillSwitchLimits(base_limits, z_multiplier=2.0, min_history=5)
    for s in [10.0, 12.0, 14.0, 11.0, 15.0, 30.0]:
        adaptive_switch.observe_slippage(s)
    cur_lims = adaptive_switch.current_limits()
    assert cur_lims.max_slippage_bps >= 25.0
    print("✅ TEST 12: Adaptive Rolling Kill-Switch Limits [PASSED]")
    passed += 1

    # 13. News Volatility Multiplier & Portfolio Optimizer Test
    total += 1
    news_factor = NewsSentimentVolatilityFactor()
    sig_mult = news_factor.sigma_multiplier(minutes_since_last_high_impact_news=10.0, news_intensity_score=0.85)
    assert sig_mult > 1.0
    optimizer = PortfolioMeanVarianceOptimizer(target_portfolio_vol_annual=0.15)
    cov_matrix = pd.DataFrame([[0.04, 0.01], [0.01, 0.05]], index=["BTC", "ETH"], columns=["BTC", "ETH"])
    adj_w, opt_msg = optimizer.reconcile({"BTC": 0.05, "ETH": 0.05}, cov_matrix)
    assert "BTC" in adj_w
    print("✅ TEST 13: News Volatility Multiplier & Portfolio Optimizer [PASSED]")
    passed += 1

    print("==================================================")
    print(f"🎉 ALL TESTS PASSED: {passed}/{total} (100% SUCCESS)")
    print("==================================================")
    return True

if __name__ == "__main__":
    if run_all_tests():
        sys.exit(0)
    else:
        sys.exit(1)
