import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Award, 
  Flame, 
  Info, 
  RefreshCw, 
  Maximize2, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Sparkles,
  Globe
} from 'lucide-react';
import { 
  SessionKillzoneState, 
  PortfolioExposureGuard, 
  ScalpSwingAlgorithmProfile, 
  TradePostMortem, 
  KellyPositionSizeCalculation, 
  BotSettings, 
  PaperTrade, 
  QuantitativeSynergyMatrix,
  IntermarketMacroState
} from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QuantitativeEngineViewProps {
  settings: BotSettings;
  paperTrades: PaperTrade[];
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  onRefreshData?: () => void;
}

const DEFAULT_SCALP_SWING_PROFILE: ScalpSwingAlgorithmProfile = {
  id: 'default-scalp-swing-v1',
  name: 'Default Quantitative Scalp & Swing Profile',
  scalpConfig: {
    enabledTimeframes: ['M5', 'M15'],
    atrTpMultiplier: 1.8,
    atrSlMultiplier: 1.1,
    signalTtlMinutes: 35,
    minConfidenceScore: 75,
  },
  swingConfig: {
    enabledTimeframes: ['H1', 'H4', 'D1'],
    atrTpMultiplier: 3.8,
    atrSlMultiplier: 1.8,
    signalTtlMinutes: 1440,
    minConfidenceScore: 82,
  },
};

