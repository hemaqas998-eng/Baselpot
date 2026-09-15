import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Layers, 
  Target, 
  Compass, 
  AlertCircle,
  Activity,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Flame,
  Bot,
  Sliders,
  Play,
  Briefcase,
  Radio,
  BrainCircuit,
  MessageSquare,
  BarChart2,
  Maximize2,
  ShieldAlert,
  Cpu,
  Calculator,
  SlidersHorizontal,
  Coins
} from 'lucide-react';
import { 
  MarketSymbol, 
  RadarSignal, 
  PaperTrade, 
  BotStatus, 
  DualAiConsensusResult,
  TradeManagementEvaluation,
  GeminiMasterScreenerFilter
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AiNextMoveView } from './AiNextMoveView';
import { CryptoHubView } from './CryptoHubView';

interface GeminiMasterCenterProps {
  symbols: MarketSymbol[];
  signals: RadarSignal[];
  trades: PaperTrade[];
  status: BotStatus | null;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart: (symbol: string, timeframe: string) => void;
  onRefreshData: () => void;
  accountBalance?: number;
  onOpenAiAnalysis?: (signal: RadarSignal) => void;
  onExecuteTrade?: (signal: RadarSignal) => void;
  onSendTelegram?: (signal: RadarSignal) => void;
  sendingTelegramId?: string | null;
}

