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
  Globe,
  ArrowRight,
  Cpu,
  Terminal,
  ShieldCheck,
  Radio,
  Gauge,
  Workflow
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
import { SecretVaultModal } from './SecretVaultModal';
import { HumanReadableTelemetry } from './HumanReadableTelemetry';
import { Lock } from 'lucide-react';

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

  const [loading, setLoading] = useState(false);
  const [macroData, setMacroData] = useState<IntermarketMacroState | null>(null);
  const [suiteData, setSuiteData] = useState<{
    sessionState?: SessionKillzoneState;
    portfolioGuard?: PortfolioExposureGuard;
    scalpSwingProfile?: ScalpSwingAlgorithmProfile;
    postMortems?: TradePostMortem[];
    sampleKelly?: KellyPositionSizeCalculation;
  }>({});

  // Quantum Trading Brain v4 State
  const [quantumStateData, setQuantumStateData] = useState<any>(null);
  const [quantumAuditLoading, setQuantumAuditLoading] = useState<boolean>(false);
  const [quantumAuditOutput, setQuantumAuditOutput] = useState<string | null>(null);
  const [liveTelemetryLogs, setLiveTelemetryLogs] = useState<string[]>([]);
  const [testSymbol, setTestSymbol] = useState<string>('EUR/USD');
  const [testDirection, setTestDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [testPrice, setTestPrice] = useState<number>(1.0850);
  const [evaluatingSignal, setEvaluatingSignal] = useState<boolean>(false);
  const [signalEvalResult, setSignalEvalResult] = useState<any>(null);

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
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Fetch Live Python QuantBrain Telemetry Logs
  const fetchLiveTelemetry = async () => {
    try {
      const res = await fetch('/api/quant-brain/telemetry?limit=80');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.logs)) {
        setLiveTelemetryLogs(data.logs);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 2500);
    return () => clearInterval(interval);
  }, []);

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

  // Master Unified Quant & Hybrid Engine Trigger (The Single Master Button)
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
        setTimeout(() => setApplyMessage(null), 8000);
      } else {
        throw new Error(data.error || 'Failed to execute unified engine');
      }
    } catch (err: any) {
      setApplyMessage(`❌ ${err.message}`);
    } finally {
      setApplyingSynergy(false);
    }
  };

  // Quantum Brain Handlers
  const fetchQuantumStatus = async () => {
    try {
      const res = await fetch('/api/quant-brain/status');
      const data = await res.json();
      if (data && data.success) {
        setQuantumStateData(data);
      }
    } catch (err) {
      console.error('Failed to fetch quant brain status:', err);
    }
  };

  useEffect(() => {
    fetchQuantumStatus();
  }, []);

  const handleTestSignalEvaluation = async () => {
    try {
      setEvaluatingSignal(true);
      const res = await fetch('/api/quant-brain/evaluate-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal: {
            symbol: testSymbol,
            direction: testDirection,
            entryPrice: testPrice,
            stopLoss: testDirection === 'LONG' ? testPrice * 0.9975 : testPrice * 1.0025,
            takeProfit1: testDirection === 'LONG' ? testPrice * 1.0050 : testPrice * 0.9950,
            timeframe: '15m'
          }
        })
      });
      const data = await res.json();
      setSignalEvalResult(data);
    } catch (err: any) {
      setSignalEvalResult({ success: false, error: err.message });
    } finally {
      setEvaluatingSignal(false);
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
      console.error('Failed to save profile:', err);
    }
  };

  const session = suiteData.sessionState;
  const guard = suiteData.portfolioGuard;
  const postMortems = suiteData.postMortems || [];
  const currentKelly = customKelly || suiteData.sampleKelly;
  const quantVector = quantumStateData?.quantumVector || {
    probBull: 0.68,
    probBear: 0.12,
    probRange: 0.20,
    entropy: 0.28,
    quantumCoherence: 0.94,
    dominantState: '|BULL⟩',
    hurstExponent: 0.62,
    hilbertPhase: 42.5
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* ========================================================================= */}
      {/* 👑 SUPREME EXECUTIVE COCKPIT & SINGLE MASTER TRIGGER (QUANTUM BRAIN v4)  */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 text-white rounded-2xl shadow-xl shadow-indigo-600/30 border border-indigo-400/40">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {isAr ? 'محرك ألبرت الكمي الموحد — Quantum Brain v4' : 'Albert Quantum Trading Brain v4'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {isAr ? 'المتحكم المركزي النشط' : 'MASTER CONTROLLER'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isAr 
                  ? 'منظومة كمية موحدة ذات تسليم وتنسيق متسلسل (Cascading Handoff Pipeline) تدمج التحليل الكلي، توافق الاستراتيجيات، جلسات السيولة، حجم كيلي الديناميكي، وحارس التعرض دون تكرار فلاتر أو Overfitting.'
                  : 'Unified Master Quantum Architecture with 5-stage Cascading Handoff Pipeline eliminating overfitting, filter loops, and cognitive fragmentation.'}
              </p>
            </div>
          </div>

          {/* Asset Selector, Vault & Quantum Live Health */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsVaultOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-800 border border-indigo-500/40 text-xs font-mono font-bold text-indigo-300 hover:text-white flex items-center gap-2 transition shadow-md"
              title={isAr ? 'خزنة الأسرار المشفرة للبروكر والمفاتيح' : 'Secure Encrypted Secret Vault'}
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'خزنة الأسرار 🔒' : 'Secret Vault 🔒'}</span>
            </button>

            <select
              value={synergySymbol}
              onChange={(e) => setSynergySymbol(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
            >
              {['XAU/USD', 'BTC/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'ETH/USD', 'SOL/USD'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Coherence: <strong>{((quantVector.quantumCoherence || 0.94) * 100).toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>

        {/* ⚡ THE SINGLE MASTER ACTION BUTTON ⚡ */}
        <div className="relative z-10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="text-xs text-slate-300 leading-relaxed text-center sm:text-start">
              <strong className="text-indigo-300 font-bold block sm:inline">
                {isAr ? 'التنفيذ الموحد بضغطة واحدة:' : 'Unified One-Click Orchestration:'}
              </strong>{' '}
              {isAr 
                ? 'إطلاق تسليم الإشارة عبر مراحل الكوانتم الخمس (نظام الحركة -> الماكرو -> الهجين -> السيولة -> حجم كيلي) وحقنها آلياً في محرك التداول.' 
                : 'Triggers seamless 5-stage handover from Hilbert-Hurst regime down to correlation-guarded fractional Kelly sizing.'}
            </div>

            <button
              id="unified-quant-brain-master-trigger-btn"
              onClick={handleUnifiedQuantTrigger}
              disabled={applyingSynergy || synergyLoading}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 border border-emerald-300/40 transition-all transform active:scale-95 flex items-center justify-center gap-2.5 shrink-0 disabled:opacity-50"
            >
              {applyingSynergy ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{isAr ? 'جارٍ التنسيق والتنفيذ الموحد...' : 'Orchestrating Cascading Handoff...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current text-slate-950" />
                  <span>{isAr ? '⚡ تشغيل وتفعيل المحرك الكمي الموحد الشامل' : '⚡ Execute Unified Quantum Brain Master Handshake'}</span>
                </>
              )}
            </button>
          </div>

          {applyMessage && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{applyMessage}</div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔄 SECTION 1: 5-STAGE CASCADING HANDOVER PIPELINE (Anti-Overfitting Design) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isAr ? 'مسار التسليم والتنسيق الخماسي (5-Stage Continuous Handoff Pipeline)' : '5-Stage Continuous Handover Pipeline'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isAr ? 'نظام تسليم سلس بدلاً من فلاتر متضاربة' : 'Anti-Overfitting Continuous Weighting'}
          </span>
        </div>

        {/* Five Cascading Handshake Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Stage 1 */}
          <div className="bg-slate-950/80 border border-indigo-900/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">
                01. REGIME
              </span>
              <span className="text-xs text-indigo-400 font-mono font-bold">H: {(quantVector.hurstExponent || 0.62).toFixed(2)}</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{isAr ? 'نظام هيرست وهيبلرت' : 'Hurst & Hilbert State'}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isAr ? 'تحديد حالة السوق (اتجاه، ارتداد، عشوائية) دون حجب قاطع.' : 'Quantifies persistence vs mean-reversion smoothly.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
              Dominant: <strong>{quantVector.dominantState || '|BULL⟩'}</strong>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-950/80 border border-teal-900/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800/40">
                02. MACRO
              </span>
              <span className="text-xs text-teal-400 font-mono font-bold">DXY: {macroData?.dxy?.trend || 'BEARISH'}</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{isAr ? 'التدفق الكلي (Macro Flow)' : 'Intermarket Confluence'}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isAr ? 'تأكيد تدفقات الدولار وعوائد السندات لتغذية وزن الصفقة.' : 'Continuously weights DXY, 10Y Yields, and Gold bias.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-teal-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
              Regime: <strong>{macroData?.regimeNameArabic || macroData?.macroRegime || 'RISK_ON'}</strong>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-slate-950/80 border border-amber-900/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800/40">
                03. ALPHA
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">{synergyMatrix?.synergyScore ?? 92}/100</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{isAr ? 'توليف الهيكل وألفا' : 'Smart Money Synergy'}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isAr ? 'تنسيق كتل الأوامر FVG واصطياد السيولة بدقة.' : 'Harmonizes Order Blocks, FVG, & Sweeps into singular alpha.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-amber-300 bg-slate-900 p-2 rounded-lg border border-slate-800 truncate">
              Wyckoff: <strong>{synergyMatrix?.deconstructedModules?.wyckoffPhase || 'Accumulation'}</strong>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-slate-950/80 border border-purple-900/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                04. TIMING
              </span>
              <span className="text-xs text-purple-400 font-mono font-bold">{(session?.confluenceMultiplier ?? 1.35).toFixed(2)}x</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{isAr ? 'جلسات البنوك و Killzones' : 'Bank Session Timing'}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isAr ? 'مضاعف التوقيت المؤسساتي (لندن/نيويورك) بدلاً من الإيقاف التعسفي.' : 'Scales conviction dynamically per session volume.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-purple-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
              {session?.isKillzoneActive ? (isAr ? '🔥 Killzone نشطة' : '🔥 Active Killzone') : (isAr ? '🟢 جلسة قياسية' : '🟢 Standard')}
            </div>
          </div>

          {/* Stage 5 */}
          <div className="bg-slate-950/80 border border-emerald-900/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                05. SIZING
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">Max 0.05 Lot</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{isAr ? 'حجم كيلي وحارس التعرض' : 'Kelly & Correlation Guard'}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isAr ? 'حساب حجم اللوت رياضياً مع احترام سقف مخاطرة العملة.' : 'Calculates mathematical lot size bounded by portfolio caps.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
              Lot: <strong>{currentKelly?.calculatedLotSize ?? 0.01} Lot</strong>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚛️ SECTION 2: QUANTUM STATE VECTOR & LIVE DAEMON TELEMETRY                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quantum State Vector Display */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                {isAr ? 'المتجه الكمي للحالة السوقية (Quantum State Vector)' : 'Quantum Market State Vector'}
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800/40">
              Von Neumann Entropy: {(quantVector.entropy || 0.28).toFixed(3)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-900/40">
              <div className="text-[10px] text-slate-400">{isAr ? 'احتمالية الصعود |BULL⟩' : 'Prob Bull |BULL⟩'}</div>
              <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                {((quantVector.probBull || 0.68) * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${(quantVector.probBull || 0.68) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-rose-900/40">
              <div className="text-[10px] text-slate-400">{isAr ? 'احتمالية الهبوط |BEAR⟩' : 'Prob Bear |BEAR⟩'}</div>
              <div className="text-xl font-mono font-black text-rose-400 mt-1">
                {((quantVector.probBear || 0.12) * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-rose-400 h-full" style={{ width: `${(quantVector.probBear || 0.12) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-blue-900/40">
              <div className="text-[10px] text-slate-400">{isAr ? 'احتمالية التذبذب |RANGE⟩' : 'Prob Range |RANGE⟩'}</div>
              <div className="text-xl font-mono font-black text-blue-400 mt-1">
                {((quantVector.probRange || 0.20) * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-400 h-full" style={{ width: `${(quantVector.probRange || 0.20) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">{isAr ? 'معامل هيرست (Hurst Exponent):' : 'Hurst Exponent (H):'}</span>
              <span className="font-bold text-white">{(quantVector.hurstExponent || 0.62).toFixed(2)} ({quantVector.hurstExponent > 0.55 ? 'Trending' : 'Mean-Revert'})</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">{isAr ? 'طور هيبلرت اللحظي:' : 'Hilbert Phase Angle:'}</span>
              <span className="font-bold text-cyan-300">{quantVector.hilbertPhase ? quantVector.hilbertPhase.toFixed(1) : '42.5'}°</span>
            </div>
          </div>

          {/* Quick Signal Auditing Playground */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">{isAr ? 'مختبر اختبار وتقييم الإشارات اللحظي:' : 'Signal Evaluator:'}</span>
              <span className="text-[10px] font-mono text-slate-500">{testSymbol}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <input 
                type="text" 
                value={testSymbol} 
                onChange={(e) => setTestSymbol(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                placeholder="Symbol"
              />
              <select 
                value={testDirection} 
                onChange={(e: any) => setTestDirection(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
              >
                <option value="LONG">LONG (شراء)</option>
                <option value="SHORT">SHORT (بيع)</option>
              </select>
              <button 
                onClick={handleTestSignalEvaluation}
                disabled={evaluatingSignal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg px-2 py-2 text-xs transition disabled:opacity-50"
              >
                {evaluatingSignal ? (isAr ? 'جارٍ التقييم...' : 'Auditing...') : (isAr ? 'تقييم الإشارة ⚛️' : 'Evaluate ⚛️')}
              </button>
            </div>

            {signalEvalResult && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                <div className="flex justify-between font-bold">
                  <span>Audit Verdict:</span>
                  <span className={signalEvalResult.isApproved ? 'text-emerald-400' : 'text-rose-400'}>
                    {signalEvalResult.verdict || (signalEvalResult.isApproved ? 'APPROVED' : 'REJECTED')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Optimal Lot: <strong className="text-white">{signalEvalResult.kellyMetrics?.optimalLotSize ?? 0.01}</strong> | Coherence: <strong className="text-cyan-300">{((signalEvalResult.quantumState?.quantumCoherence ?? 0.9) * 100).toFixed(0)}%</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Human-Readable Python Daemon Telemetry Stream */}
        <div className="lg:col-span-6">
          <HumanReadableTelemetry onOpenVault={() => setIsVaultOpen(true)} />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 📊 SECTION 3: STRUCTURAL ALPHA & SMART MONEY CONFLUENCE DECONSTRUCTION     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isAr ? `توليفة ألفا وهيكل السيولة الذكية — ${synergySymbol}` : `Structural Alpha & Smart Money Synergy — ${synergySymbol}`}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-800/40">
            {synergyMatrix?.hybridAlphaSynthesis?.winningHybridNameArabic || 'Quantum Adaptive Trend Hunter'}
          </span>
        </div>

        {synergyMatrix ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: SMC Components */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>{isAr ? 'عناصر السيولة والهيكل المؤسساتي (SMC)' : 'SMC Structural Modules'}</span>
                <span className="font-mono text-indigo-400 font-bold">{synergyMatrix.deconstructedModules.totalStructuralScore}/100</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Order Block (كتل الأوامر):</span>
                    <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.orderBlockScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.orderBlockScore}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Fair Value Gap (الفجوات السعرية):</span>
                    <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.fairValueGapScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.fairValueGapScore}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Liquidity Sweep (اصطياد السيولة):</span>
                    <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.liquiditySweepScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.liquiditySweepScore}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Volume POC (نقطة السيطرة الحجمية):</span>
                    <span className="font-mono text-white font-bold">{synergyMatrix.deconstructedModules.volumePocScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${synergyMatrix.deconstructedModules.volumePocScore}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Mathematical Risk Engineering */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>{isAr ? 'الهندسة الرياضية ونسبة العائد للمخاطرة' : 'Mathematical Expectancy & Risk'}</span>
                <span className="font-mono text-emerald-400 font-bold">EV: +{synergyMatrix.quantumEngineering.expectedValueEV.toFixed(2)}</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">{isAr ? 'اللوت المحسوب:' : 'Optimal Kelly:'}</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">{synergyMatrix.quantumEngineering.optimalKellyLot} Lots</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">{isAr ? 'سقف الأمان الأقصى:' : 'Hard Cap:'}</div>
                  <div className="text-base font-black text-amber-400 mt-0.5">{synergyMatrix.quantumEngineering.maxSafeLotCap} Lots</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">{isAr ? 'عائد/مخاطرة R:R:' : 'Risk/Reward:'}</div>
                  <div className="text-base font-bold text-white mt-0.5">1:{synergyMatrix.quantumEngineering.riskRewardRatio}</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">{isAr ? 'نسبة شارب التقديرية:' : 'Sharpe:'}</div>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">{synergyMatrix.quantumEngineering.projectedSharpe.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Column 3: Hybrid Alpha Execution Blueprint */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>{isAr ? 'إرشادات التنفيذ وتأمين الأرباح' : 'Execution & Trailing Targets'}</span>
                <span className="font-mono text-cyan-400 font-bold">Alpha +{synergyMatrix.hybridAlphaSynthesis.alphaVsBaselinePct}%</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'الوقف المتتابع المقترح:' : 'Trailing Stop ATR:'}</span>
                  <span className="font-mono font-bold text-cyan-300">{synergyMatrix.hybridAlphaSynthesis.recommendedTrailingStopATR}x ATR</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'هدف جني الأرباح المقترح:' : 'Take Profit ATR:'}</span>
                  <span className="font-mono font-bold text-emerald-300">{synergyMatrix.hybridAlphaSynthesis.recommendedTakeProfitATR}x ATR</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'توافق الماكرو الإجمالي:' : 'Macro Score:'}</span>
                  <span className="font-mono font-bold text-amber-300">{synergyMatrix.hybridAlphaSynthesis.intermarketMacroScore}%</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            {isAr ? 'جارٍ احتساب مصفوفة التوافق الكمي والهندسي...' : 'Computing Synergy Matrix...'}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🌍 SECTION 4: GLOBAL MACRO FLOWS & BANK KILLZONES SYNCHRONIZER           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Macro Telemetry */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                {isAr ? 'المحرك الكلي وتدفقات الأصول (Global Macro Flow)' : 'Global Intermarket Macro Flow'}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 text-xs font-mono font-bold border border-indigo-800/40">
              {macroData?.regimeNameArabic || macroData?.macroRegime || 'RISK_ON'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-500 text-[10px] mb-1">DXY Dollar</div>
              <div className="font-bold text-white text-sm">{macroData?.dxy?.price?.toFixed(2) || '103.45'}</div>
              <div className={`text-[10px] ${macroData?.dxy?.trend === 'BEARISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {macroData?.dxy?.trend || 'BEARISH'}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-500 text-[10px] mb-1">US 10Y Yield</div>
              <div className="font-bold text-white text-sm">{macroData?.us10y?.yield?.toFixed(2) || '4.18'}%</div>
              <div className={`text-[10px] ${macroData?.us10y?.trend === 'FALLING' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {macroData?.us10y?.trend || 'FALLING'}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-500 text-[10px] mb-1">Gold Sentiment</div>
              <div className="font-bold text-amber-300 text-sm">{macroData?.goldMacroBias?.bias || 'BULLISH'}</div>
              <div className="text-[10px] text-amber-400/80">Support: $2,670</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-500 text-[10px] mb-1">WTI Crude</div>
              <div className="font-bold text-cyan-300 text-sm">${macroData?.oil?.price?.toFixed(2) || '72.40'}</div>
              <div className="text-[10px] text-slate-400">{macroData?.oil?.inflationPressure || 'MODERATE'}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
            <strong className="text-indigo-300">{isAr ? 'تأثير الماكرو على الصفقات:' : 'Macro Implication:'}</strong>{' '}
            {isAr 
              ? 'تراجع عوائد السندات وضعف مؤشر الدولار DXY يدعمان زخم صفقات الشراء LONG على الذهب والعملات الأوروبية بحجم لوت كامل.'
              : 'Softening US yields and DXY weakness provide clear positive drift for Gold and Euro LONG setups.'}
          </div>
        </div>

        {/* Bank Sessions & Killzones Clock */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                {isAr ? 'جلسات السيولة وتوقيت البنوك المركزية' : 'Bank Sessions & Institutional Killzones'}
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              {session?.currentTimeGMT || '14:25:00'} GMT
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { name: isAr ? 'افتتاح لندن واليورو (London Open)' : 'London Open Killzone', gmt: '07:00 - 10:00 GMT', boost: '1.30x', active: !!session?.activeSessionName?.includes('London') },
              { name: isAr ? 'افتتاح نيويورك وسيولة وول ستريت (NY Open)' : 'New York Open Killzone', gmt: '12:00 - 15:00 GMT', boost: '1.35x', active: !!session?.activeSessionName?.includes('NY') },
              { name: isAr ? 'الجلسة الآسيوية وحماية الركود (Asian Deadzone)' : 'Asian Deadzone Filter', gmt: '21:00 - 05:00 GMT', boost: '0.70x', active: !!session?.deadzoneActive, deadzone: true }
            ].map((s, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  s.active 
                    ? 'bg-amber-500/10 border-amber-500/40' 
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.active ? 'bg-amber-400 animate-ping' : s.deadzone ? 'bg-rose-500' : 'bg-slate-600'}`} />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {s.name}
                      {s.active && <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded">{isAr ? 'نشط الآن' : 'ACTIVE'}</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.gmt}</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-xs text-indigo-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  {s.boost} Confluence
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-800/30 rounded-xl text-xs text-amber-200">
            {isAr 
              ? 'يتم تعزيز قوة الإشارة تلقائياً أثناء فترات تداخل السيولة المؤسساتية، وخفض حجم اللوت في فترات الركود لتفادي اتساع السبريد.'
              : 'Signal conviction scales dynamically during bank liquidity overlaps while scaling down in low-volume sessions.'}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🛡️ SECTION 5: FRACTIONAL KELLY SIZING, EXPOSURE GUARD & PROFILE TUNER      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Kelly Interactive Sizing */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                {isAr ? 'حساب حجم اللوت الديناميكي (Fractional Kelly)' : 'Dynamic Fractional Kelly Position Sizing'}
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/40">
              {currentKelly?.calculatedLotSize ?? 0.01} Lot Max 0.05
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">{isAr ? 'اللوت المحسوب للصفقة:' : 'Recommended Trade Lot:'}</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {currentKelly?.calculatedLotSize ?? 0.01} <span className="text-xs font-normal text-slate-400">Lots</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">${(currentKelly?.recommendedRiskUSD ?? 3.0).toFixed(2)} Risk USD</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">{isAr ? 'نسبة كيلي المطبقة:' : 'Fractional Kelly Scale:'}</div>
              <div className="text-3xl font-black text-indigo-400 font-mono mt-1">
                {((calcFractional) * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{(currentKelly?.fractionalKellyPct ?? 1.5).toFixed(2)}% of Balance</div>
            </div>
          </div>

          {/* Interactive Sliders for Kelly */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>{isAr ? 'رأس مال الحساب:' : 'Account Balance:'}</span>
                <span className="font-mono text-indigo-400 font-bold">${calcBalance}</span>
              </div>
              <input 
                type="range" min="50" max="2000" step="50" value={calcBalance}
                onChange={(e) => setCalcBalance(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>{isAr ? 'مقياس كيلي الجزئي (Fractional Scale):' : 'Fractional Kelly Scale:'}</span>
                <span className="font-mono text-blue-400 font-bold">{(calcFractional * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="0.6" step="0.05" value={calcFractional}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCalcFractional(val);
                  onUpdateSettings({ fractionalKellyScale: val });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Portfolio Exposure Guard & Scalp/Swing Controls */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                {isAr ? 'حارس التعرض للعملات وإعدادات النمط' : 'Currency Exposure & Algorithmic Profile'}
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              Risk: {(guard?.totalRiskPct ?? 0).toFixed(1)}% / {(guard?.maxPortfolioRiskLimitPct ?? 6)}%
            </span>
          </div>

          {/* Currency Exposure Meters */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            {['USD', 'EUR', 'GBP', 'XAU'].map(curr => {
              const exp = guard?.currencyExposures?.[curr] || { totalRiskPct: curr === 'XAU' ? 1.5 : 0.8, status: 'SAFE' };
              return (
                <div key={curr} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{curr}</div>
                  <div className="font-bold text-white mt-0.5">{(exp.totalRiskPct || 0).toFixed(1)}%</div>
                  <div className="w-full bg-slate-900 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (exp.totalRiskPct / 3.5) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scalp & Swing Tuners Inline */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                {isAr ? 'ضبط مضاعفات الـ ATR (Scalp vs Swing):' : 'ATR Multipliers & Profile:'}
              </span>
              <button
                onClick={handleSaveProfile}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                {saveSuccess ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ' : 'Save')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Scalp TP / SL ATR:</div>
                <div className="text-white font-bold mt-0.5">{localProfile.scalpConfig?.atrTpMultiplier ?? 1.8}x / {localProfile.scalpConfig?.atrSlMultiplier ?? 1.1}x</div>
              </div>

              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Swing TP / SL ATR:</div>
                <div className="text-white font-bold mt-0.5">{localProfile.swingConfig?.atrTpMultiplier ?? 3.8}x / {localProfile.swingConfig?.atrSlMultiplier ?? 1.8}x</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🔬 SECTION 6: TRADE ANATOMY & SELF-CORRECTION (MAE / MFE POST-MORTEM)     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isAr ? 'تشريح الصفقات المغلقة والتغذية الراجعة (Post-Trade MAE & MFE Analytics)' : 'Trade Anatomy & Post-Mortem Analytics'}
            </h3>
          </div>
          <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-3 py-1 rounded-xl border border-purple-800/40">
            {postMortems.length} {isAr ? 'صفقات مشرحة' : 'Analyzed Trades'}
          </span>
        </div>

        {postMortems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            <Award className="w-8 h-8 mx-auto mb-2 text-purple-400/40" />
            {isAr 
              ? 'لا توجد صفقات مغلقة حالياً. يقوم المحرك بتشريح الصفقات المغلقة تلقائياً لتحديث نماذج الأمان ومنع الـ Overfitting.'
              : 'No closed trades yet. Automated post-mortems will continuously tune parameters against overfitting.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postMortems.slice(0, 2).map((pm) => (
              <div key={pm.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${pm.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {pm.direction}
                    </span>
                    <span className="text-xs font-bold text-white">{pm.symbol}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${(pm.realizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(pm.realizedPnL ?? 0) >= 0 ? `+$${(pm.realizedPnL ?? 0).toFixed(2)}` : `-$${Math.abs(pm.realizedPnL ?? 0).toFixed(2)}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-500">MFE (الامتداد):</div>
                    <div className="text-emerald-400 font-bold mt-0.5">+{pm.maxFavorableExcursionPips ?? 25} Pips</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-500">MAE (التراجع):</div>
                    <div className="text-amber-400 font-bold mt-0.5">-{pm.maxAdverseExcursionPips ?? 5} Pips</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-500">Execution Grade:</div>
                    <div className="text-indigo-300 font-bold mt-0.5">{pm.efficiencyRating || 'A+'} ({pm.executionQualityScore ?? 95}/100)</div>
                  </div>
                </div>

                <div className="text-[11px] text-purple-200 bg-purple-950/30 p-2 rounded-lg border border-purple-800/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{pm.actionableTakeaway || (isAr ? 'تنفيذ نظيف بدقة متناهية دون انزلاق سعري ملحوظ.' : 'Optimal execution with near-zero slippage.')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secret Vault Modal */}
      <SecretVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
      />

    </div>
  );
};