export const QuantitativeEngineView: React.FC<QuantitativeEngineViewProps> = ({
  settings,
  paperTrades,
  onUpdateSettings,
  onRefreshData
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SYNERGY' | 'MACRO' | 'KELLY' | 'KILLZONES' | 'EXPOSURE' | 'POST_MORTEM' | 'SCALP_SWING'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [macroData, setMacroData] = useState<IntermarketMacroState | null>(null);
  const [suiteData, setSuiteData] = useState<{
    sessionState?: SessionKillzoneState;
    portfolioGuard?: PortfolioExposureGuard;
    scalpSwingProfile?: ScalpSwingAlgorithmProfile;
    postMortems?: TradePostMortem[];
    sampleKelly?: KellyPositionSizeCalculation;
  }>({});

  // Unified Quantitative Synergy State
  const [synergySymbol, setSynergySymbol] = useState<string>('XAU/USD');
  const [synergyMatrix, setSynergyMatrix] = useState<QuantitativeSynergyMatrix | null>(null);
  const [synergyLoading, setSynergyLoading] = useState<boolean>(false);
  const [applyingSynergy, setApplyingSynergy] = useState<boolean>(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  // Interactive Kelly Playground State
  const [calcBalance, setCalcBalance] = useState<number>(settings.accountBalance || 50);
  const [calcWinRate, setCalcWinRate] = useState<number>(82);
  const [calcPayoff, setCalcPayoff] = useState<number>(2.8);
  const [calcFractional, setCalcFractional] = useState<number>(settings.fractionalKellyScale || 0.35);
  const [calcVolRatio, setCalcVolRatio] = useState<number>(1.0);
  const [calcPrice, setCalcPrice] = useState<number>(2685.0);
  const [calcSlDist, setCalcSlDist] = useState<number>(15.0);
  const [customKelly, setCustomKelly] = useState<KellyPositionSizeCalculation | null>(null);

  // Scalp / Swing Local Profile State
  const [localProfile, setLocalProfile] = useState<ScalpSwingAlgorithmProfile>(DEFAULT_SCALP_SWING_PROFILE);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch full quantitative suite & intermarket macro
  const fetchSuiteData = async () => {
    try {
      setLoading(true);
      const [suiteRes, macroRes] = await Promise.all([
        fetch('/api/radar/quantitative-suite'),
        fetch('/api/radar/intermarket')
      ]);
      const suiteJson = await suiteRes.json();
      if (suiteJson && suiteJson.success) {
        setSuiteData(suiteJson);
        if (suiteJson.scalpSwingProfile) {
          setLocalProfile(suiteJson.scalpSwingProfile);
        }
      }
      const macroJson = await macroRes.json();
      if (macroJson && macroJson.success && macroJson.intermarket) {
        setMacroData(macroJson.intermarket);
      }
    } catch (err) {
      console.error('Failed to fetch quantitative suite & macro data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuiteData();
    const interval = setInterval(fetchSuiteData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute live Kelly when sliders change
  const computeLiveKelly = async () => {
    try {
      const res = await fetch('/api/radar/calculate-kelly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountBalance: calcBalance,
          winRatePct: calcWinRate,
          payoffRatio: calcPayoff,
          fractionalKelly: calcFractional,
          volatilityRatio: calcVolRatio,
          baseRiskPerTradePct: settings.riskPerTradePct || 1.5,
          entryPrice: calcPrice,
          stopLossDistance: calcSlDist,
        })
      });
      const data = await res.json();
      if (data && data.success && data.calculation) {
        setCustomKelly(data.calculation);
      }
    } catch (err) {
      console.error('Error calculating custom Kelly:', err);
    }
  };

  useEffect(() => {
    computeLiveKelly();
  }, [calcBalance, calcWinRate, calcPayoff, calcFractional, calcVolRatio, calcPrice, calcSlDist, settings.riskPerTradePct]);

  // Fetch Unified Quantitative Synergy Matrix
  const fetchSynergyMatrix = async (symbolToFetch = synergySymbol) => {
    try {
      setSynergyLoading(true);
      const res = await fetch(`/api/radar/quantitative-synergy?symbol=${encodeURIComponent(symbolToFetch)}`);
      const data = await res.json();
      if (data && data.success && data.matrix) {
        setSynergyMatrix(data.matrix);
      }
    } catch (err) {
      console.error('Failed to fetch quantitative synergy matrix:', err);
    } finally {
      setSynergyLoading(false);
    }
  };

  useEffect(() => {
    fetchSynergyMatrix(synergySymbol);
  }, [synergySymbol]);

  // Master Unified Quant & Hybrid Engine Trigger (One-Click Deconstruction + Sizing + Hybridization + Live Bot Injection)
  const handleUnifiedQuantTrigger = async () => {
    try {
      setApplyingSynergy(true);
      setApplyMessage(null);
      const res = await fetch('/api/radar/unified-quant-hybrid-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSymbol: synergySymbol })
      });
      const data = await res.json();
      if (data && data.success) {
        setSynergyMatrix(data.primaryMatrix);
        if (data.intermarket) {
          setMacroData(data.intermarket);
        }
        setApplyMessage(isAr ? data.summaryArabic : data.summaryEnglish);
        fetchSuiteData();
        if (onRefreshData) onRefreshData();
      } else {
        throw new Error(data.error || 'Failed to execute unified engine');
      }
    } catch (err: any) {
      setApplyMessage(`❌ ${err.message}`);
    } finally {
      setApplyingSynergy(false);
    }
  };

  // Apply winning synergy parameters directly into live bot
  const handleApplySynergyToBot = async () => {
    if (!synergyMatrix) return;
    try {
      setApplyingSynergy(true);
      setApplyMessage(null);
      const res = await fetch('/api/radar/apply-synergy-to-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: synergyMatrix.symbol,
          synergyScore: synergyMatrix.synergyScore,
          optimalKellyLot: synergyMatrix.quantumEngineering.optimalKellyLot,
          recommendedTrailingStopATR: synergyMatrix.hybridAlphaSynthesis.recommendedTrailingStopATR,
          recommendedTakeProfitATR: synergyMatrix.hybridAlphaSynthesis.recommendedTakeProfitATR,
          winningHybridName: synergyMatrix.hybridAlphaSynthesis.winningHybridName
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setApplyMessage(isAr ? `✅ تم تطبيق إعدادات الهجين الكمي بنجاح! اللوت: ${data.appliedSettings.lotSize} | الوقف المتتابع: ${data.appliedSettings.atrTrailingMultiplier}x ATR` : `✅ Applied Quantitative Hybrid into live bot! Lot: ${data.appliedSettings.lotSize}`);
        if (onRefreshData) onRefreshData();
        setTimeout(() => setApplyMessage(null), 6000);
      } else {
        throw new Error(data.error || 'Failed to apply');
      }
    } catch (err: any) {
      setApplyMessage(`❌ ${err.message}`);
    } finally {
      setApplyingSynergy(false);
    }
  };

  // Save Scalp & Swing Profile
  const handleSaveProfile = async () => {
    if (!localProfile) return;
    try {
      const res = await fetch('/api/radar/scalp-swing-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localProfile)
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating scalp swing profile:', err);
    }
  };

  const session: SessionKillzoneState = suiteData.sessionState || {
    currentGmtHour: 12,
    currentTimeGMT: '12:30:00',
    activeSession: 'LONDON_OPEN_KILLZONE',
    activeSessionName: 'London & NY Overlap',
    sessionName: 'London & NY Overlap',
    sessionNameArabic: 'جلسة التداول اللحظية',
    isKillzoneActive: true,
    deadzoneActive: false,
    confluenceMultiplier: 1.25,
    bestPairs: ['XAU/USD', 'EUR/USD', 'GBP/USD'],
    description: 'High liquidity institutional session',
    descriptionArabic: 'سيولة مرتفعة',
    nextUpcomingSession: {
      name: 'London Close',
      nameArabic: 'إغلاق لندن',
      startsInMinutes: 150
    }
  };

  const guard: PortfolioExposureGuard = suiteData.portfolioGuard || {
    totalBalanceUSD: settings.accountBalance || 200,
    totalRiskUSD: 4.2,
    totalRiskPct: 2.1,
    maxPortfolioRiskLimitPct: 6.0,
    maxSingleCurrencyLimitPct: 3.5,
    remainingRiskCapacityPct: 3.9,
    isPortfolioCapBreached: false,
    currencyExposures: {
      USD: { currency: 'USD', exposureUSD: 4.2, exposurePct: 2.1, totalRiskPct: 2.1, maxAllowedPct: 3.5, status: 'SAFE', openPositionsCount: 2, activePairs: ['EUR/USD', 'XAU/USD'], symbols: ['EUR/USD', 'XAU/USD'] },
      EUR: { currency: 'EUR', exposureUSD: 1.6, exposurePct: 0.8, totalRiskPct: 0.8, maxAllowedPct: 3.5, status: 'SAFE', openPositionsCount: 1, activePairs: ['EUR/USD'], symbols: ['EUR/USD'] },
      GBP: { currency: 'GBP', exposureUSD: 0, exposurePct: 0, totalRiskPct: 0.0, maxAllowedPct: 3.5, status: 'SAFE', openPositionsCount: 0, activePairs: [], symbols: [] },
      XAU: { currency: 'XAU', exposureUSD: 3.0, exposurePct: 1.5, totalRiskPct: 1.5, maxAllowedPct: 3.5, status: 'SAFE', openPositionsCount: 1, activePairs: ['XAU/USD'], symbols: ['XAU/USD'] }
    },
    correlationWarnings: []
  };

  const postMortems: TradePostMortem[] = suiteData.postMortems || [];
  
  const currentKelly: KellyPositionSizeCalculation = customKelly || suiteData.sampleKelly || {
    winRatePct: 82,
    profitFactor: 2.8,
    fullKellyPct: 14.2,
    fullKellyFractionPct: 14.2,
    fractionalScale: settings.fractionalKellyScale || 0.35,
    fractionalKellyPct: 1.5,
    recommendedRiskPct: 1.5,
    recommendedRiskUSD: 3.0,
    volatilityScaler: 1.0,
    calculatedLotSize: 0.01,
    riskUSD: 3.0,
    maxLossUSD: 3.0,
    capitalAtRiskPct: 1.5,
    sizingRationale: 'Quarter Kelly scaled with baseline volatility',
    sizingRationaleArabic: 'حجم كيلي المعتمد مع معامل التقلب العكسي'
  };

  return (
    <div id="quantitative-engine-view" className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-xl">
                <Calculator className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex flex-wrap items-center gap-2">
                  {isAr ? 'الخوارزميات الكمية والهندسية لإدارة الصفقات' : 'Institutional Quantitative Engine'}
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                    {isAr ? 'حسابات اللوت والسيولة' : 'Kelly & Killzones'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {isAr 
                    ? 'إدارة هندسية متقدمة بحجم اللوت (Kelly Criterion)، فلتر الجلسات البنكية (Killzones)، حماية التعرض المالي التراكمي، وتشريح الأداء (MAE/MFE).'
                    : 'Advanced position sizing (Kelly Criterion), smart money bank killzones, multi-currency risk cap, and execution quality post-mortems.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchSuiteData}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث القياسات اللحظية' : 'Refresh Telemetry'}
            </button>
            <div className="px-3.5 py-2 bg-indigo-900/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 font-mono">
              GMT {session?.currentTimeGMT || '00:00:00'}
            </div>
          </div>
        </div>

        {/* Engine Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[
            { id: 'OVERVIEW', label: isAr ? 'لوحة القيادة الكمية' : 'Overview', icon: Activity, badge: '5 Matrix' },
            { id: 'SYNERGY', label: isAr ? 'هجين الاستراتيجيات والتوافق الكمي' : 'Strategy Synergy & Hybrid', icon: Sparkles, badge: synergyMatrix?.synergyScore ? `${synergyMatrix.synergyScore}/100` : 'Hybrid Alpha' },
            { id: 'MACRO', label: isAr ? 'التحليل الكلي وتدفقات الأسواق (Macro)' : 'Intermarket Macro', icon: Globe, badge: macroData?.regimeNameArabic || macroData?.macroRegime || 'Macro' },
            { id: 'KELLY', label: isAr ? 'حجم اللوت الديناميكي (Kelly)' : 'Kelly Sizing', icon: Calculator, badge: `${(currentKelly?.calculatedLotSize ?? 0.01)} Lot` },
            { id: 'KILLZONES', label: isAr ? 'جلسات السيولة والـ Killzones' : 'Bank Killzones', icon: Clock, badge: session?.activeSessionName || 'Session' },
            { id: 'EXPOSURE', label: isAr ? 'حارس التعرض والارتباط المالي' : 'Portfolio Guard', icon: ShieldAlert, badge: `${(guard?.totalRiskPct ?? 0).toFixed(1)}% Risk` },
            { id: 'POST_MORTEM', label: isAr ? 'تشريح الصفقات (MAE / MFE)' : 'MAE/MFE Analysis', icon: Award, badge: `${postMortems.length} Trades` },
            { id: 'SCALP_SWING', label: isAr ? 'إعدادات المضاربة والسوينق' : 'Scalp & Swing Profiles', icon: Sliders, badge: 'Tuner' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50' 
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-800/80 text-indigo-100' : 'bg-slate-900 text-slate-400'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Master Action Banner: One-Click Unified Quantitative & Strategy Hybridizer */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl shadow-md shadow-emerald-500/10">
            <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'المحرك الكمي والهجين الموحد (زر التنفيذ الشامل)' : 'One-Click Master Quantitative & Hybrid Engine'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                {isAr ? 'دمج 4 محركات بزر واحد' : '4 Engines in 1'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'دمج التحليل الكمي، وتفكيك الاستراتيجيات (ICT/SMC/FVG)، ومعادلة كيلي لحجم اللوت (سقف 0.05 لوت)، وتطبيق الهجين الفائز فوراً في البوت الآلي مع حماية الأرباح.'
                : 'Merge Quant Analysis, Smart Money Deconstruction, Kelly Sizing (≤0.05 Lot cap), and apply the winning hybrid directly to the live bot in one click.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10 w-full md:w-auto">
          <button
            onClick={handleUnifiedQuantTrigger}
            disabled={applyingSynergy}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 border border-emerald-400/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {applyingSynergy ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300" />
            )}
            <span>
              {applyingSynergy
                ? (isAr ? 'جارٍ دمج وتفعيل المحرك الكمي...' : 'Executing Unified Synergy...')
                : (isAr ? '⚡ تفعيل المحرك الكمي والهجين الموحد في البوت' : '⚡ Execute Unified Quant & Hybrid Engine')}
            </span>
          </button>
        </div>
      </div>

      {/* Applied Feedback Notice */}
      {applyMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium animate-fadeIn whitespace-pre-line shadow-lg">
          {applyMessage}
        </div>
      )}

      {/* --- TAB: UNIFIED STRATEGY SYNERGY & HYBRIDIZATION --- */}
      {activeTab === 'SYNERGY' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Selection & Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 rounded-xl border border-amber-500/30">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {isAr ? 'محرك التوافق الكمي والهندسي وتفكيك الاستراتيجيات' : 'Unified Quantitative Synergy & Strategy Hybridizer'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'دمج نماذج Smart Money + كتل السيولة + فجوات FVG + كسر كيلي + موجات وايكوف' : 'Deconstructed ICT / SMC, Liquidity Imbalances, Wyckoff Phases & Fractional Kelly Engine'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD', 'USD/JPY'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSynergySymbol(sym)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                    synergySymbol === sym
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {sym}
                </button>
              ))}
              <button
                onClick={() => fetchSynergyMatrix(synergySymbol)}
                disabled={synergyLoading}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title={isAr ? 'إعادة الحساب' : 'Recalculate'}
              >
                <RefreshCw className={`w-4 h-4 ${synergyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {applyMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <span>{applyMessage}</span>
              <button onClick={() => setApplyMessage(null)} className="text-emerald-400">✕</button>
            </div>
          )}

          {synergyMatrix ? (
            <div className="space-y-6">
              {/* Verdict & Score Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        synergyMatrix.botExecutionVerdict.startsWith('APPROVED')
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}>
                        ⚡ {synergyMatrix.botExecutionVerdict}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                        {synergyMatrix.symbol} • {synergyMatrix.timeframe}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300">
                        Wyckoff: {synergyMatrix.deconstructedModules.wyckoffPhase}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      {isAr ? synergyMatrix.hybridAlphaSynthesis.winningHybridNameArabic : synergyMatrix.hybridAlphaSynthesis.winningHybridName}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {isAr ? synergyMatrix.summaryArabic : synergyMatrix.verdictExplanationArabic}
                    </p>
                  </div>

                  {/* Score & One-Click Apply Button */}
                  <div className="flex items-center gap-5 w-full lg:w-auto justify-between lg:justify-end shrink-0">
                    <div className="text-center p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'مؤشر التوافق الكلي' : 'Synergy Score'}</div>
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 font-mono">
                        {synergyMatrix.synergyScore}<span className="text-sm text-slate-500">/100</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        +{synergyMatrix.hybridAlphaSynthesis.alphaVsBaselinePct}% Alpha
                      </div>
                    </div>

                    <button
                      onClick={handleApplySynergyToBot}
                      disabled={applyingSynergy}
                      className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <Zap className={`w-4 h-4 ${applyingSynergy ? 'animate-spin' : ''}`} />
                      <span>{isAr ? 'تطبيق الهجين على البوت الآلي' : 'Inject Hybrid into Live Bot'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Columns Grid: Deconstructed Modules | Quantum Engineering | Hybrid Alpha */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Deconstructed Strategy Modules */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <h4 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      {isAr ? 'تفكيك الاستراتيجيات الهيكلية' : 'Deconstructed Strategy Modules'}
                    </span>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{synergyMatrix.deconstructedModules.totalStructuralScore}/100</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Order Block (كتل الأوامر):</span>
                        <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.orderBlockScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.orderBlockScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Fair Value Gap (الفجوات السعرية):</span>
                        <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.fairValueGapScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.fairValueGapScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Liquidity Sweep (اصطياد السيولة):</span>
                        <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.liquiditySweepScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.liquiditySweepScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Institutional Momentum (الزخم المؤسسي):</span>
                        <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.momentumEmaScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.momentumEmaScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Volume POC (نقطة السيطرة الحجمية):</span>
                        <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.volumePocScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.volumePocScore}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Quantum Engineering & Kelly Sizing */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <h4 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      {isAr ? 'المحلل الكمي الهندسي وإدارة الحجم' : 'Quantum Sizing & Risk Math'}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">Max 0.05 Lot</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'اللوت المحسوب (Kelly):' : 'Optimal Kelly Lot:'}</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">{synergyMatrix.quantumEngineering.optimalKellyLot} Lots</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'السقف الأقصى للأمان:' : 'Hard Lot Cap:'}</div>
                      <div className="text-base font-black text-amber-400 mt-0.5">{synergyMatrix.quantumEngineering.maxSafeLotCap} Lots</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'القيمة المتوقعة (EV):' : 'Expected Value EV:'}</div>
                      <div className="text-base font-bold text-white mt-0.5">+{synergyMatrix.quantumEngineering.expectedValueEV.toFixed(2)}</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'نسبة شارب التقديرية:' : 'Projected Sharpe:'}</div>
                      <div className="text-base font-bold text-indigo-400 mt-0.5">{synergyMatrix.quantumEngineering.projectedSharpe.toFixed(2)}</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'عائد/مخاطرة R:R:' : 'Risk/Reward Ratio:'}</div>
                      <div className="text-base font-bold text-white mt-0.5">1:{synergyMatrix.quantumEngineering.riskRewardRatio}</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'إنتروبيا التذبذب:' : 'Entropy Ratio:'}</div>
                      <div className="text-base font-bold text-cyan-400 mt-0.5">{synergyMatrix.quantumEngineering.volatilityEntropyRatio.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Hybrid Alpha Synthesis */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <h4 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      {isAr ? 'توليف الهجين والوقف المتتابع' : 'Hybrid Alpha Synthesis'}
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">{synergyMatrix.hybridAlphaSynthesis.sessionConfluenceMultiplier}x Multiplier</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">{isAr ? 'مضاعف الوقف المتتابع (Trailing ATR):' : 'Recommended Trailing ATR:'}</span>
                      <span className="font-mono font-bold text-cyan-300">{synergyMatrix.hybridAlphaSynthesis.recommendedTrailingStopATR}x ATR</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">{isAr ? 'مضاعف أخذ الربح (Take Profit ATR):' : 'Recommended TP ATR:'}</span>
                      <span className="font-mono font-bold text-emerald-300">{synergyMatrix.hybridAlphaSynthesis.recommendedTakeProfitATR}x ATR</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">{isAr ? 'توافق تدفق الماكرو (Macro Confluence):' : 'Macro Intermarket Score:'}</span>
                      <span className="font-mono font-bold text-amber-300">{synergyMatrix.hybridAlphaSynthesis.intermarketMacroScore}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">{isAr ? 'ميزة ألفا على الاستراتيجية الفردية:' : 'Alpha vs Baseline:'}</span>
                      <span className="font-mono font-bold text-emerald-400">+{synergyMatrix.hybridAlphaSynthesis.alphaVsBaselinePct}%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
              {isAr ? 'جارٍ احتساب مصفوفة التوافق الكمي والهندسي...' : 'Computing Quantitative Synergy Matrix...'}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 1: OVERVIEW SUMMARY CARDS --- */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top Quick Status Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kelly Lot Status */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Calculator className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/40">
                  Fractional Kelly {((settings.fractionalKellyScale ?? 0.35) * 100).toFixed(0)}%
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 mt-3">{isAr ? 'الحجم المحسوب للصفقة القادمة' : 'Recommended Next Lot Size'}</h3>
              <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2 font-mono">
                {currentKelly?.calculatedLotSize ?? 0.01} <span className="text-sm font-sans font-normal text-slate-400">Lots</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {isAr ? 'مخاطرة فعلية:' : 'Capital Risk:'} <span className="text-blue-300 font-bold">${(currentKelly?.recommendedRiskUSD ?? 3.0).toFixed(2)}</span> ({(currentKelly?.fractionalKellyPct ?? 1.5).toFixed(1)}% {isAr ? 'من الرأس مال' : 'of Balance'})
              </p>
            </div>

            {/* Session Killzone Status */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition">
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl border ${session?.isKillzoneActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  <Clock className="w-5 h-5" />
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${session?.isKillzoneActive ? 'bg-amber-950 text-amber-300 border-amber-600/50' : session?.deadzoneActive ? 'bg-rose-950 text-rose-300 border-rose-800/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {session?.isKillzoneActive ? (isAr ? 'Killzone نشطة 🔥' : 'Killzone Active 🔥') : session?.deadzoneActive ? (isAr ? 'منطقة ركود ⏸️' : 'Deadzone ⏸️') : (isAr ? 'جلسة قياسية' : 'Standard Session')}
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 mt-3">{isAr ? 'الجلسة البنكية الحالية' : 'Current Active Bank Session'}</h3>
              <div className="text-lg font-bold text-white mt-1">
                {isAr ? (session?.sessionNameArabic || session?.activeSessionName) : session?.activeSessionName}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <span>{isAr ? 'مضاعف التأكيد:' : 'Confluence Multiplier:'}</span>
                <span className="font-mono font-bold text-amber-300">{(session?.confluenceMultiplier ?? 1.0).toFixed(2)}x</span>
              </p>
            </div>

            {/* Portfolio Exposure Risk */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${guard?.isPortfolioCapBreached ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-emerald-950 text-emerald-300 border-emerald-800/40'}`}>
                  {guard?.isPortfolioCapBreached ? (isAr ? 'تجاوز السقف ⚠️' : 'Cap Breached ⚠️') : (isAr ? 'آمن ومحمى 🛡️' : 'Protected 🛡️')}
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 mt-3">{isAr ? 'إجمالي المخاطرة التراكمية' : 'Total Cumulative Risk'}</h3>
              <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2 font-mono">
                {(guard?.totalRiskPct ?? 0).toFixed(1)}% <span className="text-xs font-sans text-slate-500">/ {(guard?.maxPortfolioRiskLimitPct ?? 6)}% {isAr ? 'الحد الأقصى' : 'Max Cap'}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${((guard?.totalRiskPct ?? 0) / (guard?.maxPortfolioRiskLimitPct ?? 6)) > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, ((guard?.totalRiskPct ?? 0) / (guard?.maxPortfolioRiskLimitPct ?? 6)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Average Post-Mortem Quality */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 transition">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Award className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/40">
                  MAE/MFE Analytics
                </span>
              </div>
              <h3 className="text-xs font-medium text-slate-400 mt-3">{isAr ? 'جودة تنفيذ الصفقات المغلقة' : 'Execution Quality Score'}</h3>
              <div className="text-2xl font-black text-white mt-1 font-mono flex items-baseline gap-2">
                {postMortems.length > 0 ? `${(postMortems.reduce((acc, p) => acc + (p?.executionQualityScore ?? 90), 0) / postMortems.length).toFixed(0)}/100` : '96/100'}
                <span className="text-xs font-sans text-emerald-400">Grade A+</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {isAr ? 'كفاءة اقتناص الهدف (MFE):' : 'Favorable Excursion (MFE):'} <span className="text-purple-300 font-bold">{postMortems.length > 0 ? `${(postMortems.reduce((acc, p) => acc + (p?.favorableEfficiencyPct ?? 90), 0) / postMortems.length).toFixed(0)}%` : '91%'}</span>
              </p>
            </div>
          </div>

          {/* Core Quantitative Pillars Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Schedule & Killzones Overview */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">
                    {isAr ? 'جدول الجلسات وساعات السيولة المؤسساتية (GMT)' : 'Bank Sessions & Smart Money Killzones'}
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">GMT Market Time</span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'London Open Killzone', nameAr: 'افتتاح لندن والسيولة الأوروبية', gmt: '07:00 - 10:00 GMT', multiplier: '1.30x', active: !!session?.activeSessionName?.includes('London'), highVol: true },
                  { name: 'New York Open Killzone', nameAr: 'افتتاح نيويورك وسيولة وول ستريت', gmt: '12:00 - 15:00 GMT', multiplier: '1.35x', active: !!session?.activeSessionName?.includes('NY'), highVol: true },
                  { name: 'London Close Killzone', nameAr: 'إغلاق لندن وتثبيت عقود الصرف', gmt: '15:00 - 17:00 GMT', multiplier: '1.15x', active: false, highVol: false },
                  { name: 'Asian Range / Deadzone', nameAr: 'الجلسة الآسيوية ومنطقة الركود', gmt: '21:00 - 05:00 GMT', multiplier: '0.70x', active: !!session?.deadzoneActive, highVol: false, deadzone: true },
                ].map((s, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      s.active 
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5' 
                        : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.active ? 'bg-amber-400 animate-ping' : s.deadzone ? 'bg-rose-500' : 'bg-slate-600'}`} />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {isAr ? s.nameAr : s.name}
                          {s.active && <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded">{isAr ? 'نشط الآن' : 'ACTIVE'}</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{s.gmt} • {s.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${s.deadzone ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40' : 'bg-slate-900 text-indigo-300 border border-slate-700'}`}>
                        {s.multiplier} {isAr ? 'قوة الإشارة' : 'Boost'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>{isAr ? 'الخوارزمية الذكية:' : 'Algorithmic Confluence:'}</strong> {isAr 
                    ? 'يقوم البوت بزيادة وزن إشارات الدخول (Confluence Boost) بنسبة تصل إلى +35% أثناء فترات الـ Killzones المؤسساتية وتخفيض حجم الإشارات أو إيقافها في فترات الركود لتجنب اتساع السبريد.'
                    : 'The engine boosts signal conviction up to +35% during high-liquidity bank killzones while strictly scaling down exposures during low-liquidity deadzones.'}
                </p>
              </div>
            </div>

            {/* Kelly Criterion & Formula Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">
                    {isAr ? 'معادلة Fractional Kelly لتحديد حجم العقود' : 'Fractional Kelly Sizing Model'}
                  </h2>
                </div>
                <span className="text-xs bg-blue-950 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-800/40">
                  Math Model
                </span>
              </div>

              {/* Mathematical Equation Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-center mb-4">
                <div className="text-xs text-slate-400 mb-1">{isAr ? 'معادلة كيلي الكسرية مع معامل التقلب العكسي' : 'Fractional Kelly with Inverse Volatility Scaler'}</div>
                <div className="text-sm font-bold text-indigo-300">
                  f* = Fractional_Scale × [ (p × b - q) / b ] × (1 / Volatility_Scaler)
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-center gap-4">
                  <span>p = Win Rate ({calcWinRate}%)</span>
                  <span>b = Payoff Ratio ({calcPayoff}x)</span>
                  <span>q = Loss Rate ({(100 - calcWinRate)}%)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400">{isAr ? 'حجم كيلي الكامل (Full Kelly)' : 'Full Theoretical Kelly'}</div>
                  <div className="text-lg font-mono font-bold text-white mt-1">
                    {(currentKelly?.fullKellyFractionPct ?? 14.2).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'مخاطرة نظرية قصوى' : 'Theoretical Maximum'}</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 border-l-2 border-l-blue-500">
                  <div className="text-[11px] text-slate-400">{isAr ? 'حجم كيلي الموصى به (Fractional)' : 'Fractional Kelly Recommended'}</div>
                  <div className="text-lg font-mono font-bold text-blue-400 mt-1">
                    {(currentKelly?.fractionalKellyPct ?? 1.45).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-blue-300/80 mt-0.5">{isAr ? 'تحكم آمن ضد التراجع' : 'Drawdown-Safe Sizing'}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">{isAr ? 'حجم العقد المنفذ (Calculated Lot):' : 'Calculated Lot Size:'}</span>
                  <span className="font-mono font-bold text-emerald-400">{currentKelly?.calculatedLotSize ?? 0.01} Lot</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">{isAr ? 'القيمة النقدية للمخاطرة (Risk USD):' : 'Capital at Risk (USD):'}</span>
                  <span className="font-mono font-bold text-slate-200">${(currentKelly?.recommendedRiskUSD ?? 3.0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">{isAr ? 'معامل خفض تقلب الشموع (Vol Scaler):' : 'ATR Volatility Scaler:'}</span>
                  <span className="font-mono text-amber-300 font-bold">{(currentKelly?.volatilityScaler ?? 1.0).toFixed(2)}x</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('KELLY')}
                className="w-full mt-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5" />
                {isAr ? 'فتح حاسبة ومختبر كيلي التفاعلي' : 'Open Interactive Kelly Playground'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: INTERACTIVE KELLY CRITERION PLAYGROUND --- */}
      {activeTab === 'KELLY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Sliders */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                {isAr ? 'مختبر وحاسبة كيلي التفاعلية (Kelly Playground)' : 'Interactive Kelly Position Sizing Playground'}
              </h2>
              <span className="text-xs text-indigo-300 font-mono bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800/40">
                Dynamic Sizing
              </span>
            </div>

            {/* Account Capital */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">{isAr ? 'رأس مال المحفظة (Account Balance)' : 'Account Balance'}</span>
                <span className="font-mono text-indigo-400 font-bold">${calcBalance}</span>
              </div>
              <input 
                type="range"
                min="50"
                max="5000"
                step="50"
                value={calcBalance}
                onChange={(e) => setCalcBalance(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span className="text-emerald-400 font-bold">$50 (Default)</span>
                <span>$200</span>
                <span>$500 (10x Goal)</span>
                <span>$1,000</span>
                <span>$5,000</span>
              </div>
            </div>

            {/* Win Rate */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">{isAr ? 'نسبة الفوز التاريخية للاستراتيجية (Win Rate %)' : 'Historical Strategy Win Rate'}</span>
                <span className="font-mono text-emerald-400 font-bold">{calcWinRate}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="95"
                step="1"
                value={calcWinRate}
                onChange={(e) => setCalcWinRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Payoff Ratio (R:R) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">{isAr ? 'متوسط نسبة العائد إلى المخاطرة (Reward-to-Risk)' : 'Average Reward-to-Risk Ratio'}</span>
                <span className="font-mono text-amber-400 font-bold">{calcPayoff} : 1</span>
              </div>
              <input 
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={calcPayoff}
                onChange={(e) => setCalcPayoff(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Fractional Kelly Scale */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">{isAr ? 'مقياس كيلي الجزئي (Fractional Kelly Fraction)' : 'Fractional Kelly Scale'}</span>
                <span className="font-mono text-blue-400 font-bold">{(calcFractional * 100).toFixed(0)}% (0.{Math.round(calcFractional * 100)})</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={calcFractional}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCalcFractional(val);
                  onUpdateSettings({ fractionalKellyScale: val });
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'توصية المؤسسات: استخدام 25% - 40% من كيلي لحماية الحساب من فترات التراجع المتتالية.' : 'Institutional standard: 25% - 40% fractional scale protects against variance.'}
              </div>
            </div>

            {/* Volatility Scaler */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">{isAr ? 'نسبة تضخم تقلب الشموع (ATR Volatility Spike)' : 'ATR Volatility Ratio'}</span>
                <span className="font-mono text-purple-400 font-bold">{calcVolRatio.toFixed(2)}x ATR</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={calcVolRatio}
                onChange={(e) => setCalcVolRatio(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Results & Lot Sizing Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-800/50 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" />
                {isAr ? 'المخرجات الرياضية وتوصية العقد اللحظية' : 'Kelly Sizing Calculation Output'}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400">{isAr ? 'حجم العقد المحسوب للذهب/الفوركس' : 'Recommended Trade Lot'}</div>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                    {currentKelly?.calculatedLotSize ?? 0.01} <span className="text-sm text-slate-400 font-normal">Lot</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{isAr ? `معدل بدقة لرأس مال $${calcBalance}` : `Scaled for $${calcBalance}`}</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400">{isAr ? 'المخاطرة النقدية القصوى (Risk $)' : 'Max USD Risk'}</div>
                  <div className="text-3xl font-black text-indigo-400 font-mono mt-1">
                    ${(currentKelly?.recommendedRiskUSD ?? 3.0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{(currentKelly?.fractionalKellyPct ?? 1.5).toFixed(2)}% {isAr ? 'من الإجمالي' : 'of Capital'}</div>
                </div>
              </div>

              {/* Formula Step-by-Step Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-1.5 flex justify-between">
                  <span>{isAr ? 'خطوات الاحتساب الرياضي:' : 'Mathematical Steps:'}</span>
                  <span className="text-indigo-400">Kelly Math</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>1. {isAr ? 'نسبة كيلي النظرية الكاملة (f*):' : 'Full Theoretical Kelly (f*):'}</span>
                  <span className="text-white font-bold">{(currentKelly?.fullKellyFractionPct ?? 14.2).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>2. {isAr ? 'نسبة كيلي المخفضة (Fractional Scale):' : 'Fractional Scale Applied:'}</span>
                  <span className="text-blue-400 font-bold">{((calcFractional) * 100).toFixed(0)}% = {(currentKelly?.fractionalKellyPct ?? 1.5).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>3. {isAr ? 'معامل تعديل التقلب (Volatility Scaler):' : 'Volatility Damping Scaler:'}</span>
                  <span className="text-amber-400 font-bold">{(currentKelly?.volatilityScaler ?? 1.0).toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-2 font-bold">
                  <span>4. {isAr ? 'حجم اللوت النهائي المعتمد:' : 'Final Authorized Lot:'}</span>
                  <span className="text-emerald-400">{currentKelly?.calculatedLotSize ?? 0.01} Lot</span>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
                💡 <strong>{isAr ? 'فائدة هندسية:' : 'Engineering Edge:'}</strong> {isAr 
                  ? 'تحميك هذه الخوارزمية من تضخيم الصفقات عند التراجع، وتقوم تلقائياً بتكبير حجم اللوت تدريجياً مع نمو رأس المال بفضل تأثير الفائدة التراكمية.'
                  : 'Kelly dynamically prevents catastrophic drawdown while accelerating capital compounding on positive-expectancy winning runs.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SESSION LIQUIDITY & BANK KILLZONES --- */}
      {activeTab === 'KILLZONES' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  {isAr ? 'رادار الجلسات البنكية وساعات تدفق السيولة الذكية (Smart Money Sessions)' : 'Smart Money Bank Sessions & Killzones'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr 
                    ? 'تتبع السيولة اللحظية للبنوك المركزية وصناع السوق في لندن، نيويورك، وطوكيو'
                    : 'Real-time liquidity and volume tracking for London, New York, and Asian sessions'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{isAr ? 'توقيت غرينتش الحالي:' : 'Current GMT Time:'}</span>
                <span className="px-3 py-1 bg-slate-950 text-amber-300 font-mono font-bold text-sm rounded-xl border border-slate-800">
                  {session?.currentTimeGMT || '00:00:00'} GMT
                </span>
              </div>
            </div>

            {/* Big Active Session Banner */}
            <div className={`p-5 rounded-2xl border mb-6 transition ${session?.isKillzoneActive ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/5' : session?.deadzoneActive ? 'bg-rose-950/40 border-rose-800/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <span className={`p-3 rounded-xl border ${session?.isKillzoneActive ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}>
                    {session?.isKillzoneActive ? <Flame className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </span>
                  <div>
                    <div className="text-xs text-slate-400">{isAr ? 'الجلسة والوضع الحركي الراهن' : 'Current Liquidity Regime'}</div>
                    <div className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                      {isAr ? (session?.sessionNameArabic || session?.activeSessionName) : session?.activeSessionName}
                      {session?.isKillzoneActive && (
                        <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-bounce">
                          {isAr ? 'Killzone نشطة 🔥' : 'Killzone ACTIVE 🔥'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[11px] text-slate-400">{isAr ? 'مضاعف وزن الإشارة' : 'Signal Confluence'}</div>
                    <div className="text-lg font-mono font-bold text-amber-300">{(session?.confluenceMultiplier ?? 1.0).toFixed(2)}x Confluence</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">{isAr ? 'حالة منطقة الركود' : 'Deadzone State'}</div>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${session?.deadzoneActive ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-emerald-950 text-emerald-300 border-emerald-800/40'}`}>
                      {session?.deadzoneActive ? (isAr ? 'حظر الصفقات الضعيفة ⏸️' : 'Deadzone Restricted ⏸️') : (isAr ? 'سيولة طبيعية مسموحة 🟢' : 'Liquidity Permitted 🟢')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Sessions Breakdown Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'London Open Killzone',
                  arabic: 'افتتاح لندن واليورو',
                  time: '07:00 - 10:00 GMT',
                  multiplier: '1.30x',
                  desc: isAr ? 'أعلى سيولة يومية للذهب والعملات الأوروبية. كسر هياكل السيولة المبكرة وتحديد اتجاه اليوم.' : 'Peak daily volume for EUR, GBP, and Gold.',
                  active: !!session?.activeSessionName?.includes('London')
                },
                {
                  title: 'New York Open Killzone',
                  arabic: 'افتتاح نيويورك والدولار',
                  time: '12:00 - 15:00 GMT',
                  multiplier: '1.35x',
                  desc: isAr ? 'تداخل لندن مع نيويورك؛ أكبر حجم تداول (Volume Spike) مع البيانات الاقتصادية الأمريكية.' : 'London-NY overlap with massive institutional volume.',
                  active: !!session?.activeSessionName?.includes('NY')
                },
                {
                  title: 'London Close Session',
                  arabic: 'إغلاق بورصة لندن',
                  time: '15:00 - 17:00 GMT',
                  multiplier: '1.15x',
                  desc: isAr ? 'تثبيت أسعار الصرف وإعادة توازن المحافظ الاستثمارية، أهداف جني أرباح سريعة.' : 'Fixing rates and rebalancing portfolio orders.',
                  active: false
                },
                {
                  title: 'Asian Deadzone Filter',
                  arabic: 'منطقة ركود آسيا والليل',
                  time: '21:00 - 05:00 GMT',
                  multiplier: '0.70x',
                  desc: isAr ? 'سبريد مرتفع وحركة عرضية؛ يقوم البوت بتفعيل الحماية الذكية وحجب الدخول الخاطئ.' : 'Wider spreads and choppy consolidation filtered out.',
                  active: !!session?.deadzoneActive
                },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    item.active 
                      ? 'bg-amber-500/10 border-amber-500/50' 
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white">{isAr ? item.arabic : item.title}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-900 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                        {item.multiplier}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 mt-1">{item.time}</div>
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{item.title}</span>
                    <span className={item.active ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                      {item.active ? (isAr ? '● نشط حالياً' : '● ACTIVE') : (isAr ? '○ خامل' : '○ IDLE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PORTFOLIO EXPOSURE & CORRELATION GUARD --- */}
      {activeTab === 'EXPOSURE' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  {isAr ? 'حارس التعرض للعملات والارتباط المالي (Cross-Asset Correlation Guard)' : 'Cross-Asset Currency Exposure & Correlation Guard'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr 
                    ? 'منع تراكم المخاطرة على عملة واحدة (مثل الدولار أو الذهب) لحماية الحساب من الصدمات السعرية المفاجئة'
                    : 'Enforces hard single-currency and portfolio exposure limits against macro volatility shocks'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">{isAr ? 'سقف مخاطرة العملة الواحدة:' : 'Single Currency Max Cap:'}</span>
                <span className="px-3 py-1 bg-slate-950 text-indigo-300 font-mono font-bold text-xs rounded-xl border border-slate-800">
                  {guard?.maxSingleCurrencyLimitPct ?? 3.5}%
                </span>
              </div>
            </div>

            {/* Overall Portfolio Risk Capacity Meter */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{isAr ? 'استهلاك سقف المخاطرة التراكمي للمحفظة:' : 'Cumulative Portfolio Risk Utilization:'}</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{(guard?.totalRiskPct ?? 0).toFixed(1)}% / {(guard?.maxPortfolioRiskLimitPct ?? 6.0).toFixed(1)}%</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {isAr ? 'المتبقي المسموح:' : 'Remaining Risk Budget:'} <strong className="text-white font-mono">{(guard?.remainingRiskCapacityPct ?? 3.9).toFixed(1)}%</strong>
                </span>
              </div>

              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${((guard?.totalRiskPct ?? 0) / (guard?.maxPortfolioRiskLimitPct ?? 6)) > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, ((guard?.totalRiskPct ?? 0) / (guard?.maxPortfolioRiskLimitPct ?? 6)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Currency Breakdown Grid */}
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{isAr ? 'تفصيل التعرض المالي حسب العملة والأصل' : 'Exposure Allocation by Currency'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['USD', 'EUR', 'GBP', 'XAU'].map(curr => {
                const exp = guard?.currencyExposures?.[curr] || {
                  currency: curr,
                  totalRiskPct: curr === 'XAU' ? 1.5 : curr === 'USD' ? 2.1 : 0.8,
                  openPositionsCount: curr === 'XAU' ? 1 : curr === 'USD' ? 2 : 1,
                  symbols: curr === 'XAU' ? ['XAU/USD'] : curr === 'USD' ? ['XAU/USD', 'EUR/USD'] : ['EUR/USD'],
                  status: 'SAFE' as const
                };
                const isBreached = exp.status === 'BREACHED';

                return (
                  <div key={curr} className={`p-4 rounded-xl border ${isBreached ? 'bg-rose-950/40 border-rose-700' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                        {curr}
                        <span className="text-[10px] font-sans font-normal text-slate-400">
                          ({exp.openPositionsCount} {isAr ? 'صفقات' : 'trades'})
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBreached ? 'bg-rose-900 text-rose-200' : 'bg-slate-900 text-emerald-400 border border-emerald-500/20'}`}>
                        {isBreached ? (isAr ? 'محظور تجاوز السقف' : 'BREACHED') : (isAr ? 'آمن' : 'SAFE')}
                      </span>
                    </div>

                    <div className="text-2xl font-mono font-bold text-white mt-2">
                      {(exp.totalRiskPct ?? 0).toFixed(1)}% <span className="text-xs font-normal text-slate-500">/ {(guard?.maxSingleCurrencyLimitPct ?? 3.5)}%</span>
                    </div>

                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isBreached ? 'bg-rose-500' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, ((exp.totalRiskPct ?? 0) / (guard?.maxSingleCurrencyLimitPct ?? 3.5)) * 100)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2.5 truncate font-mono">
                      {isAr ? 'الأصول:' : 'Symbols:'} {(exp.symbols || []).join(', ') || 'None'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: POST-MORTEM (MAE / MFE) ANALYSIS --- */}
      {activeTab === 'POST_MORTEM' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  {isAr ? 'تشريح الصفقات المغلقة (Post-Trade MAE & MFE Post-Mortem)' : 'Post-Trade MAE/MFE Analytics & Post-Mortems'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr 
                    ? 'تحليل أقصى انعكاس معاكس (MAE) وأقصى امتداد ربحي (MFE) واكتشاف نقاط التحسين التنفيذية'
                    : 'Maximum Adverse Excursion (MAE) and Maximum Favorable Excursion (MFE) execution analytics'}
                </p>
              </div>

              <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                {isAr ? 'إجمالي الصفقات المشرحة:' : 'Analyzed Trades:'} {postMortems.length}
              </div>
            </div>

            {postMortems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
                <p className="text-sm">
                  {isAr 
                    ? 'لا توجد صفقات مغلقة حالياً لتحليلها. سيتم التوليد التلقائي بمجرد إغلاق أول صفقة.'
                    : 'No closed trades recorded yet. Analytics will automatically populate as positions close.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {postMortems.map((pm) => (
                  <div key={pm.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${pm.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                          {pm.direction}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {pm.symbol}
                            <span className="text-xs text-slate-400 font-mono">({pm.lotSize ?? 0.01} Lot)</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {isAr ? 'دخول:' : 'Entry:'} {pm.entryPrice} • {isAr ? 'خروج:' : 'Exit:'} {pm.exitPrice} • {isAr ? 'المدة:' : 'Duration:'} {pm.holdingDurationMinutes ?? 15} min
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">{isAr ? 'الربح المحقق' : 'Realized PnL'}</div>
                          <div className={`text-base font-bold font-mono ${(pm.realizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(pm.realizedPnL ?? 0) >= 0 ? `+$${(pm.realizedPnL ?? 0).toFixed(2)}` : `-$${Math.abs(pm.realizedPnL ?? 0).toFixed(2)}`}
                          </div>
                        </div>

                        <div className={`px-3 py-1.5 rounded-xl border text-center font-mono font-bold text-xs ${pm.efficiencyRating === 'A+' ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50' : 'bg-indigo-950 text-indigo-300 border-indigo-700'}`}>
                          {pm.efficiencyRating || 'A+'} Grade
                          <div className="text-[9px] font-sans text-slate-400">{pm.executionQualityScore ?? 95}/100</div>
                        </div>
                      </div>
                    </div>

                    {/* MAE vs MFE Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">{isAr ? 'أقصى امتداد ربحي (MFE)' : 'Max Favorable Excursion'}</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">+{pm.maxFavorableExcursionPips ?? 25} Pips</div>
                        <div className="text-[10px] text-slate-500">{isAr ? 'كفاءة:' : 'Efficiency:'} {pm.favorableEfficiencyPct ?? 90}%</div>
                      </div>

                      <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">{isAr ? 'أقصى تراجع معاكس (MAE)' : 'Max Adverse Excursion'}</div>
                        <div className="text-amber-400 font-mono font-bold mt-0.5">-{pm.maxAdverseExcursionPips ?? 5} Pips</div>
                        <div className="text-[10px] text-slate-500">{isAr ? 'سحب الوقف:' : 'SL Draw:'} {pm.adverseExcursionRatioPct ?? 20}%</div>
                      </div>

                      <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">{isAr ? 'الانزلاق السعري (Slippage)' : 'Slippage Impact'}</div>
                        <div className="text-slate-200 font-mono font-bold mt-0.5">{pm.slippagePoints ?? 0.2} Pts</div>
                        <div className="text-[10px] text-slate-500">{isAr ? 'تكلفة:' : 'Cost:'} ${pm.slippageUSD ?? 0.2}</div>
                      </div>

                      <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">{isAr ? 'سبب الإغلاق' : 'Exit Reason'}</div>
                        <div className="text-indigo-300 font-bold mt-0.5">{pm.closeReason || 'TAKE_PROFIT'}</div>
                        <div className="text-[10px] text-slate-500">{pm.exitReasonExplanation || 'Dynamic TP Hit'}</div>
                      </div>
                    </div>

                    {/* Actionable Learning Takeaway */}
                    <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-lg text-xs text-purple-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{pm.actionableTakeaway || (isAr ? 'تنفيذ نظيف بدقة متناهية ودون انزلاق سعري ملحوظ.' : 'Optimal execution with near-zero slippage.')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 6: SCALP VS SWING ALGORITHMIC PROFILE TUNER --- */}
      {activeTab === 'SCALP_SWING' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  {isAr ? 'محدد وضبط خوارزميات المضاربة (Scalping) والسوينق (Swing Trading)' : 'Scalping & Swing Algorithmic Profile Tuner'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr 
                    ? 'فصل وتخصيص مضاعفات الـ ATR، نسب جني الأرباح، وفترات الصلاحية (TTL) لكل نمط تداول'
                    : 'Configure independent ATR multipliers, profit targets, and signal TTL for Scalping vs Swing trades'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isAr ? 'حفظ وتطبيق البروفايل' : 'Save & Apply Profile'}
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 animate-fadeIn">{isAr ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scalp Profile Settings */}
              <div className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">{isAr ? 'بروفايل المضاربة السريعة (Scalp Engine)' : 'High-Speed Scalp Engine'}</h3>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    5m - 15m Timeframes
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold flex justify-between mb-1">
                      <span>{isAr ? 'مضاعف الهدف (ATR TP Multiplier):' : 'ATR TP Target Multiplier:'}</span>
                      <span className="font-mono text-indigo-400 font-bold">{localProfile.scalpConfig?.atrTpMultiplier ?? 1.8}x</span>
                    </label>
                    <input 
                      type="range" min="1.0" max="3.0" step="0.1"
                      value={localProfile.scalpConfig?.atrTpMultiplier ?? 1.8}
                      onChange={(e) => setLocalProfile(p => ({
                        ...p,
                        scalpConfig: {
                          ...p.scalpConfig,
                          atrTpMultiplier: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold flex justify-between mb-1">
                      <span>{isAr ? 'مضاعف وقف الخسارة (ATR SL Multiplier):' : 'ATR SL Risk Multiplier:'}</span>
                      <span className="font-mono text-indigo-400 font-bold">{localProfile.scalpConfig?.atrSlMultiplier ?? 1.1}x</span>
                    </label>
                    <input 
                      type="range" min="0.8" max="2.0" step="0.1"
                      value={localProfile.scalpConfig?.atrSlMultiplier ?? 1.1}
                      onChange={(e) => setLocalProfile(p => ({
                        ...p,
                        scalpConfig: {
                          ...p.scalpConfig,
                          atrSlMultiplier: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold flex justify-between mb-1">
                      <span>{isAr ? 'صلاحية الإشارة (Signal TTL):' : 'Signal Expiry (TTL):'}</span>
                      <span className="font-mono text-indigo-400 font-bold">{localProfile.scalpConfig?.signalTtlMinutes ?? 35} {isAr ? 'دقيقة' : 'min'}</span>
                    </label>
                    <input 
                      type="range" min="15" max="90" step="5"
                      value={localProfile.scalpConfig?.signalTtlMinutes ?? 35}
                      onChange={(e) => setLocalProfile(p => ({
                        ...p,
                        scalpConfig: {
                          ...p.scalpConfig,
                          signalTtlMinutes: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Swing Profile Settings */}
              <div className="bg-slate-950 border border-blue-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">{isAr ? 'بروفايل صفقات السوينق (Swing Engine)' : 'Macro Swing Engine'}</h3>
                  </div>
                  <span className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                    1h - 4h Timeframes
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold flex justify-between mb-1">
                      <span>{isAr ? 'مضاعف الهدف الممتد (ATR TP Multiplier):' : 'Extended Swing TP Multiplier:'}</span>
                      <span className="font-mono text-indigo-400 font-bold">{localProfile.swingConfig?.atrTpMultiplier ?? 3.8}x</span>
                    </label>
                    <input 
                      type="range" min="2.5" max="6.0" step="0.1"
                      value={localProfile.swingConfig?.atrTpMultiplier ?? 3.8}
                      onChange={(e) => setLocalProfile(p => ({
                        ...p,
                        swingConfig: {
                          ...p.swingConfig,
                          atrTpMultiplier: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold flex justify-between mb-1">
                      <span>{isAr ? 'مضاعف وقف الخسارة الهيكلي (ATR SL Multiplier):' : 'Structural SL Multiplier:'}</span>
                      <span className="font-mono text-indigo-400 font-bold">{localProfile.swingConfig?.atrSlMultiplier ?? 1.8}x</span>
                    </label>
                    <input 
                      type="range" min="1.2" max="3.0" step="0.1"
                      value={localProfile.swingConfig?.atrSlMultiplier ?? 1.8}
                      onChange={(e) => setLocalProfile(p => ({
                        ...p,
                        swingConfig: {
                          ...p.swingConfig,
                          atrSlMultiplier: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold flex justify-between mb-1">
                      <span>{isAr ? 'صلاحية إشارة السوينق (Signal TTL):' : 'Swing Signal Expiry (TTL):'}</span>
                      <span className="font-mono text-indigo-400 font-bold">{(((localProfile.swingConfig?.signalTtlMinutes ?? 1440)) / 60).toFixed(0)} {isAr ? 'ساعة' : 'hours'}</span>
                    </label>
                    <input 
                      type="range" min="360" max="2880" step="120"
                      value={localProfile.swingConfig?.signalTtlMinutes ?? 1440}
                      onChange={(e) => setLocalProfile(p => ({
                        ...p,
                        swingConfig: {
                          ...p.swingConfig,
                          signalTtlMinutes: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- TAB: INTERMARKET MACRO & CORRELATIONS --- */}
      {activeTab === 'MACRO' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Macro Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-xl">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isAr ? 'المحرك الكلي وتدفقات الأصول العالمية (Intermarket Correlations)' : 'Global Intermarket Flow & Macro Intelligence'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr 
                      ? 'تحليل مؤشر الدولار DXY، عوائد السندات الأمريكية 10Y، الذهب والنفط، وتحديد نظام شهية المخاطرة لفلترة الصفقات.'
                      : 'Real-time telemetry on DXY, US 10-Year Treasury Yields, Gold, Crude Oil, and Institutional Risk Regimes.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold">
                  {macroData?.regimeNameArabic || macroData?.macroRegime || 'RISK_ON'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                  DXY: {macroData?.dxy?.trend || 'BEARISH'}
                </span>
              </div>
            </div>

            {/* Macro Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-slate-500 text-[11px] mb-1">DXY Index</div>
                <div className="font-bold text-white text-sm">{macroData?.dxy?.price?.toFixed(2) || '103.45'}</div>
                <div className={`text-[10px] ${macroData?.dxy?.trend === 'BEARISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {macroData?.dxy?.trend || 'BEARISH'}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-slate-500 text-[11px] mb-1">US 10Y Yield</div>
                <div className="font-bold text-white text-sm">{macroData?.us10y?.yield?.toFixed(2) || '4.18'}%</div>
                <div className={`text-[10px] ${macroData?.us10y?.trend === 'FALLING' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {macroData?.us10y?.trend || 'FALLING'}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-slate-500 text-[11px] mb-1">Gold Outlook</div>
                <div className="font-bold text-amber-300 text-sm">{macroData?.goldMacroBias?.bias || 'BULLISH'}</div>
                <div className="text-[10px] text-amber-400/80">Support: $2,670</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-slate-500 text-[11px] mb-1">WTI Crude</div>
                <div className="font-bold text-cyan-300 text-sm">${macroData?.oil?.price?.toFixed(2) || '72.40'}</div>
                <div className="text-[10px] text-slate-400">{macroData?.oil?.inflationPressure || 'MODERATE'}</div>
              </div>
            </div>
          </div>

          {/* Macro Synthesis & Trade Bias */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              {isAr ? 'التأثير المباشر على صفقات البوت والهجين الكمي:' : 'Direct Bot & Hybrid Trade Implications:'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-indigo-300 font-bold">XAU/USD & EUR/USD</div>
                <div className="text-slate-300 text-xs font-sans leading-relaxed">
                  {isAr 
                    ? 'ضعف مؤشر الدولار واستقرار العوائد يعطيان أولوية قصوى لصفقات الشراء LONG مع تفضيل كتل طلب FVG.'
                    : 'DXY weakness and yield softening favor LONG momentum on Gold and Euro with high Kelly multiplier.'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-cyan-300 font-bold">USD/JPY & USD/CHF</div>
                <div className="text-slate-300 text-xs font-sans leading-relaxed">
                  {isAr 
                    ? 'انخفاض العوائد يضغط على الين والفرنك نحو صفقات البيع SHORT عند مناطق فجوات العرض.'
                    : 'Yield compression favors SHORT setups on USD/JPY entering supply imbalances.'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-emerald-300 font-bold">BTC/USD & Crypto</div>
                <div className="text-slate-300 text-xs font-sans leading-relaxed">
                  {isAr 
                    ? 'بيئة Risk-On تعزز السيولة الإيجابية في العملات الرقمية مع حماية وقف الخسارة عند 1.2x ATR.'
                    : 'Risk-On climate injects positive institutional liquidity with 1.2x ATR dynamic trailing stops.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