export const GeminiMasterCenter: React.FC<GeminiMasterCenterProps> = ({
  symbols,
  signals,
  trades,
  status,
  selectedSymbol,
  onSelectSymbol,
  onOpenChart,
  onRefreshData,
  accountBalance = 50,
  onOpenAiAnalysis,
  onExecuteTrade,
  onSendTelegram,
  sendingTelegramId = null,
}) => {
  const { t, language } = useLanguage();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'dual-consensus' | 'trade-manager' | 'next-move' | 'crypto-hub'>('dual-consensus');

  // Filters & State
  const [filters, setFilters] = useState<GeminiMasterScreenerFilter>({
    minWinRate: 75,
    minConfidence: 78,
    minRR: 1.5,
    assetClass: 'ALL',
    timeframe: 'ALL',
    min10xScore: 8.0,
    searchQuery: ''
  });

  const [consensusList, setConsensusList] = useState<DualAiConsensusResult[]>([]);
  const [tradeEvaluations, setTradeEvaluations] = useState<TradeManagementEvaluation[]>([]);
  const [isLoadingConsensus, setIsLoadingConsensus] = useState<boolean>(false);
  const [evaluatingTrades, setEvaluatingTrades] = useState<boolean>(false);
  const [executingSymbol, setExecutingSymbol] = useState<string | null>(null);
  const [applyingProtectionId, setApplyingProtectionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Dual-AI Batch Screener
  const fetchDualAiBatch = async () => {
    setIsLoadingConsensus(true);
    setToastMessage(null);
    try {
      // Trigger scan first
      await fetch('/api/radar/scan-now', { method: 'POST' }).catch(() => {});
      
      const res = await fetch('/api/ai/dual-screen-all');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.results)) {
        setConsensusList(data.results);
      }
    } catch (err: any) {
      console.error('Failed to fetch Dual-AI batch:', err);
    } finally {
      setIsLoadingConsensus(false);
    }
  };

  // Fetch Active Trade Protections (Auto Break-Even & Trailing Stop)
  const fetchTradeProtections = async () => {
    setEvaluatingTrades(true);
    try {
      const res = await fetch('/api/ai/dual-manage-trades');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.evaluations)) {
        setTradeEvaluations(data.evaluations);
      }
    } catch (err: any) {
      console.error('Failed to fetch trade protections:', err);
    } finally {
      setEvaluatingTrades(false);
    }
  };

  // Execute Dual-AI Consensus Trade into live broker engine
  const handleExecuteConsensus = async (item: DualAiConsensusResult) => {
    if (item.consensusDirection === 'WAIT' || item.vetoCondition?.isVetoed) {
      setToastMessage(language === 'ar' ? '⚠️ لا يمكن تنفيذ صفقة معلقة أو محظورة لحماية رأس المال.' : 'Cannot execute vetoed trade.');
      return;
    }

    setExecutingSymbol(item.symbol);
    setToastMessage(null);
    try {
      const res = await fetch('/api/radar/hunt-sniper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: item.symbol,
          direction: item.consensusDirection === 'BUY' ? 'LONG' : 'SHORT',
          timeframe: '15m',
          lotSize: item.synthesisPlan.suggestedLot,
          stopLoss: item.synthesisPlan.stopLoss,
          takeProfit1: item.synthesisPlan.takeProfit1,
          rationale: `تنفيذ ثنائي معتمد [Gemini + DeepSeek] EV: +${item.deepSeekAudit.expectedValueEV}R | تأمين الوقف عند: $${item.synthesisPlan.autoBreakEvenThreshold}`
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setToastMessage(language === 'ar' 
          ? `✅ تم تنفيذ صفقة ${item.symbol} (${item.consensusDirection}) بحجم ${item.synthesisPlan.suggestedLot} لوت وتفعيل حارس نقطة الدخول!`
          : `✅ Executed ${item.symbol} (${item.consensusDirection}) with ${item.synthesisPlan.suggestedLot} lot & Auto Break-Even armed!`);
        onRefreshData();
        fetchTradeProtections();
      } else {
        setToastMessage(data.message || 'تعذر تنفيذ الصفقة');
      }
    } catch (err: any) {
      setToastMessage(`خطأ في التنفيذ: ${err.message}`);
    } finally {
      setExecutingSymbol(null);
    }
  };

  // Apply Live Stop Loss Protection (Move to Break-Even / Trail Stop)
  const handleApplyProtection = async (evalItem: TradeManagementEvaluation) => {
    setApplyingProtectionId(evalItem.tradeId);
    try {
      const res = await fetch('/api/ai/dual-apply-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId: evalItem.tradeId,
          proposedStopLoss: evalItem.proposedStopLoss,
          reason: evalItem.reasonArabic
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setToastMessage(data.message);
        onRefreshData();
        fetchTradeProtections();
      }
    } catch (err: any) {
      setToastMessage(`خطأ في تطبيق الحماية: ${err.message}`);
    } finally {
      setApplyingProtectionId(null);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchDualAiBatch();
    fetchTradeProtections();
  }, []);

  // Filtered Consensus List
  const filteredConsensus = consensusList.filter(item => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toUpperCase();
      if (!item.symbol.toUpperCase().includes(q)) return false;
    }
    if (filters.assetClass && filters.assetClass !== 'ALL') {
      const symObj = symbols.find(s => s.symbol === item.symbol);
      if (symObj && symObj.assetClass && symObj.assetClass.toUpperCase() !== filters.assetClass.toUpperCase()) return false;
    }
    return true;
  });

  const primeCount = consensusList.filter(c => c.consensusGrade === 'AAA_PRIME').length;
  const vetoCount = consensusList.filter(c => c.vetoCondition?.isVetoed).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. DUAL-AI MASTER COMMAND BANNER (Gemini + DeepSeek) */}
      <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-4 sm:p-5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161f33] text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                {language === 'ar' ? 'الذكاء الثنائي (Gemini + DeepSeek)' : 'DUAL-AI ENGINE (GEMINI + DEEPSEEK)'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                {language === 'ar' ? 'حلقة تدقيق مشتركة • صفر تعارض' : 'CROSS-VERIFICATION ACTIVE'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/40 font-bold uppercase">
                {language === 'ar' ? 'تأمين نقطة الدخول (Auto BE)' : 'AUTO BREAK-EVEN ARMED'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
              {language === 'ar' 
                ? 'مركز القيادة الثنائي: تدفق السيولة المؤسسية والتدقيق الرياضي'
                : 'DUAL-AI COMMAND: INSTITUTIONAL SMC & QUANTITATIVE AUDIT'}
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {language === 'ar'
                ? 'تحليل الهيكل السعري وتدفق السيولة (Gemini) مع المحاكاة الرياضية للقيمة المتوقعة (+EV) وإدارة المخاطر الصارمة (DeepSeek).'
                : 'SMC orderflow analysis and liquidity mapping cross-checked with mathematical EV auditing and strict position sizing.'}
            </p>
          </div>

          {/* MASTER TRIGGER BUTTON */}
          <div className="shrink-0 flex flex-col gap-2 min-w-[260px]">
            <button
              id="dual-ai-master-trigger-btn"
              onClick={() => {
                fetchDualAiBatch();
                fetchTradeProtections();
              }}
              disabled={isLoadingConsensus}
              className="px-4 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs border border-emerald-400/40 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <Cpu className={`w-4 h-4 text-emerald-100 ${isLoadingConsensus ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="text-xs font-bold font-mono uppercase tracking-wider">
                  {isLoadingConsensus 
                    ? (language === 'ar' ? 'جارٍ التدقيق والمطابقة...' : 'CROSS-VERIFYING MODELS...') 
                    : (language === 'ar' ? 'فحص وتدقيق ثنائي فوري' : 'RUN DUAL-AI AUDIT')}
                </div>
              </div>
            </button>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>{language === 'ar' ? 'فرص معتمدة:' : 'Prime:'} <strong className="text-emerald-400 tabular-nums">{primeCount} Approved</strong></span>
              <span>{language === 'ar' ? 'محظورة بالأمان:' : 'Vetoed:'} <strong className="text-rose-400 tabular-nums">{vetoCount} Protected</strong></span>
            </div>
          </div>
        </div>

        {/* Real-time Status Metric Chips */}
        <div className="mt-4 pt-3.5 border-t border-[#1c2233] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="bg-[#090b10] border border-[#1c2233] rounded p-2.5 flex items-center justify-between">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'ar' ? 'نموذج السيولة:' : 'LIQUIDITY MODEL:'}</span>
            </span>
            <span className="font-bold text-slate-200 text-[11px]">Gemini 2.5 Pro (SMC)</span>
          </div>

          <div className="bg-[#090b10] border border-[#1c2233] rounded p-2.5 flex items-center justify-between">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
              <Calculator className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'ar' ? 'نموذج الرياضيات:' : 'MATH MODEL:'}</span>
            </span>
            <span className="font-bold text-slate-200 text-[11px]">DeepSeek (+EV Audit)</span>
          </div>

          <div className="bg-[#090b10] border border-[#1c2233] rounded p-2.5 flex items-center justify-between">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ar' ? 'حارس الصفقات:' : 'TRADE SHIELD:'}</span>
            </span>
            <span className="font-bold text-emerald-400 text-[11px]">Auto BE Active</span>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded bg-[#10141f] border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-[#1c2233] pb-2.5 gap-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('dual-consensus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap border ${
              activeTab === 'dual-consensus'
                ? 'bg-[#182033] text-white border-emerald-500/50'
                : 'bg-[#0e1118] text-slate-400 hover:text-slate-200 border-[#1c2233]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-300" />
            <span>{language === 'ar' ? 'التوافق المعتمد (AAA Prime)' : 'DUAL-AI CONSENSUS'}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#111624] text-cyan-300 font-bold tabular-nums">
              {filteredConsensus.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trade-manager');
              fetchTradeProtections();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap border ${
              activeTab === 'trade-manager'
                ? 'bg-[#182033] text-white border-emerald-500/50'
                : 'bg-[#0e1118] text-slate-400 hover:text-slate-200 border-[#1c2233]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ar' ? 'حارس الصفقات (Auto BE)' : 'TRADE SHIELD'}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#111624] text-emerald-300 font-bold tabular-nums">
              {trades.filter(t => t.status === 'OPEN').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('next-move')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap border ${
              activeTab === 'next-move'
                ? 'bg-[#182033] text-white border-emerald-500/50'
                : 'bg-[#0e1118] text-slate-400 hover:text-slate-200 border-[#1c2233]'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'ar' ? 'فاحص الحركة القادمة' : 'AI NEXT MOVE'}</span>
          </button>

          <button
            onClick={() => setActiveTab('crypto-hub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap border ${
              activeTab === 'crypto-hub'
                ? 'bg-[#182033] text-amber-300 border-amber-500/50'
                : 'bg-[#0e1118] text-slate-400 hover:text-slate-200 border-[#1c2233]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'سوق الكريبتو المستقل (Top 100 💎)' : 'CRYPTO MARKET (TOP 100)'}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              CRYPTO
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            fetchDualAiBatch();
            fetchTradeProtections();
          }}
          className="p-1.5 rounded bg-[#0e1118] hover:bg-[#161e30] text-slate-400 hover:text-white border border-[#1c2233] transition"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConsensus ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB 1: DUAL-AI CONSENSUS CARDS */}
      {activeTab === 'dual-consensus' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: language === 'ar' ? 'الأصول القابلة للتداول' : 'TRADEABLE ASSETS' },
                { id: 'CRYPTO', label: language === 'ar' ? 'العملات الرقمية' : 'CRYPTO' },
                { id: 'FOREX', label: language === 'ar' ? 'الفوركس' : 'FOREX' },
                { id: 'COMMODITIES', label: language === 'ar' ? 'الذهب والسلع' : 'COMMODITIES' },
                { id: 'INDICES', label: language === 'ar' ? 'مؤشرات القوة (تحليل 📊)' : 'INDICES (MACRO)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilters({ ...filters, assetClass: tab.id as any })}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition whitespace-nowrap border ${
                    filters.assetClass === tab.id
                      ? 'bg-[#182033] text-white border-emerald-500/50'
                      : 'bg-[#090b10] text-slate-400 hover:text-slate-200 border-[#1c2233]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن زوج (XAU, BTC, EUR)...' : 'SEARCH SYMBOL...'}
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-[#090b10] text-white text-xs pl-8 pr-3 py-1.5 rounded border border-[#1c2233] focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Indices Macro Compass Banner */}
          {filters.assetClass === 'INDICES' && (
            <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 flex items-start gap-3">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold font-mono text-cyan-300 uppercase">
                  {language === 'ar' 
                    ? 'بوصلة المؤشرات وسرد السيولة الكلية (تحليل القوة فقط)'
                    : 'MACRO INDICES & RELATIVE STRENGTH GAUGES (ANALYSIS ONLY)'}
                </div>
                <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                  {language === 'ar'
                    ? 'المؤشرات العالمية (DXY, US10Y, VIX, US30, US100, US500, GER40, UK100) تُستخدم حصرياً في النظام لقياس القوة النسبية للعملات وتحديد اتجاه شهية المخاطرة الكلية وتدفق السيولة. لا يقوم البوت بإرسال أو تنفيذ صفقات تداول مباشرة عليها لضمان أقصى درجات انضباط إدارة المخاطر.'
                    : 'Global indices are used strictly as reference barometers to calculate currency strength, intermarket correlations, and macro regimes. Automated trade execution is strictly disabled on indices.'}
                </p>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredConsensus.map((item) => {
              const isBuy = item.consensusDirection === 'BUY';
              const isSell = item.consensusDirection === 'SELL';
              const isWait = item.consensusDirection === 'WAIT';
              const isVetoed = item.vetoCondition?.isVetoed;
              const isExecuting = executingSymbol === item.symbol;

              return (
                <div 
                  key={item.symbol}
                  className={`bg-[#0e1118] border rounded-lg p-4 transition relative overflow-hidden flex flex-col justify-between gap-3.5 ${
                    isVetoed
                      ? 'border-rose-500/40'
                      : item.consensusGrade === 'AAA_PRIME'
                        ? 'border-emerald-500/40 hover:border-emerald-400'
                        : 'border-[#1c2233] hover:border-[#2a344d]'
                  }`}
                >
                  {/* Top Header: Symbol & Grade */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded ${
                        isBuy ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' :
                        isSell ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30' :
                        'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isBuy ? <ArrowUpRight className="w-5 h-5" /> : isSell ? <ArrowDownRight className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-white text-base">{item.symbol}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono uppercase ${
                            isBuy ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' :
                            isSell ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30' :
                            'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.consensusDirection}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {language === 'ar' ? 'السعر:' : 'PRICE:'} <strong className="text-white tabular-nums">${item.synthesisPlan.entryPrice}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border uppercase ${
                        isVetoed ? 'bg-rose-950/60 text-rose-300 border-rose-500/50' :
                        item.consensusGrade === 'AAA_PRIME' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50' :
                        item.consensusGrade === 'AA_HIGH_CONFLUENCE' ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50' :
                        'bg-[#121622] text-slate-300 border-[#1e2538]'
                      }`}>
                        {item.consensusGrade.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[10px] font-mono text-cyan-400 font-bold mt-1 tabular-nums">
                        {item.consensusScore}% {language === 'ar' ? 'توافق' : 'CONFLUENCE'}
                      </div>
                    </div>
                  </div>

                  {/* Dual-AI Analysis Side-by-Side Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    
                    {/* Gemini Column */}
                    <div className="bg-[#090b10] p-2.5 rounded border border-[#1c2233] space-y-1">
                      <div className="flex items-center justify-between text-indigo-300 font-bold text-[10px]">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3 text-indigo-400" />
                          <span>Gemini 2.5 Pro</span>
                        </span>
                        <span className="text-[10px] text-indigo-400">{item.geminiInsight.bias}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans line-clamp-2 leading-relaxed">
                        {item.geminiInsight.executiveSummary}
                      </p>
                      <div className="text-[9px] text-slate-400 pt-1 border-t border-[#141924] flex justify-between">
                        <span>{language === 'ar' ? 'كتلة السيولة SMC:' : 'LIQUIDITY ZONE:'}</span>
                        <strong className="text-indigo-300 truncate max-w-[120px]">{item.geminiInsight.liquidityZone || 'Active OB'}</strong>
                      </div>
                    </div>

                    {/* DeepSeek Column */}
                    <div className="bg-[#090b10] p-2.5 rounded border border-[#1c2233] space-y-1">
                      <div className="flex items-center justify-between text-teal-300 font-bold text-[10px]">
                        <span className="flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-teal-400" />
                          <span>DeepSeek Math</span>
                        </span>
                        <span className="text-[10px] text-teal-400 tabular-nums">+EV = {item.deepSeekAudit.expectedValueEV}R</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans line-clamp-2 leading-relaxed">
                        {item.deepSeekAudit.reasoningReport}
                      </p>
                      <div className="text-[9px] text-slate-400 pt-1 border-t border-[#141924] flex justify-between">
                        <span>{language === 'ar' ? 'العقد الآمن:' : 'KELLY LOT:'}</span>
                        <strong className="text-emerald-400 tabular-nums">{item.synthesisPlan.suggestedLot} Lot (Strict)</strong>
                      </div>
                    </div>
                  </div>

                  {/* S/R & Trade Setup Matrix */}
                  <div className="grid grid-cols-4 gap-2 bg-[#090b10] p-2 rounded border border-[#1c2233] text-center font-mono text-xs">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">{language === 'ar' ? 'الدخول' : 'ENTRY'}</div>
                      <div className="font-bold text-white tabular-nums">${item.synthesisPlan.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">{language === 'ar' ? 'الوقف SL' : 'STOP'}</div>
                      <div className="font-bold text-rose-400 tabular-nums">${item.synthesisPlan.stopLoss}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">{language === 'ar' ? 'الهدف TP1' : 'TARGET 1'}</div>
                      <div className="font-bold text-emerald-400 tabular-nums">${item.synthesisPlan.takeProfit1}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">{language === 'ar' ? 'العائد R:R' : 'R:R'}</div>
                      <div className="font-bold text-cyan-300 tabular-nums">1:{item.synthesisPlan.riskRewardRatio}</div>
                    </div>
                  </div>

                  {/* Auto Break-Even & Pullback Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono px-0.5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{language === 'ar' ? 'تأمين الدخول عند:' : 'Auto Break-Even:'} <strong className="tabular-nums">${item.synthesisPlan.autoBreakEvenThreshold}</strong></span>
                    </span>

                    {item.synthesisPlan.limitPullbackEntry && (
                      <span className="text-amber-300 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{language === 'ar' ? 'أمر معلق (Limit):' : 'Limit:'} <strong className="tabular-nums">${item.synthesisPlan.limitPullbackEntry}</strong></span>
                      </span>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1c2233]">
                    <button
                      onClick={() => onOpenChart(item.symbol, '15m')}
                      className="px-2.5 py-1 rounded bg-[#090b10] hover:bg-[#141924] text-slate-300 text-xs font-mono font-semibold transition flex items-center gap-1.5 border border-[#1c2233]"
                    >
                      <BarChart2 className="w-3 h-3 text-cyan-400" />
                      <span>{language === 'ar' ? 'الشارت' : 'CHART'}</span>
                    </button>

                    <button
                      onClick={() => handleExecuteConsensus(item)}
                      disabled={isExecuting || isWait || isVetoed}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        isVetoed || isWait
                          ? 'bg-[#121622] text-slate-500 border border-[#1c2233] cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>{language === 'ar' ? 'جارٍ التنفيذ...' : 'EXECUTING...'}</span>
                        </>
                      ) : isVetoed ? (
                        <>
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          <span>{language === 'ar' ? 'محظورة بالأمان 🛡️' : 'VETOED BY RISK SHIELD'}</span>
                        </>
                      ) : isWait ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>{language === 'ar' ? 'في انتظار التوافق' : 'WAITING CONFLUENCE'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-white" />
                          <span>{language === 'ar' ? 'تنفيذ فوري للبروكر' : 'EXECUTE TO BROKER'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TRADE PROTECTIONS (Auto Break-Even & ATR Trailing Stop) */}
      {activeTab === 'trade-manager' && (
        <div className="space-y-4">
          <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3 sm:p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold font-mono text-white text-xs uppercase flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ar' ? 'حارس الصفقات الحية وإدارة المخاطر المشتركة' : 'LIVE TRADE RISK PROTECTION MONITOR'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar' 
                  ? 'يقوم محرك الذكاء الاصطناعي بمراقبة الصفقات المفتوحة ونقل وقف الخسارة إلى سعر الدخول تلقائياً (Zero Risk) وتفعيل الوقف المتحرك لحجز الأرباح.'
                  : 'Monitors open positions in real time to lock in profits and automatically move stop-loss to break-even.'}
              </p>
            </div>

            <button
              onClick={fetchTradeProtections}
              disabled={evaluatingTrades}
              className="px-2.5 py-1.5 rounded bg-[#090b10] hover:bg-[#141924] text-slate-200 text-xs font-mono font-bold transition flex items-center gap-1.5 border border-[#1c2233]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluatingTrades ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'فحص الصفقات' : 'EVALUATE POSITIONS'}</span>
            </button>
          </div>

          {tradeEvaluations.length === 0 ? (
            <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-6 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold font-mono text-slate-200 uppercase">
                {language === 'ar' ? 'لا توجد صفقات مفتوحة بحاجة لتعديل حالياً' : 'ALL ACTIVE POSITIONS FULLY PROTECTED'}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {language === 'ar' ? 'حارس الأمان يراقب السوق باستمرار وسيقوم بتأمين أي صفقة فور وصولها إلى 50% من الهدف.' : 'Risk shield is tracking price action and orderflow.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tradeEvaluations.map((evalItem) => {
                const isApplying = applyingProtectionId === evalItem.tradeId;

                return (
                  <div 
                    key={evalItem.tradeId}
                    className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-white text-sm">{evalItem.symbol}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                          evalItem.direction === 'BUY' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                        }`}>
                          {evalItem.direction}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {language === 'ar' ? 'الدخول:' : 'ENTRY:'} <strong className="text-white tabular-nums">${evalItem.entryPrice}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#090b10] p-2 rounded border border-[#1c2233] text-xs font-mono">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase">{language === 'ar' ? 'الوقف الحالي' : 'CURRENT SL'}</div>
                        <div className="font-bold text-rose-400 tabular-nums">${evalItem.originalStopLoss}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-emerald-400 uppercase">{language === 'ar' ? 'الوقف المقترح' : 'PROPOSED SL'}</div>
                        <div className="font-bold text-emerald-300 tabular-nums">${evalItem.proposedStopLoss}</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 bg-[#090b10] p-2 rounded border border-[#1c2233] leading-relaxed font-sans">
                      {evalItem.reasonArabic}
                    </p>

                    <button
                      onClick={() => handleApplyProtection(evalItem)}
                      disabled={isApplying || evalItem.actionRequired === 'HOLD_CURRENT'}
                      className={`w-full py-1.5 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                        evalItem.actionRequired === 'HOLD_CURRENT'
                          ? 'bg-[#121622] text-slate-500 border border-[#1c2233] cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ar' ? 'جارٍ تطبيق الحماية...' : 'APPLYING PROTECTION...'}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تطبيق تأمين الوقف فوراً' : 'APPLY STOP PROTECTION'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI NEXT MOVE INSPECTOR */}
      {activeTab === 'next-move' && (
        <AiNextMoveView
          signals={signals}
          symbols={symbols}
          accountBalance={accountBalance}
        />
      )}

      {/* TAB 4: CRYPTO MARKET TOP 100 GEMS & SCALPER */}
      {activeTab === 'crypto-hub' && (
        <div className="pt-2">
          <CryptoHubView
            onOpenChart={onOpenChart}
            showToast={(msg) => setToastMessage(msg)}
          />
        </div>
      )}
    </div>
  );
};
