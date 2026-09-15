"""
quantum_trading_brain_extensions.py — استكمال حقيقي لعقل البوت القائم (quant_brain/)
=======================================================================================
هذا الملف لا يعيد كتابة أي شيء موجود. كل صنف هنا إما:
  (أ) يرث فعليًا من صنف موجود بـquantum_trading_brain_v4.py / production_readiness.py
      ويضيف سلوكًا فوقه (override أو method إضافية)، أو
  (ب) صنف تعاوني جديد مصمّم للعمل *مع* الأصناف الموجودة (يستقبلها كوسيط، لا يستبدلها).

لا استيراد مكرر لمنطق موجود، ولا "نسخة v2" من أي صنف قائم.

طريقة الدمج بالبوت الحالي (خطوة تلو خطوة، بلا تعديل بالملفات الأصلية):
  1. في المكان اللي بتستخدم فيه RiskSizer.size(...) حاليًا، استبدلها بـ
     RegimeConditionalSizer(...).size(...) — نفس التوقيع + باراميتر واحد إضافي (regime).
  2. قبل استدعاء RiskSizer لأي صفقة جديدة، مرّر معاملات المحفظة الحالية على
     CorrelationRegimeShiftGuard.scale(...) واضرب الناتج في الحجم النهائي.
  3. AdaptiveKillSwitchLimits تُبنى مرة، وتُمرَّر بدل KillSwitchLimits الثابتة لـ
     IndependentKillSwitch الموجود أصلًا — الصنف الأصلي نفسه، تُغذّيه فقط بعتبات متحركة.
  4. باقي الأصناف (Ensemble, TCA, NewsFactor, PortfolioOptimizer, ShadowRunner) طبقات
     اختيارية تُستدعى بجانب الأصناف الأصلية دون المساس بها.

كل الأصناف هنا "بحثية" (research-grade) وتحتاج معايرة على بياناتك الحقيقية قبل أي تشغيل حي،
بنفس تحذير باقي الحزمة.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Mapping, Optional, Sequence, Tuple, Any, Union

try:
    import numpy as np
    import pandas as pd
    HAS_NUMPY_PANDAS = True
except ImportError:
    HAS_NUMPY_PANDAS = False
    # Lightweight pure-Python fallback classes for zero-dependency execution
    class _MockSeries(list):
        def __init__(self, data=None, index=None):
            super().__init__(data or [])
            self.values = list(data or [])
            self.index = index or list(range(len(self.values)))
        def std(self):
            if len(self.values) < 2: return 0.0
            m = sum(self.values) / len(self.values)
            return math.sqrt(sum((x - m)**2 for x in self.values) / len(self.values))
        def mean(self):
            return sum(self.values) / len(self.values) if self.values else 0.0
        def corr(self, other, method="spearman"):
            if len(self.values) != len(other.values) or len(self.values) < 2: return 0.0
            m1, m2 = self.mean(), other.mean()
            num = sum((a - m1) * (b - m2) for a, b in zip(self.values, other.values))
            den = math.sqrt(sum((a - m1)**2 for a in self.values) * sum((b - m2)**2 for b in other.values))
            return num / (den + 1e-8)
        @property
        def iloc(self):
            class _ILoc:
                def __init__(self, s): self.s = s
                def __getitem__(self, idx):
                    if isinstance(idx, slice):
                        return _MockSeries(self.s.values[idx])
                    return self.s.values[idx]
            return _ILoc(self)
        def pct_change(self, n=1):
            res = [0.0]*n + [(self.values[i] - self.values[i-n]) / (self.values[i-n] + 1e-8) for i in range(n, len(self.values))]
            return _MockSeries(res)
        def rolling(self, w, min_periods=1):
            class _Roll:
                def __init__(self, vals): self.vals = vals
                def max(self):
                    return _MockSeries([max(self.vals[max(0, i-w+1):i+1]) for i in range(len(self.vals))])
                def min(self):
                    return _MockSeries([min(self.vals[max(0, i-w+1):i+1]) for i in range(len(self.vals))])
                def mean(self):
                    return _MockSeries([sum(self.vals[max(0, i-w+1):i+1])/len(self.vals[max(0, i-w+1):i+1]) for i in range(len(self.vals))])
                def std(self):
                    res = []
                    for i in range(len(self.vals)):
                        sub = self.vals[max(0, i-w+1):i+1]
                        m = sum(sub) / len(sub)
                        res.append(math.sqrt(sum((x - m)**2 for x in sub) / len(sub)) if len(sub) > 1 else 0.0)
                    return _MockSeries(res)
            return _Roll(self.values)
        def clip(self, lo, hi):
            return _MockSeries([max(lo, min(hi, x)) for x in self.values])
        def fillna(self, v):
            return _MockSeries([v if (x is None or math.isnan(x)) else x for x in self.values])

    class _MockDataFrame:
        def __init__(self, data=None, index=None, columns=None):
            if isinstance(data, list):
                # 2D list passed
                self.columns = columns or [f"col_{i}" for i in range(len(data[0]) if data else 0)]
                self.index = index or list(range(len(data)))
                self.data = {self.columns[c]: [data[r][c] for r in range(len(data))] for c in range(len(self.columns))}
            elif isinstance(data, dict):
                self.data = data
                self.columns = columns or list(self.data.keys())
                self.index = index or (list(range(len(next(iter(self.data.values()))))) if self.data else [])
            else:
                self.data = {}
                self.columns = columns or []
                self.index = index or []
            
            class _Loc:
                def __init__(self, parent): self.parent = parent
                def __getitem__(self, idx_tuple):
                    if isinstance(idx_tuple, tuple) and len(idx_tuple) == 2:
                        rows, cols = idx_tuple
                        rows = [rows] if isinstance(rows, str) else list(rows)
                        cols = [cols] if isinstance(cols, str) else list(cols)
                        sliced = {c: [self.parent.data[c][self.parent.index.index(r)] for r in rows if r in self.parent.index] for c in cols if c in self.parent.data}
                        return _MockDataFrame(sliced, index=rows, columns=cols)
                    return self.parent
            self.loc = _Loc(self)

        def __getitem__(self, key):
            if isinstance(key, str): return _MockSeries(self.data.get(key, []))
            return self
        def __len__(self):
            return len(self.index)
        @property
        def shape(self):
            return (len(self.index), len(self.columns))
        def corr(self):
            res = {}
            for c1 in self.columns:
                res[c1] = {}
                s1 = _MockSeries(self.data[c1])
                for c2 in self.columns:
                    s2 = _MockSeries(self.data[c2])
                    res[c1][c2] = s1.corr(s2)
            return _MockDataFrame(res)
        @property
        def values(self):
            if not self.columns or not self.index: return []
            return [[self.data[c][i] for c in self.columns] for i in range(len(self.index))]
        @property
        def iloc(self):
            class _DFILoc:
                def __init__(self, df): self.df = df
                def __getitem__(self, idx):
                    if isinstance(idx, slice):
                        sliced_data = {c: self.df.data[c][idx] for c in self.df.columns}
                        first_col = next(iter(sliced_data.values())) if sliced_data else []
                        return _MockDataFrame(sliced_data, columns=self.df.columns, index=list(range(len(first_col))))
                    return self.df
            return _DFILoc(self)

    class _MockNP:
        @staticmethod
        def abs(a):
            if isinstance(a, (list, tuple)):
                return [abs(x) for x in a]
            return abs(a)
        @staticmethod
        def mean(a): return sum(a)/len(a) if len(a) else 0.0
        @staticmethod
        def std(a):
            m = sum(a)/len(a) if len(a) else 0.0
            return math.sqrt(sum((x - m)**2 for x in a)/len(a)) if len(a) else 0.0
        @staticmethod
        def clip(a, lo, hi): return max(lo, min(hi, a))
        @staticmethod
        def nanmean(a):
            v = [x for x in a if not math.isnan(x)]
            return sum(v)/len(v) if v else 0.0
        @staticmethod
        def array(a): return list(a)
        @staticmethod
        def subtract(a, b): return [x - y for x, y in zip(a, b)]
        @staticmethod
        def polyfit(x, y, deg):
            n = len(x)
            if n < 2: return [0.5, 0.0]
            mx, my = sum(x)/n, sum(y)/n
            num = sum((xi - mx)*(yi - my) for xi, yi in zip(x, y))
            den = sum((xi - mx)**2 for xi in x) or 1e-8
            m = num / den
            return [m, my - m*mx]
        @staticmethod
        def log(a): return [math.log(max(1e-8, x)) for x in a]
        class random:
            @staticmethod
            def normal(loc=0.0, scale=1.0, size=1):
                import random as py_rnd
                return [py_rnd.gauss(loc, scale) for _ in range(size)]

    pd = type('pandas', (), {'Series': _MockSeries, 'DataFrame': _MockDataFrame, 'isna': lambda x: x is None or math.isnan(x)})
    np = _MockNP

# استيراد فعلي من الملفات القائمة — لا إعادة تعريف لأي صنف منها
from quantum_trading_brain_v4 import (
    AlphaConfig,
    DistributionEstimate,
    MultiFactorAlpha,
    RiskSizer,
)
from production_readiness import IndependentKillSwitch, KillSwitchLimits, ChampionChallengerShadow


# ============================================================================
# 1) Regime-Conditional Position Sizing
# يرث من RiskSizer الموجود فعليًا — يضيف مضاعف نظام سوق فوق نفس معادلة size() الأصلية،
# لا يعيد كتابتها.
# ============================================================================

class MarketRegime:
    TRENDING = "TRENDING"
    MEAN_REVERTING = "MEAN_REVERTING"
    HIGH_VOL = "HIGH_VOL"
    UNKNOWN = "UNKNOWN"


class HurstRegimeDetector:
    """تصنيف نظام السوق بمؤشر Hurst المتحرك (>0.55 trending، <0.45 mean-reverting).

    اختيار Hurst بدل تصنيف يدوي لأنه نفس المنهجية المستخدمة أصلًا بالنسخة الأولى
    من العقل (statistical_econometric.py بالحزمة السابقة) — استمرارية منهجية لا إضافة عشوائية.
    """

    def __init__(self, window: int = 100, vol_spike_z: float = 2.5):
        self.window = window
        self.vol_spike_z = vol_spike_z

    def _hurst(self, returns: np.ndarray) -> float:
        lags = range(2, min(20, len(returns) // 2))
        if len(list(lags)) < 2:
            return 0.5
        tau = [np.std(np.subtract(returns[lag:], returns[:-lag])) for lag in lags]
        tau = [t if t > 0 else 1e-8 for t in tau]
        poly = np.polyfit(np.log(list(lags)), np.log(tau), 1)
        return float(poly[0])

    def detect(self, returns: pd.Series) -> str:
        if len(returns) < self.window:
            return MarketRegime.UNKNOWN
        recent = returns.iloc[-self.window:].values
        vol = float(np.std(recent))
        long_run_vol = float(returns.std())
        if long_run_vol > 0 and vol > long_run_vol * self.vol_spike_z:
            return MarketRegime.HIGH_VOL
        h = self._hurst(recent)
        if h > 0.55:
            return MarketRegime.TRENDING
        if h < 0.45:
            return MarketRegime.MEAN_REVERTING
        return MarketRegime.UNKNOWN


class RegimeConditionalSizer(RiskSizer):
    """FIX (اقتراح #1): نفس RiskSizer.size() الأصلي بالضبط + مضاعف نظام سوق.

    مبدأ التصميم: الإشارة نفسها (mean-reversion) لها معنى مختلف جدًا في نظام
    trending عن نظام mean-reverting — استخدام نفس الحجم في الحالتين خطأ منهجي.
    """

    REGIME_MULTIPLIER = {
        MarketRegime.MEAN_REVERTING: 1.0,   # الاستراتيجية الأساسية مبنية على هذا الافتراض
        MarketRegime.TRENDING: 0.35,        # تقليص حاد — mean-reversion ضعيف بنظام trending
        MarketRegime.HIGH_VOL: 0.25,        # تقليص أحد — عدم يقين أعلى بغض النظر عن الاتجاه
        MarketRegime.UNKNOWN: 0.0,          # NO_TRADE صراحة عند غموض النظام — لا "افتراض عادي" صامت
    }

    def size(self, dist: DistributionEstimate, cost_return: float, portfolio_value: float,
             current_exposure: float = 0.0, max_gross: float = 1.0,
             regime: str = MarketRegime.UNKNOWN) -> Tuple[float, str]:
        q, reason = super().size(dist, cost_return, portfolio_value, current_exposure, max_gross)
        if q == 0.0:
            return q, reason
        multiplier = self.REGIME_MULTIPLIER.get(regime, 0.0)
        if multiplier == 0.0:
            return 0.0, f"NO_TRADE_UNKNOWN_REGIME (كان سيكون {reason})"
        return q * multiplier, f"{reason}_REGIME_{regime}_x{multiplier}"


# ============================================================================
# 2) Cross-Asset Correlation Regime Shift Detector
# صنف تعاوني مستقل — يعمل *قبل* RiskSizer لأي رمز، لا يرثه (وظيفته على مستوى
# المحفظة كلها، لا صفقة واحدة).
# ============================================================================

class CorrelationRegimeShiftGuard:
    """FIX (اقتراح #2): covariance التاريخي (المستخدم بـRiskEngine/LedoitWolf) بطيء
    التحديث ولا يلتقط قفزات الارتباط اللحظية وقت الأزمات (كل شيء يرتبط بـ1.0 فجأة).
    هذا الحارس يراقب متوسط الارتباط المتحرك القصير مقابل الطويل، ويرجّع مضاعف
    تخفيض حجم صريح يُضرب في ناتج RiskSizer قبل التنفيذ."""

    def __init__(self, short_window: int = 20, long_window: int = 120, spike_threshold: float = 1.5):
        self.short_window = short_window
        self.long_window = long_window
        self.spike_threshold = spike_threshold
        self._history: List[float] = []

    def average_pairwise_correlation(self, returns_matrix: pd.DataFrame, window: int) -> float:
        if len(returns_matrix) < window:
            return float("nan")
        cols = list(returns_matrix.columns) if hasattr(returns_matrix, 'columns') else []
        if len(cols) < 2:
            return float("nan")

        try:
            corr_df = returns_matrix.iloc[-window:].corr()
            off_diag = []
            for i, c1 in enumerate(cols):
                for j, c2 in enumerate(cols):
                    if i != j:
                        if hasattr(corr_df, 'data') and c1 in corr_df.data and c2 in corr_df.data[c1]:
                            val = corr_df.data[c1][c2]
                        elif hasattr(corr_df, 'loc'):
                            val = corr_df.loc[c1, c2]
                        else:
                            val = None
                        if val is not None and not (isinstance(val, float) and math.isnan(val)):
                            off_diag.append(float(val))
            return float(sum(off_diag) / len(off_diag)) if off_diag else float("nan")
        except Exception:
            return float("nan")

    def scale(self, returns_matrix: pd.DataFrame) -> Tuple[float, str]:
        short_corr = self.average_pairwise_correlation(returns_matrix, self.short_window)
        long_corr = self.average_pairwise_correlation(returns_matrix, self.long_window)
        if math.isnan(short_corr) or math.isnan(long_corr) or abs(long_corr) < 1e-6:
            return 1.0, "INSUFFICIENT_HISTORY_NO_SCALING"

        self._history.append(short_corr)
        spike_ratio = short_corr / long_corr if long_corr > 0 else (self.spike_threshold + 1)
        if spike_ratio >= self.spike_threshold:
            # تخفيض تدريجي (لا قطع فجائي كامل) بمقدار يتناسب مع حجم القفزة
            scale = float(np.clip(1.0 / spike_ratio, 0.15, 1.0))
            return scale, f"CORRELATION_SPIKE: short={short_corr:.3f} long={long_corr:.3f} ratio={spike_ratio:.2f}"
        return 1.0, "NORMAL_CORRELATION_REGIME"


# ============================================================================
# 3) Order Book Imbalance الحقيقي — يُنتج feature يُضاف كعمود بـfactor_frame
# ليُستهلك مباشرة عبر AlphaConfig.weights الموجود أصلًا (لا يستبدل MultiFactorAlpha).
# ============================================================================

@dataclass
class L2Snapshot:
    timestamp: datetime
    bid_prices: Sequence[float]
    bid_sizes: Sequence[float]
    ask_prices: Sequence[float]
    ask_sizes: Sequence[float]


class RealOrderBookImbalance:
    """FIX (اقتراح #3): كان عندنا تقريب VPIN من taker_buy columns فقط (نسخة أضعف).
    هذا الصنف يحسب OFI حقيقي من عمق سوق فعلي (L2)، ويُستخدم كعمود إضافي بـ
    factor_frame الممرَّر لـPointInTimeDatasetBuilder — لا يغيّر MultiFactorAlpha نفسه."""

    def __init__(self, depth_levels: int = 5):
        self.depth_levels = depth_levels

    def order_flow_imbalance(self, prev: L2Snapshot, curr: L2Snapshot) -> float:
        """Cont-Kukanov-Stoikov OFI: يقيس صافي "ضغط" الأوامر بين لقطتين متتاليتين."""
        def level_contribution(prev_p, prev_s, curr_p, curr_s, side_sign):
            if curr_p > prev_p:
                return side_sign * curr_s
            if curr_p < prev_p:
                return -side_sign * prev_s
            return side_sign * (curr_s - prev_s)

        bid_contrib = sum(
            level_contribution(prev.bid_prices[i], prev.bid_sizes[i], curr.bid_prices[i], curr.bid_sizes[i], 1)
            for i in range(min(self.depth_levels, len(prev.bid_prices), len(curr.bid_prices)))
        )
        ask_contrib = sum(
            level_contribution(prev.ask_prices[i], prev.ask_sizes[i], curr.ask_prices[i], curr.ask_sizes[i], -1)
            for i in range(min(self.depth_levels, len(prev.ask_prices), len(curr.ask_prices)))
        )
        return float(bid_contrib + ask_contrib)

    def build_feature_series(self, snapshots: List[L2Snapshot]) -> pd.Series:
        if len(snapshots) < 2:
            return pd.Series(dtype=float)
        values = [0.0] + [self.order_flow_imbalance(snapshots[i - 1], snapshots[i]) for i in range(1, len(snapshots))]
        idx = [s.timestamp for s in snapshots]
        raw = pd.Series(values, index=idx)
        # تطبيع بـz-score متحرك — نفس منطق winsor_z الموجود بـAlphaConfig الأصلي
        rolling_std = raw.rolling(100, min_periods=20).std()
        return (raw / rolling_std.replace(0, np.nan)).clip(-4, 4).fillna(0.0)


# ============================================================================
# 4) Strategy Diversification Layer — استراتيجية ثانية (momentum/breakout) +
# دمج ديناميكي مع MultiFactorAlpha الأصلي حسب أداء كل واحدة الأخير (IC متحرك).
# ============================================================================

class MomentumBreakoutAlpha:
    """عامل بديل بطبيعة مختلفة عن MultiFactorAlpha (اللي متحيّز جزئيًا لـmean-reversion
    عبر عامل reversal). لا يرث منه عمدًا — الهدف تنوّع حقيقي في الفرضية، لا تكرارها."""

    def __init__(self, breakout_window: int = 48, momentum_window: int = 20):
        self.breakout_window = breakout_window
        self.momentum_window = momentum_window

    def compute(self, bars: pd.DataFrame) -> pd.Series:
        rolling_high = bars["high"].rolling(self.breakout_window).max()
        rolling_low = bars["low"].rolling(self.breakout_window).min()
        breakout_score = (bars["close"] - rolling_low) / (rolling_high - rolling_low + 1e-8) * 2 - 1
        momentum = bars["close"].pct_change(self.momentum_window)
        momentum_z = (momentum - momentum.rolling(200, min_periods=50).mean()) / (
            momentum.rolling(200, min_periods=50).std() + 1e-8
        )
        combined = 0.5 * breakout_score + 0.5 * momentum_z.clip(-4, 4)
        return combined.fillna(0.0)


class StrategyEnsemble:
    """FIX (اقتراح #4): وزن ديناميكي بين استراتيجيتين مستقلتين، محدَّث كل نافذة
    تقييم حسب IC الفعلي المُقاس (نفس دالة information_coefficient المستخدمة
    بباقي الحزمة) — لا وزن ثابت 50/50 اعتباطي."""

    def __init__(self, min_weight: float = 0.15, ic_lookback: int = 60):
        self.min_weight = min_weight
        self.ic_lookback = ic_lookback
        self._ic_history: Dict[str, List[float]] = {"mean_reversion": [], "momentum_breakout": []}

    def record_ic(self, strategy_name: str, predictions: pd.Series, realized: pd.Series) -> float:
        ic = predictions.corr(realized, method="spearman")
        ic = 0.0 if pd.isna(ic) else float(ic)
        self._ic_history.setdefault(strategy_name, []).append(ic)
        return ic

    def current_weights(self) -> Dict[str, float]:
        recent_ic = {
            name: float(np.mean(np.abs(hist[-self.ic_lookback:]))) if hist else 0.0
            for name, hist in self._ic_history.items()
        }
        total = sum(recent_ic.values())
        if total <= 1e-8:
            n = len(recent_ic) or 1
            return {name: 1.0 / n for name in recent_ic}
        raw_weights = {name: v / total for name, v in recent_ic.items()}
        # فرض حد أدنى لكل استراتيجية — يمنع "قفل" استراتيجية واحدة بشكل دائم من فترة سيئة مؤقتة
        floored = {name: max(w, self.min_weight) for name, w in raw_weights.items()}
        norm = sum(floored.values())
        return {name: w / norm for name, w in floored.items()}

    def combine(self, scores: Dict[str, pd.Series]) -> pd.Series:
        weights = self.current_weights()
        combined = None
        for name, series in scores.items():
            w = weights.get(name, 0.0)
            combined = series * w if combined is None else combined + series * w
        return combined if combined is not None else pd.Series(dtype=float)


# ============================================================================
# 5) Transaction Cost Analysis (TCA) — تقرير دوري يقارن تكلفة متوقعة/فعلية
# باستخدام نفس FillRecord.shortfall_bps الموجود أصلًا بـRobustCostModel.
# ============================================================================

class TCAReport:
    """FIX (اقتراح #5): RobustCostModel.estimate() موجود، لكن مفيش تتبّع دوري
    لجودة تقديراته بمرور الوقت. هذا الصنف يقارن expected مقابل realized لكل fill
    (نفس شكل FillRecord.shortfall_bps بالضبط) ويرصد الانحراف المتزايد كإنذار مبكر."""

    def __init__(self, drift_alert_threshold_bps: float = 5.0):
        self.drift_alert_threshold_bps = drift_alert_threshold_bps
        self.records: List[Dict] = []

    def log(self, expected_cost_bps: float, actual_shortfall_bps: float, cost_status: str, symbol: str, timestamp: datetime) -> None:
        self.records.append({
            "timestamp": timestamp, "symbol": symbol,
            "expected_bps": expected_cost_bps, "actual_bps": actual_shortfall_bps,
            "error_bps": actual_shortfall_bps - expected_cost_bps, "cost_status": cost_status,
        })

    def weekly_summary(self) -> pd.DataFrame:
        if not self.records:
            return pd.DataFrame()
        df = pd.DataFrame(self.records)
        df["week"] = pd.to_datetime(df["timestamp"], utc=True).dt.tz_localize(None).dt.to_period("W")
        summary = df.groupby(["week", "symbol"]).agg(
            n_fills=("error_bps", "count"),
            mean_error_bps=("error_bps", "mean"),
            std_error_bps=("error_bps", "std"),
        ).reset_index()
        summary["needs_recalibration"] = summary["mean_error_bps"].abs() > self.drift_alert_threshold_bps
        return summary


# ============================================================================
# 6) Adaptive Kill-Switch Thresholds — يُغذّي IndependentKillSwitch الأصلي بعتبات
# متحركة بدل أرقام ثابتة، لا يستبدله.
# ============================================================================

class AdaptiveKillSwitchLimits:
    """FIX (اقتراح #6): KillSwitchLimits الأصلي بعتبات ثابتة (max_slippage_bps=30 دائمًا
    مثلًا). هذا الصنف يحسب عتبة نسبية (متوسط متحرك + k×انحراف معياري) من تاريخ الأداء
    الفعلي، ثم يُنتج KillSwitchLimits (نفس الصنف الأصلي بالضبط) بقيم محدَّثة —
    يُستهلك مباشرة عبر IndependentKillSwitch بلا أي تعديل عليه."""

    def __init__(self, base_limits: KillSwitchLimits, z_multiplier: float = 3.0, min_history: int = 30):
        self.base_limits = base_limits
        self.z_multiplier = z_multiplier
        self.min_history = min_history
        self._slippage_history: List[float] = []

    def observe_slippage(self, slippage_bps: float) -> None:
        self._slippage_history.append(slippage_bps)

    def current_limits(self) -> KillSwitchLimits:
        if len(self._slippage_history) < self.min_history:
            return self.base_limits  # لا تعديل قبل توفر تاريخ كافٍ — نفس مبدأ MIN_FILLS_TO_TRAIN بباقي الحزمة
        mean = float(np.mean(self._slippage_history))
        std = float(np.std(self._slippage_history))
        adaptive_slippage_cap = max(self.base_limits.max_slippage_bps, mean + self.z_multiplier * std)
        return KillSwitchLimits(
            max_daily_loss=self.base_limits.max_daily_loss,
            max_drawdown=self.base_limits.max_drawdown,
            max_slippage_bps=adaptive_slippage_cap,
            max_agent_failures=self.base_limits.max_agent_failures,
            max_data_age_seconds=self.base_limits.max_data_age_seconds,
        )

    def build_gate(self) -> IndependentKillSwitch:
        return IndependentKillSwitch(limits=self.current_limits())


# ============================================================================
# 7) News/Sentiment كعامل إضافي — عمود يُضاف لـfactor_frame، ويرفع σ وقت الأخبار
# بدل منع التداول بالكامل (تكملة لمنطق NEWS_BLACKOUT الموجود بـanalytical_agent.py،
# لا بديل عنه — البلاك آوت الصارم يبقى كما هو للحالات الحرجة).
# ============================================================================

class NewsSentimentVolatilityFactor:
    """FIX (اقتراح #7): بدل قرار ثنائي (تداول/لا تداول) حول كل خبر، هذا الصنف يحوّل
    كثافة/حدّة الأخبار الأخيرة (score خارجي جاهز من embedding — لا يُنتجه هذا الصنف)
    إلى مضاعف تضخيم لـσ فقط. القرار الثنائي الحرج (NEWS_BLACKOUT) يبقى مسؤولية
    analytical_agent.py كما هو — هذا الصنف تعديل ناعم لعدم اليقين، لا استبدال للحارس الصارم."""

    def __init__(self, decay_halflife_minutes: float = 30.0, max_sigma_multiplier: float = 3.0):
        self.decay_halflife_minutes = decay_halflife_minutes
        self.max_sigma_multiplier = max_sigma_multiplier

    def sigma_multiplier(self, minutes_since_last_high_impact_news: Optional[float], news_intensity_score: float) -> float:
        """news_intensity_score: قيمة [0,1] من مصدر خارجي (embedding/NLP) — هذا الصنف
        لا يحسبها، فقط يترجمها لمضاعف σ. لو مفيش خبر معروف => بلا تعديل."""
        if minutes_since_last_high_impact_news is None:
            return 1.0
        decay = 0.5 ** (minutes_since_last_high_impact_news / max(self.decay_halflife_minutes, 1e-6))
        boost = 1.0 + (self.max_sigma_multiplier - 1.0) * float(np.clip(news_intensity_score, 0.0, 1.0)) * decay
        return float(boost)

    def widen_distribution(self, dist: DistributionEstimate, multiplier: float) -> DistributionEstimate:
        return DistributionEstimate(mu=dist.mu, sigma=dist.sigma * multiplier,
                                     data_quality=dist.data_quality, model_quality=dist.model_quality)


# ============================================================================
# 8) Portfolio-Level Mean-Variance Optimization — طبقة أخيرة فوق أحجام RiskSizer
# الفردية، تأخذ الـcovariance بالاعتبار على مستوى المحفظة كاملة.
# ============================================================================

class PortfolioMeanVarianceOptimizer:
    """FIX (اقتراح #8): RiskSizer.size() (الأصلي) يحسب كل رمز لوحده. هذا الصنف يأخذ
    كل الأحجام المقترحة (مُخرَجة أصلًا من RiskSizer/RegimeConditionalSizer لكل رمز)
    + مصفوفة تباين مشترك، ويُعيد توزيع الأوزان بما يحترم قيد تباين محفظة مستهدف —
    طبقة تسوية أخيرة، لا تستبدل sizing الفردي بل تعدّله."""

    def __init__(self, target_portfolio_vol_annual: float = 0.15, bars_per_year: float = 252 * 24):
        self.target_vol = target_portfolio_vol_annual
        self.bars_per_year = bars_per_year

    def reconcile(self, proposed_weights: Dict[str, float], covariance: pd.DataFrame) -> Tuple[Dict[str, float], str]:
        symbols = [s for s in proposed_weights if s in covariance.columns]
        if len(symbols) < 2:
            return proposed_weights, "INSUFFICIENT_SYMBOLS_FOR_PORTFOLIO_OPT"

        w = list(proposed_weights[s] for s in symbols)
        cov_matrix = covariance.loc[symbols, symbols]
        cov_vals = cov_matrix.values if hasattr(cov_matrix, 'values') else cov_matrix
        
        # Calculate quadratic form w^T * Cov * w safely in both NumPy & Pure Python
        port_var_per_bar = 0.0
        n_syms = len(symbols)
        for i in range(n_syms):
            for j in range(n_syms):
                cov_ij = cov_vals[i][j] if isinstance(cov_vals[i], (list, tuple)) else cov_vals[i, j]
                port_var_per_bar += w[i] * w[j] * float(cov_ij)

        if port_var_per_bar <= 0:
            return proposed_weights, "ZERO_PORTFOLIO_VARIANCE"

        port_vol_annual = math.sqrt(port_var_per_bar * self.bars_per_year)
        scale = float(np.clip(self.target_vol / port_vol_annual, 0.1, 3.0)) if port_vol_annual > 0 else 1.0
        adjusted = {s: proposed_weights[s] * scale for s in proposed_weights}
        return adjusted, f"PORTFOLIO_VOL_SCALED_x{scale:.3f} (realized_annual={port_vol_annual:.2%}, target={self.target_vol:.2%})"


# ============================================================================
# 9) Shadow A/B بين نسخ الاستراتيجية — يرث فعليًا من ChampionChallengerShadow
# الموجود أصلًا بـproduction_readiness.py، ويضيف فقط قرار الترقية التلقائي.
# ============================================================================

class AutoPromotionShadowRunner(ChampionChallengerShadow):
    """FIX (اقتراح #9): ChampionChallengerShadow الأصلي يسجّل ويلخّص فقط — القرار
    (هل نرقّي challenger؟) كان يدويًا. هذا الامتداد يضيف قاعدة ترقية صريحة ومُسجَّلة،
    بلا أي سلوك خفي: يحتاج تفوّق إحصائي واضح + حد أدنى من العينات، لا مجرد متوسط أعلى."""

    def __init__(self, champion: str, min_records: int = 200, min_sharpe_edge: float = 0.3):
        super().__init__(champion)
        self.min_records = min_records
        self.min_sharpe_edge = min_sharpe_edge
        self.promotion_log: List[Dict] = []

    def should_promote_challenger(self) -> Tuple[bool, str]:
        if not self.challenger:
            return False, "NO_CHALLENGER_SET"
        if len(self.records) < self.min_records:
            return False, f"INSUFFICIENT_SAMPLES: {len(self.records)}/{self.min_records}"

        champion_returns = np.array([r["champion_return"] for r in self.records])
        challenger_returns = np.array([r["challenger_return"] for r in self.records])

        def calc_mean(arr):
            return sum(arr) / len(arr) if len(arr) else 0.0

        def calc_std(arr):
            if len(arr) < 2: return 0.0
            m = calc_mean(arr)
            return math.sqrt(sum((x - m)**2 for x in arr) / len(arr))

        def sharpe(returns) -> float:
            std = returns.std() if hasattr(returns, 'std') else calc_std(returns)
            m = returns.mean() if hasattr(returns, 'mean') else calc_mean(returns)
            return float(m / std) if std > 0 else 0.0

        champion_sharpe = sharpe(champion_returns)
        challenger_sharpe = sharpe(challenger_returns)
        edge = challenger_sharpe - champion_sharpe

        # اختبار t مزدوج بسيط على فرق العوائد — لا نكتفي بفرق المتوسطات وحده
        diff = [c - h for c, h in zip(challenger_returns, champion_returns)]
        diff_mean = calc_mean(diff)
        diff_std = calc_std(diff)
        t_stat = float(diff_mean / (diff_std / math.sqrt(len(diff)))) if diff_std > 0 else 0.0

        should_promote = edge >= self.min_sharpe_edge and t_stat > 2.0
        reason = f"edge={edge:.3f} (need>={self.min_sharpe_edge}), t_stat={t_stat:.2f} (need>2.0)"
        self.promotion_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "champion_sharpe": champion_sharpe, "challenger_sharpe": challenger_sharpe,
            "edge": edge, "t_stat": t_stat, "promoted": should_promote,
        })
        return should_promote, reason

    def promote_if_ready(self) -> Optional[str]:
        should_promote, reason = self.should_promote_challenger()
        if not should_promote:
            return None
        new_champion = self.challenger
        self.champion = new_champion
        self.challenger = None
        self.records = []  # تصفير المقارنة بعد الترقية — بطل جديد يحتاج قياس جديد
        return new_champion


# ============================================================================
# ملخص الدمج — لا تشغيل تلقائي هنا، فقط توثيق تسلسل الاستدعاء المقترح
# ============================================================================

INTEGRATION_ORDER_NOTES = """
تسلسل الاستدعاء المقترح لكل دورة قرار (لا كود تنفيذي — توثيق فقط):

1. regime = HurstRegimeDetector().detect(returns_history)
2. dist = <EstimatorEngine الموجود عندك بالحزمة الأولى، أو ما يعادله>
3. dist = NewsSentimentVolatilityFactor().widen_distribution(dist, sigma_multiplier)
4. q, reason = RegimeConditionalSizer(...).size(dist, cost_return, portfolio_value, regime=regime)
5. corr_scale, corr_reason = CorrelationRegimeShiftGuard().scale(returns_matrix)
6. q_scaled = q * corr_scale
7. adjusted_weights, opt_reason = PortfolioMeanVarianceOptimizer().reconcile(
       {symbol: q_scaled, ...other_symbols...}, covariance_matrix)
8. adaptive_limits = AdaptiveKillSwitchLimits(base_limits).build_gate()
   halted, halt_reason = adaptive_limits.status(live_metrics)
   if halted: NO_TRADE
9. بعد كل تنفيذ فعلي: TCAReport().log(expected_cost_bps, actual_shortfall_bps, ...)
10. أسبوعيًا: راجع TCAReport().weekly_summary() و AutoPromotionShadowRunner().promote_if_ready()
"""
