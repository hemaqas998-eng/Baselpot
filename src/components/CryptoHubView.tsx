import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Zap, 
  RefreshCw, 
  Play, 
  Pause, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  DollarSign, 
  Layers, 
  BarChart3, 
  Lock, 
  Sliders,
  Compass,
  Cpu,
  Eye,
  Radio
} from 'lucide-react';
import { 
  CryptoCrossSymbol, 
  CryptoScalpTrade, 
  CryptoPortfolioAllocation, 
  ForexAiAnalysis, 
  CryptoAiAnalysis 
} from '../types';

interface CryptoHubViewProps {
  onOpenChart?: (symbol: string, timeframe: string) => void;
  showToast?: (msg: string) => void;
}

export const CryptoHubView: React.FC<CryptoHubViewProps> = ({ onOpenChart, showToast }) => {
  const [symbols, setSymbols] = useState<CryptoCrossSymbol[]>([]);
  const [openTrades, setOpenTrades] = useState<CryptoScalpTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<CryptoScalpTrade[]>([]);
  const [allocation, setAllocation] = useState<CryptoPortfolioAllocation | null>(null);
  const [isBotRunning, setIsBotRunning] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dedicated AI Agents
  const [forexAgentData, setForexAgentData] = useState<ForexAiAnalysis | null>(null);
  const [cryptoAgentData, setCryptoAgentData] = useState<CryptoAiAnalysis | null>(null);
  const [isForexAgentLoading, setIsForexAgentLoading] = useState<boolean>(false);
  const [isCryptoAgentLoading, setIsCryptoAgentLoading] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GEMS' | 'WHALES' | 'SCALPS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Custom Equity Setting Modal
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [tempEquity, setTempEquity] = useState<number>(0);
  const [tempAllocationPct, setTempAllocationPct] = useState<number>(100);
  const [tempMaxLossPct, setTempMaxLossPct] = useState<number>(15);

  const fetchCryptoData = async () => {
    try {
      const [top100Res, tradesRes] = await Promise.all([
        fetch('/api/crypto/top-100').then(r => r.json()),
        fetch('/api/crypto/scalp-trades').then(r => r.json())
      ]);

      if (top100Res.success && Array.isArray(top100Res.symbols)) {
        setSymbols(top100Res.symbols);
        if (top100Res.allocation) {
          setAllocation(top100Res.allocation);
          setTempEquity(top100Res.allocation.totalEquityUSD);
          setTempAllocationPct(top100Res.allocation.cryptoAllocatedPct);
          setTempMaxLossPct(top100Res.allocation.maxDailyLossPct);
        }
      }

      if (tradesRes.success) {
        setOpenTrades(tradesRes.openTrades || []);
        setClosedTrades(tradesRes.closedTrades || []);
        setIsBotRunning(tradesRes.isRunning ?? true);
        if (tradesRes.allocation) {
          setAllocation(tradesRes.allocation);
        }
      }
    } catch (err) {
      console.error('Error fetching crypto data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForexAgentAnalysis = async () => {
    setIsForexAgentLoading(true);
    try {
      const res = await fetch('/api/agents/forex');
      const data = await res.json();
      if (data.success && data.analysis) {
        setForexAgentData(data.analysis);
      }
    } catch (err) {
      console.error('Error fetching Forex Agent:', err);
    } finally {
      setIsForexAgentLoading(false);
    }
  };

  const fetchCryptoAgentAnalysis = async () => {
    setIsCryptoAgentLoading(true);
    try {
      const res = await fetch('/api/agents/crypto');
      const data = await res.json();
      if (data.success && data.analysis) {
        setCryptoAgentData(data.analysis);
      }
    } catch (err) {
      console.error('Error fetching Crypto Agent:', err);
    } finally {
      setIsCryptoAgentLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    fetchForexAgentAnalysis();
    fetchCryptoAgentAnalysis();

    const interval = setInterval(() => {
      fetchCryptoData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleBot = async () => {
    try {
      const newStatus = !isBotRunning;
      setIsBotRunning(newStatus);
      const res = await fetch('/api/crypto/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(newStatus ? '🚀 تم تشغيل بوت سكالبينغ الكريبتو الآلي 24/7' : '⏸️ تم إيقاف بوت سكالبينغ الكريبتو مؤقتاً');
        fetchCryptoData();
      }
    } catch (err) {
      console.error('Failed to toggle bot:', err);
    }
  };

  const handleOpenManualScalp = async (symbol: string, direction: 'LONG' | 'SHORT') => {
    try {
      const res = await fetch('/api/crypto/scalp-trades/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, direction })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`✅ تم اقتناص صفقة سكالبينغ على ${symbol} (${direction}) بنجاح`);
        fetchCryptoData();
      } else {
        showToast?.(`⚠️ ${data.message || 'تعذر فتح الصفقة'}`);
      }
    } catch (err: any) {
      showToast?.(`❌ خطأ: ${err.message}`);
    }
  };

  const handleCloseScalpTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/crypto/scalp-trades/${tradeId}/close`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`تم إغلاق صفقة السكالبينغ بنجاح وتفريغ الفتحة للبوت`);
        fetchCryptoData();
      }
    } catch (err: any) {
      showToast?.(`خطأ أثناء الإغلاق: ${err.message}`);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/crypto/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalEquityUSD: tempEquity,
          cryptoAllocationPct: tempAllocationPct,
          maxDailyLossPct: tempMaxLossPct
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.('✅ تم تحديث إعدادات المحفظة وهامش الخسارة بنجاح');
        setIsConfigOpen(false);
        fetchCryptoData();
      }
    } catch (err: any) {
      showToast?.(`خطأ: ${err.message}`);
    }
  };

  const handleResetDrawdown = async () => {
    try {
      const res = await fetch('/api/crypto/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetDrawdown: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.('🔄 تم إعادة ضبط قاطع الخسارة اليومي واستئناف التداول');
        fetchCryptoData();
      }
    } catch (err: any) {
      showToast?.(`خطأ: ${err.message}`);
    }
  };

  // Filtered symbols
  const filteredSymbols = symbols.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.baseAsset.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;

    if (activeFilter === 'GEMS') return s.isGemAlert || s.gemScore >= 75;
    if (activeFilter === 'WHALES') return s.isWhaleAccumulating || s.whaleBuyVolumeRatio >= 1.8;
    if (activeFilter === 'SCALPS') return s.recommendedScalpAction === 'STRONG_BUY_PUMP' || s.recommendedScalpAction === 'SCALP_LONG';

    return true;
  });

  const gemsList = symbols.filter(s => s.isGemAlert || s.isWhaleAccumulating || s.pumpProbability >= 70).slice(0, 8);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Real Live Exchange Wallets Status Notice */}
      {allocation && (!allocation.isRealWalletConnected || allocation.totalEquityUSD === 0) ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                وضع التداول الحقيقي فقط: لم يتم ربط محفظة حقيقية لـ Binance أو Bybit
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                تم إلغاء أي رصيد وهمي أو محاكاة تجريبية. التداول متوقف تلقائياً حتى يتم ربط مفاتيح API لحسابك الحقيقي في Binance أو Bybit لجلب الرصيد الفعلي والبدء.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
              الرصيد الفعلي: $0.00
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>محفظة التداول الحقيقي المباشرة متصلة</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className={`px-2 py-0.5 rounded border ${allocation?.binanceConnected ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              Binance: ${allocation?.binanceBalanceUSD || 0} USDT {allocation?.binanceConnected ? '✓' : '✗'}
            </span>
            <span className={`px-2 py-0.5 rounded border ${allocation?.bybitConnected ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              Bybit: ${allocation?.bybitBalanceUSD || 0} USD {allocation?.bybitConnected ? '✓' : '✗'}
            </span>
            <span className="text-white font-bold">
              الإجمالي الفعلي: ${allocation?.totalEquityUSD || 0} USD
            </span>
          </div>
        </div>
      )}

      {/* 🛡️ Strict 15% Max Daily Drawdown & Capital Management Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d121f] to-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                  <span>إدارة رأس المال وهامش الخسارة الصارم (15% Max Drawdown Guard)</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    5 صفقات متزامنة كحد أقصى
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  توزيع رأس مال المحفظة بدقة رياضية، حماية الأرباح عند +1.2%، وقاطع آلي فوري يوقف التداول عند وصول الخسارة اليومية إلى 15%.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>تعديل رأس المال</span>
            </button>

            <button
              onClick={handleToggleBot}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg ${
                isBotRunning 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20' 
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              {isBotRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isBotRunning ? 'البوت يعمل آلياً (24/7 نشط)' : 'البوت متوقف (استئناف التداول)'}</span>
            </button>
          </div>
        </div>

        {/* Drawdown Progress & Capital Breakdown */}
        {allocation && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono">رأس مال المحفظة الفعلي</div>
              <div className="text-base font-black text-white font-mono mt-1">${(allocation.totalEquityUSD || 0).toLocaleString()}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>{allocation.isRealWalletConnected ? 'رصيد حقيقي معتمد' : 'غير متصل ($0.00)'}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono">فئة الحساب وهامش المايكرو</div>
              <div className="text-xs font-black text-amber-300 mt-1 line-clamp-1">{allocation.accountTierArabic || 'حساب قياسي'}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">يدعم الحسابات الصغيرة من $10+</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono">الهامش المتغير لكل صفقة</div>
              <div className="text-base font-black text-cyan-300 font-mono mt-1">
                {allocation.totalEquityUSD > 0 ? (allocation.dynamicMarginRangeUSD || `$${allocation.perTradeMarginAllocationUSD}`) : '$0.00'}
              </div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">ديناميكي حسب قوة الزخم</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono">الهامش الحر المتاح</div>
              <div className="text-base font-black text-slate-200 font-mono mt-1">${allocation.freeEquityUSD || 0} ({allocation.freeMarginPct || 100}%)</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">مستخدم: ${allocation.usedMarginUSD || 0}</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono">الخسارة اليومية اللحظية</div>
              <div className={`text-base font-black font-mono mt-1 ${
                allocation.currentDailyLossPct > 10 ? 'text-rose-400' : 'text-slate-200'
              }`}>
                -{allocation.currentDailyLossPct}% (${allocation.currentDailyLossUSD})
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">الحد الأقصى: 15%</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 font-mono">قاطع الحماية (15% Max DD)</div>
              {allocation.isDailyCircuitBreakerActive ? (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> مفعل (تجميد)
                  </span>
                  <button 
                    onClick={handleResetDrawdown}
                    className="text-[10px] px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/40"
                  >
                    استئناف
                  </button>
                </div>
              ) : (
                <div className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> آمن ومحمي
                </div>
              )}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    allocation.currentDailyLossPct >= 12 ? 'bg-rose-500' : allocation.currentDailyLossPct >= 7 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (allocation.currentDailyLossPct / 15) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🛡️ Spread Deduction & High-Winrate Execution Protocol Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white font-mono">بروتوكول احتساب السبريد اللحظي وهندسة الصفقات عالية الربح</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  صافي ربح مضمون 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                يتم احتساب وخصم السبريد المباشر وعمولة المنصة لحظياً لكل صفقة قبل الإغلاق لضمان الخروج بهامش ربح حقيقي صافٍ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-cyan-500/20">
            <span>فلتر السبريد:</span>
            <span className="text-white font-bold">&le; 0.15% أقصى</span>
            <span className="text-slate-500">|</span>
            <span>نسبة R:R:</span>
            <span className="text-emerald-400 font-bold">1:2.2+</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              خصم السبريد والعمولة قبل الإغلاق
            </div>
            <div className="text-slate-200 mt-1">
              خصم سبريد Binance/Bybit والعمولة (~0.08%)، ولا يتم تنفيذ TP إلا بعد التأكد من أن صافي الربح إيجابي.
            </div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              تأمين الدخول المحمي (Spread-Aware BE)
            </div>
            <div className="text-slate-200 mt-1">
              نقل الوقف ليس لسعر الدخول بل فوقه بمسافة تغطي السبريد بالكامل ليخرج الحساب بربح صافٍ عند الارتداد.
            </div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              فلتر السيولة والانضغاط المؤسساتي
            </div>
            <div className="text-slate-200 mt-1">
              دخول العملات التي تتجاوز سيولتها $3M واحتمالية مضخة الحيتان &ge; 70% لمنع الانزلاق السعري (Slippage).
            </div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              تريلينج ستوب ذكي لحجز 65% من القمة
            </div>
            <div className="text-slate-200 mt-1">
              تفعيل وقف متحرك بعد تحقيق +2.0% صافي، مع قفل الأرباح فوراً عند أي انعكاس بنسبة 35% من القمة.
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 Dual Independent AI Agents Console (Forex AI Agent vs Crypto AI Agent) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Agent 1: Forex & Gold Macro AI Specialist */}
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    مستقل: قسم الفوركس والذهب
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-white mt-0.5">Forex & Gold Macro AI Agent</h3>
              </div>
            </div>

            <button
              onClick={fetchForexAgentAnalysis}
              disabled={isForexAgentLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="تحديث تحليل الفوركس"
            >
              <RefreshCw className={`w-4 h-4 ${isForexAgentLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
                <span>مصفوفة قوة العملات ومؤشر الدولار (DXY)</span>
                <span className="font-mono text-emerald-400">
                  {forexAgentData?.goldMacroBias === 'BULLISH' ? 'الذهب: صاعد 📈' : 'الذهب: عرضي ⚖️'}
                </span>
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                {forexAgentData?.dxyImpactSummary || 'جاري مسح تدفقات البنوك المركزية ومؤشر الدولار DXY...'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">الجلسة البنكية النشطة</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
                  {forexAgentData?.activeSessionArabic || 'جلسة لندن ونيويورك'}
                </div>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">حماية الخسارة 15%</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {forexAgentData?.maxDrawdownStatus || 'مفعل ومنضبط'}
                </div>
              </div>
            </div>

            {forexAgentData?.bestForexPairs && forexAgentData.bestForexPairs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-slate-400">أقوى الفرص الموصى بها للفوركس:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {forexAgentData.bestForexPairs.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white font-mono">{item.pair}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.confluenceReason}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.bias === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {item.bias} (عقد: {item.recommendedLot})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent 2: Crypto Whale & Scalp AI Specialist */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    مستقل: قسم الكريبتو وبايننس/بايبت
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-white mt-0.5">Crypto Whale & Scalp AI Agent</h3>
              </div>
            </div>

            <button
              onClick={fetchCryptoAgentAnalysis}
              disabled={isCryptoAgentLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="تحديث تحليل الكريبتو"
            >
              <RefreshCw className={`w-4 h-4 ${isCryptoAgentLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="text-[11px] font-bold text-cyan-300 flex items-center justify-between">
                <span>رادار الحيتان وسحب السيولة المزدوج (Binance & Bybit)</span>
                <span className="font-mono text-cyan-400">مطابقة 100 عملة</span>
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                {cryptoAgentData?.whaleAccumulationRadarSummary || 'جاري رصد ضغط السيولة والتجميع اللحظي للحيتان عبر بايننس وبايبت...'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">فتحات السكالبينغ النشطة</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5 font-mono">
                  {openTrades.length} / 5 صفقات متزامنة
                </div>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">أهداف السكالبينغ</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {cryptoAgentData?.scalpExecutionStatus?.recommendedTargetTakeProfit || '+2.0% إلى +4.5%'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-slate-300">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">توجيه المحفظة الصارم:</div>
              {cryptoAgentData?.capitalAllocationAdviceArabic || 'توزيع حصة المحفظة بالتساوي على الـ 5 صفقات بحد أقصى للمخاطرة 1.5% لكل صفقة.'}
            </div>
          </div>
        </div>

      </div>

      {/* ⚡ 5-Slot Continuous Scalping Engine Terminal */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>منصة صفقات السكالبينغ الآلية (5 صفقات متزامنة كحد أقصى)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              يعمل البوت آلياً دون توقف 24/7؛ فور إغلاق أي صفقة بربح يتم اقتناص الجوهرة التالية لملء الفتحة تلقائياً.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              الفتحات المشغولة: <strong className="text-cyan-400">{openTrades.length}</strong> / 5
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              حماية الدخول Break-Even: +1.2%
            </span>
          </div>
        </div>

        {/* The 5 Scalping Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
          {[1, 2, 3, 4, 5].map(slotNum => {
            const trade = openTrades.find(t => t.slotIndex === slotNum);

            if (trade) {
              const isProfit = trade.pnlPct >= 0;
              return (
                <div 
                  key={slotNum}
                  className="bg-gradient-to-b from-slate-950 to-[#0c101a] border border-cyan-500/40 rounded-xl p-3.5 shadow-lg relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        فتحة #{slotNum}
                      </span>
                      <span className={`font-black font-mono flex items-center gap-0.5 ${
                        trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {trade.direction === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {trade.direction} {trade.leverage || 5}x
                      </span>
                    </div>

                    <div className="my-2.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-black text-white font-mono">{trade.symbol}</span>
                        <span className="text-xs text-slate-400 font-mono">${trade.currentPrice}</span>
                      </div>
                      
                      <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">صافي الربح الفعلي:</span>
                          <span className={`text-xs font-black font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}{trade.pnlPct}% ({isProfit ? '+$' : '-$'}{Math.abs(trade.pnlUSD)})
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-slate-800/80 pt-1">
                          <span>السبريد: ~${trade.estimatedSpreadUSD || 0}</span>
                          <span>العمولة: ~${trade.tradingFeesUSD || 0}</span>
                          <span className="text-cyan-400 font-bold">مخصوم 100%</span>
                        </div>
                      </div>

                      {/* Dynamic Margin & Position Sizing Details */}
                      <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-[10px] font-mono">
                        <div className="flex justify-between text-amber-300">
                          <span>الهامش المحجوز:</span>
                          <span className="font-bold">${trade.allocatedMarginUSD} ({trade.leverage || 5}x)</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>القيمة الكلية (Notional):</span>
                          <span>${trade.notionalValueUSD || (trade.allocatedMarginUSD * (trade.leverage || 5)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>المخاطرة المحسوبة:</span>
                          <span className="text-rose-400">~${trade.riskPerTradeUSD || (trade.allocatedMarginUSD * 0.08).toFixed(2)} ({trade.riskPerTradePct || 1.5}%)</span>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1 text-[10px] font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>الدخول:</span>
                          <span className="text-slate-300">${trade.entryPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الهدف 1 (TP1):</span>
                          <span className="text-emerald-400">${trade.takeProfit1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الوقف (SL):</span>
                          <span className="text-rose-400">${trade.stopLoss}</span>
                        </div>
                        {trade.breakEvenTargetPrice && (
                          <div className="flex justify-between text-[9px] text-cyan-300/80">
                            <span>هدف التأمين الصافي:</span>
                            <span>${trade.breakEvenTargetPrice}</span>
                          </div>
                        )}
                      </div>

                      {trade.dynamicWeightReason && (
                        <div className="mt-2 py-1 px-1.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-[9px] text-cyan-300 font-mono text-center">
                          {trade.dynamicWeightReason}
                        </div>
                      )}

                      {trade.isBreakEvenLocked && (
                        <div className="mt-2 py-1 px-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold text-center flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> تم تأمين نقطة الدخول فوق السبريد (ربح صافٍ مضمون)
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCloseScalpTrade(trade.id)}
                    className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                  >
                    إغلاق الصفقة يدوياً
                  </button>
                </div>
              );
            }

            // Empty Slot (Available for Next Whale Gem)
            return (
              <div 
                key={slotNum}
                className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[240px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-300 font-mono">فتحة #{slotNum} متاحة</span>
                <span className="text-[10px] text-cyan-400/80 mt-1">البوت يبحث عن جوهرة لاقتناصها</span>
                
                {allocation && allocation.totalEquityUSD > 0 ? (
                  <div className="mt-3 w-full space-y-1.5">
                    <div className="px-2 py-1 rounded bg-slate-900 text-[10px] text-amber-300 font-mono border border-slate-800/80">
                      هامش متغير: ~${allocation.perTradeMarginAllocationUSD}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      النطاق: {allocation.dynamicMarginRangeUSD}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 px-2 py-1 rounded bg-slate-900/80 text-[9px] text-slate-500 font-mono border border-slate-800">
                    في انتظار جلب الرصيد الحقيقي
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 💎 Gem & Pump Hunter Radar (Liquidity Sweeps & Whale Accumulation) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>رادار صيد الجواهر والبامبات (Whale Accumulation & Liquidity Sweeps)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              خوارزمية حسابية ترصد تجميع الحيتان وضخ السيولة وسحب قيعان الستوبات قبل الانفجار السعري.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            تأكيد مزدوج Binance + Bybit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {gemsList.map(gem => (
            <div 
              key={gem.symbol}
              className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-300 shadow-md group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white font-mono">{gem.baseAsset}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {gem.category}
                  </span>
                </div>
                <span className={`text-xs font-black font-mono ${gem.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gem.change24h >= 0 ? '+' : ''}{gem.change24h}%
                </span>
              </div>

              <div className="mt-2 text-xs font-mono text-slate-300 font-bold">
                ${gem.price}
              </div>

              {/* Badges & Scores */}
              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">احتمالية البامب:</span>
                  <span className="font-bold text-cyan-400 font-mono">{gem.pumpProbability}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${gem.pumpProbability}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">فوليوم الحيتان:</span>
                  <span className="font-bold text-amber-400 font-mono">{gem.whaleBuyVolumeRatio}x الطبيعي</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">حالة السيولة:</span>
                  <span className="font-bold text-emerald-400 text-[10px]">
                    {gem.liquiditySweepState === 'SWEEP_COMPLETED' ? 'اكتمل سحب القاع' :
                     gem.liquiditySweepState === 'ACCUMULATING' ? 'تجميع حيتان' : 'ضغط النطاق'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleOpenManualScalp(gem.symbol, 'LONG')}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>اقتناص سكالبينغ</span>
                </button>

                <button
                  onClick={() => onOpenChart?.(gem.symbol, '15m')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="عرض الشارت"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 Top 100 Cross-Exchange (Binance & Bybit) Verified Screener */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>أفضل 100 عملة رقمية متطابقة بين بايننس وبايبت (Top 100 Cross-Verified)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مقارنة ومطابقة أسعار Binance Spot و Bybit Linear، وفحص الفروقات لمنع الفخاخ واصطياد التحركات الحقيقية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث عن رمز العملة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  activeFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل (100)
              </button>
              <button
                onClick={() => setActiveFilter('GEMS')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  activeFilter === 'GEMS' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>الجواهر</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </button>
              <button
                onClick={() => setActiveFilter('WHALES')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  activeFilter === 'WHALES' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>الحيتان</span>
                <Flame className="w-3 h-3 text-amber-400" />
              </button>
              <button
                onClick={() => setActiveFilter('SCALPS')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  activeFilter === 'SCALPS' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>السكالبينغ</span>
                <Zap className="w-3 h-3 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Top 100 Data Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-3 pr-2">العملة والاسم</th>
                <th className="pb-3 px-3">سعر بايننس (Binance)</th>
                <th className="pb-3 px-3">سعر بايبت (Bybit)</th>
                <th className="pb-3 px-3">الفارق (Spread)</th>
                <th className="pb-3 px-3">التغير 24h</th>
                <th className="pb-3 px-3">فوليوم الحيتان</th>
                <th className="pb-3 px-3">احتمالية البامب</th>
                <th className="pb-3 px-3">حالة السيولة</th>
                <th className="pb-3 pl-2 text-left">إجراء السكالبينغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSymbols.slice(0, 40).map(sym => (
                <tr key={sym.symbol} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 pr-2">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{sym.symbol}</span>
                      {sym.isDualVerified && (
                        <span title="متطابقة ومحققة في Binance و Bybit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">{sym.name}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    ${sym.binancePrice}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    ${sym.bybitPrice}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {sym.spreadPct}%
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${
                    sym.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {sym.change24h >= 0 ? '+' : ''}{sym.change24h}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sym.whaleBuyVolumeRatio >= 2.0 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : 'text-slate-400'
                    }`}>
                      {sym.whaleBuyVolumeRatio}x
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-cyan-400">
                    {sym.pumpProbability}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-sans text-slate-300">
                      {sym.liquiditySweepState === 'SWEEP_COMPLETED' ? '🎯 سحب سيولة' :
                       sym.liquiditySweepState === 'ACCUMULATING' ? '💎 تجميع' : 'طبيعي'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenManualScalp(sym.symbol, 'LONG')}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>سكالبينغ</span>
                      </button>
                      <button
                        onClick={() => onOpenChart?.(sym.symbol, '15m')}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <BarChart3 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>إعدادات رأس المال وقاطع الخسارة 15%</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">رأس مال المحفظة الحقيقي الإجمالي ($):</label>
                  <span className="text-[10px] text-emerald-400 font-mono">يُجلب تلقائياً من Binance و Bybit</span>
                </div>
                <input
                  type="number"
                  value={tempEquity}
                  onChange={e => setTempEquity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="0.00"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  الرصيد الفعلي المرصود من المنصات المرتبطة. لا يتم استخدام أي رصيد وهمي.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نسبة المحفظة المخصصة لتداول الكريبتو (%):</label>
                <input
                  type="number"
                  value={tempAllocationPct}
                  onChange={e => setTempAllocationPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-[10px] text-slate-500">يتم تقسيم هذا الرصيد الحقيقي على الـ 5 صفقات بالتساوي</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">الحد الأقصى لهامش الخسارة اليومي الصارم (%):</label>
                <input
                  type="number"
                  value={tempMaxLossPct}
                  onChange={e => setTempMaxLossPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-[10px] text-amber-400 font-bold">15% حد حماية أقصى: يتم إيقاف وتجميد التداول تلقائياً في حال بلوغه</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
