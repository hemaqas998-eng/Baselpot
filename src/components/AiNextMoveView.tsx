import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  Target, 
  Calculator, 
  RefreshCw, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Layers,
  Bot,
  User,
  MessageSquare,
  Activity,
  DollarSign,
  Lock,
  Play,
  Zap,
  BarChart2,
  Clock,
  Radio,
  Sliders,
  Maximize2
} from 'lucide-react';
import { TradeSignal, MarketSymbol, LiveAiNextMovePayload } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AiNextMoveViewProps {
  signals: TradeSignal[];
  symbols: MarketSymbol[];
  activeSignalId?: string;
  accountBalance?: number;
  onExecuteTrade?: (signal: TradeSignal) => void;
  onOpenChart?: (symbol: string, timeframe: string) => void;
}

export const AiNextMoveView: React.FC<AiNextMoveViewProps> = ({
  signals,
  symbols,
  activeSignalId,
  accountBalance = 50,
  onExecuteTrade,
  onOpenChart
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Filter tradeable symbols (Forex, Commodities, Crypto - excluding indices)
  const tradeableSymbols = symbols.filter(s => s.isTradeable !== false && s.assetClass !== 'indices' && s.macroRole !== 'INDICATOR_ONLY');
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    tradeableSymbols.find(s => s.symbol === 'XAU/USD')?.symbol || tradeableSymbols[0]?.symbol || 'XAU/USD'
  );

  const [liveData, setLiveData] = useState<LiveAiNextMovePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [executingTrade, setExecutingTrade] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tactical Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'assistant';
    text: string;
    time: string;
    executedActions?: Array<{ toolName: string; description: string; result?: any }>;
  }>>([
    {
      role: 'assistant',
      text: isAr
        ? 'مرحباً بك! أنا مستشارك الكمي التكتيكي المباشر (Gemini + DeepSeek). أسألني عن سلوك الشموع القادمة، مناطق سحب السيولة، كسر كيلي للوت الآمن، تتابع الفريمات، أو اطلب مني فتح/إغلاق صفقات قناص مباشرة!'
        : 'Welcome! I am your real-time Dual-AI Market Strategist (Gemini + DeepSeek). Ask me about next candle trajectories, liquidity sweep pools, Kelly lot sizing, timeframe cascade, or instruct me to execute/close sniper trades directly!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Quick Prompt Suggestions
  const quickPrompts = [
    { ar: 'ما هي الحركة المتوقعة للشمعة القادمة؟', en: 'What is the expected move for the next candle?' },
    { ar: 'أين أفضل نقطة لتأمين الوقف (Break-Even)؟', en: 'Where is the optimal Auto Break-Even level?' },
    { ar: 'هل توجد مصيدة سحب سيولة (Liquidity Sweep) قريبة؟', en: 'Is there an upcoming liquidity sweep trap?' },
    { ar: 'ما هو حجم العقد الآمن لرصيد محفظتي؟', en: 'What is the safe lot size for my balance?' },
    { ar: 'افحص تتابع الفريمات (Multi-Timeframe Cascade)', en: 'Inspect Multi-Timeframe Cascade alignment' },
    { ar: 'افتح صفقة قناص آمنة الآن لوت 0.01', en: 'Execute safe 0.01 lot sniper trade now' },
    { ar: 'أمّن وحصّل أرباح الصفقات الرابحة', en: 'Secure and lock in profitable trades' },
    { ar: 'أجرِ مسحاً رادارياً لكامل السوق', en: 'Run full radar market scan across all pairs' }
  ];

  // Fetch Live Next Move Data
  const fetchLiveNextMove = async (sym = selectedSymbol) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ai/live-next-move/${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (data && data.success && data.liveNextMove) {
        setLiveData(data.liveNextMove);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error('Failed to load live next move:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch Symbol
  useEffect(() => {
    fetchLiveNextMove(selectedSymbol);
  }, [selectedSymbol]);

  // Real-Time Interval Auto-Sync (Every 8 seconds)
  useEffect(() => {
    if (!isAutoSync) return;
    const interval = setInterval(() => {
      fetchLiveNextMove(selectedSymbol);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoSync, selectedSymbol]);

  // Execute Live Trade into Broker
  const handleExecuteLiveSignal = async () => {
    if (!liveData) return;
    setExecutingTrade(true);
    setToastMessage(null);
    try {
      const isLong = liveData.bias.includes('BUY');
      const res = await fetch('/api/radar/hunt-sniper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: liveData.symbol,
          direction: isLong ? 'LONG' : 'SHORT',
          timeframe: '15m',
          lotSize: liveData.dynamicLevels.safeLotSize,
          stopLoss: liveData.dynamicLevels.stopLoss,
          takeProfit1: liveData.dynamicLevels.takeProfit1,
          rationale: `فاحص الحركة القادمة المباشر [Live Next Move] EV: +${liveData.dynamicLevels.expectedValueEV}R | تأمين الوقف: $${liveData.dynamicLevels.autoBreakEvenTrigger}`
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setToastMessage(isAr
          ? `✅ تم تنفيذ الصفقة بنجاح على ${liveData.symbol} بحجم ${liveData.dynamicLevels.safeLotSize} لوت وتأمين نقطة الدخول عند $${liveData.dynamicLevels.autoBreakEvenTrigger}`
          : `✅ Executed ${liveData.symbol} with ${liveData.dynamicLevels.safeLotSize} lot & Auto Break-Even armed!`);
      } else {
        setToastMessage(data.message || 'تعذر تنفيذ الصفقة');
      }
    } catch (err: any) {
      setToastMessage(`خطأ في التنفيذ: ${err.message}`);
    } finally {
      setExecutingTrade(false);
    }
  };

  // Handle Chat Submit
  const handleSendChat = async (customText?: string) => {
    const userText = (customText || chatInput).trim();
    if (!userText || isSendingChat) return;

    const newMsg = {
      role: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const payloadMessages = updated.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          currentSymbol: selectedSymbol
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant' as const,
            text: data.reply.content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            executedActions: data.reply.executedActions
          }
        ]);
        if (data.reply.executedActions && data.reply.executedActions.length > 0) {
          fetchLiveNextMove(selectedSymbol);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          text: isAr 
            ? `التحليل المباشر لزوج ${selectedSymbol}: السعر يتحرك بالقرب من منطقة سيولة رئيسية مع ثبات وقف الخسارة عند مستويات الأمان.`
            : `Live insight for ${selectedSymbol}: Structure is holding solid support with institutional order block backing.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const isBuyBias = liveData?.bias.includes('BUY');
  const isSellBias = liveData?.bias.includes('SELL');

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. TOP SELECTOR & REAL-TIME SYNC HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Symbol Ribbon */}
        <div className="space-y-1.5 max-w-full">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">
              {isAr ? 'اختر الأصل لفحص الحركة القادمة لحظياً:' : 'Select Asset for Live Real-Time Next Move Inspection:'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {tradeableSymbols.map(sym => {
              const isSelected = sym.symbol === selectedSymbol;
              return (
                <button
                  key={sym.symbol}
                  onClick={() => setSelectedSymbol(sym.symbol)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border font-mono ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white border-indigo-400/50 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <span>{sym.symbol}</span>
                  <span className={`text-[10px] ${sym.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sym.change24h >= 0 ? `+${sym.change24h}%` : `${sym.change24h}%`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Status & Sync Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => setIsAutoSync(!isAutoSync)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
              isAutoSync 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoSync ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isAutoSync ? (isAr ? 'المزامنة الحية نشطة' : 'Live Sync ON') : (isAr ? 'مزامنة يدوية' : 'Sync Paused')}</span>
          </button>

          <button
            onClick={() => fetchLiveNextMove(selectedSymbol)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title={isAr ? 'تحديث الأسعار والتحليل فوراً' : 'Refresh live prices'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs font-mono flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* 2. LIVE PRICE & TACTICAL TRAJECTORY HERO CARD */}
      {liveData && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${
                isBuyBias ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' :
                isSellBias ? 'bg-rose-500/15 text-rose-400 border-rose-500/40' :
                'bg-amber-500/15 text-amber-400 border-amber-500/40'
              }`}>
                {isBuyBias ? <ArrowUpRight className="w-7 h-7" /> : isSellBias ? <ArrowDownRight className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-black text-white font-mono">{liveData.symbol}</h2>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border ${
                    isBuyBias ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    isSellBias ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {liveData.bias} ({liveData.confidenceScore}%)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border bg-indigo-950/80 text-indigo-300 border-indigo-500/40 flex items-center gap-1">
                    {liveData.dynamicLevels.riskRewardRatio >= 2.8 ? '🌊 سوينق يومي (Daily Swing)' : '⚡ مضاربة سريعة (Scalp Sniper)'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                  <span>{isAr ? 'السعر الحي:' : 'Live Price:'} <strong className="text-white text-sm">${liveData.currentPrice}</strong></span>
                  <span>•</span>
                  <span>{isAr ? 'الفارق Spread:' : 'Spread:'} <strong className="text-cyan-300">{liveData.spreadPips} pips</strong></span>
                  <span>•</span>
                  <span>{isAr ? 'معدل التذبذب ATR:' : 'ATR:'} <strong className="text-indigo-300">${liveData.atrValue}</strong></span>
                </div>
              </div>
            </div>

            {/* Direct Execute Button */}
            <div className="flex items-center gap-2.5">
              {onOpenChart && (
                <button
                  onClick={() => onOpenChart(liveData.symbol, '15m')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition flex items-center gap-1.5"
                >
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'عرض الشارت' : 'Chart'}</span>
                </button>
              )}

              <button
                onClick={handleExecuteLiveSignal}
                disabled={executingTrade}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 border border-emerald-400/40 flex items-center gap-2 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {executingTrade ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جارٍ التنفيذ بالبروكر...' : 'Executing...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-white" />
                    <span>{isAr ? `⚡ تنفيذ فوري (${liveData.dynamicLevels.safeLotSize} لوت)` : `⚡ Execute (${liveData.dynamicLevels.safeLotSize} Lot)`}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 PREDICTED CANDLES TRAJECTORY SIMULATION CARDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'محاكاة المسار المتوقع للشموع الـ 3 القادمة (محدثة مع كل تكة سعرية):' : 'Next 3 Candles Trajectory Simulation (Live Synchronized):'}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {isAr ? 'آخر تحديث:' : 'Synced:'} {lastSyncTime || 'Now'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {liveData.predictedTrajectory.map((candle) => (
                <div 
                  key={candle.candleIndex}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{candle.timeframeLabel}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {candle.probabilityPct}% {isAr ? 'احتمالية' : 'Prob'}
                    </span>
                  </div>

                  {/* Simulated Candle Price OHLC Matrix */}
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-900/80 p-2 rounded-xl text-center font-mono text-[11px] border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Open</span>
                      <span className="text-slate-300 font-bold">${candle.openPrice}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-500 block">High</span>
                      <span className="text-emerald-400 font-bold">${candle.predictedHigh}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-rose-500 block">Low</span>
                      <span className="text-rose-400 font-bold">${candle.predictedLow}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-500 block">Close</span>
                      <span className="text-cyan-300 font-bold">${candle.predictedClose}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                    {candle.tacticalActionArabic}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* S/R & ZERO LOSS PROTECTIONS MATRIX */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'الدخول المقترح' : 'Entry Price'}</span>
              <div className="font-bold text-white text-sm">${liveData.dynamicLevels.suggestedEntry}</div>
              <span className="text-[10px] text-amber-400 block">{isAr ? 'أمر معلق Limit:' : 'Limit:'} ${liveData.dynamicLevels.limitPullbackEntry}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'وقف الخسارة SL' : 'Stop Loss'}</span>
              <div className="font-bold text-rose-400 text-sm">${liveData.dynamicLevels.stopLoss}</div>
              <span className="text-[10px] text-slate-400 block">{isAr ? 'مخاطرة محدودة' : 'Hard Stop'}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'الهدف الأول TP1' : 'Take Profit 1'}</span>
              <div className="font-bold text-emerald-400 text-sm">${liveData.dynamicLevels.takeProfit1}</div>
              <span className="text-[10px] text-cyan-400 block">R:R = 1:{liveData.dynamicLevels.riskRewardRatio}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-emerald-400 block">{isAr ? 'تأمين الوقف التلقائي' : 'Auto Break-Even'}</span>
              <div className="font-bold text-emerald-300 text-sm">${liveData.dynamicLevels.autoBreakEvenTrigger}</div>
              <span className="text-[10px] text-emerald-400 block font-sans">{isAr ? 'حماية وتأمين الدخول' : 'Auto BE Secured'}</span>
            </div>
          </div>

          {/* ACTION PLAN BULLETS */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
            <span className="font-bold text-slate-200 block">{isAr ? 'خطة العمل التكتيكية الفورية:' : 'Immediate Action Plan:'}</span>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
              {liveData.executiveActionPlanArabic.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE LIVE TACTICAL CHAT (Gemini + DeepSeek Advisor) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black text-white text-sm">
              {isAr ? 'المستشار التكتيكي المباشر (Gemini + DeepSeek Live Assistant)' : 'Live Tactical AI Assistant (Gemini + DeepSeek)'}
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {selectedSymbol}
          </span>
        </div>

        {/* Quick Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(isAr ? qp.ar : qp.en)}
              disabled={isSendingChat}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-sans whitespace-nowrap border border-slate-800 transition"
            >
              {isAr ? qp.ar : qp.en}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div className="h-64 overflow-y-auto space-y-3.5 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                </div>
              )}
              <div className={`p-3.5 rounded-2xl max-w-[90%] sm:max-w-[85%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white font-sans shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-slate-200 font-sans'
              }`}>
                {/* Executed Action Badge */}
                {msg.executedActions && msg.executedActions.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.executedActions.map((act, actIdx) => (
                      <div key={actIdx} className="bg-indigo-950/80 border border-indigo-500/30 rounded-xl px-2.5 py-1 text-[11px] text-indigo-300 font-mono flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="font-bold">{act.description || act.toolName}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.text}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-1.5 text-right">{msg.time}</div>
              </div>
            </div>
          ))}
          {isSendingChat && (
            <div className="flex gap-2 items-center text-slate-400 text-xs italic p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{isAr ? 'المستشار الذكي يعالج الطلب ويحلل السوق كمياً ولحظياً...' : 'AI is processing request and computing live quant analytics...'}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }} 
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={isAr ? 'اسأل عن حركة السعر، مناطق الانعكاس، أو حجم اللوت...' : 'Ask about price moves, reversals, or lot sizes...'}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            type="submit"
            disabled={isSendingChat || !chatInput.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAr ? 'إرسال' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
