import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
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
  Filter,
  DollarSign
} from 'lucide-react';
import { MarketSymbol, GeminiMarketInsight, GeminiSmartRecommendation } from '../types';
import { geminiIntelligenceService } from '../services/geminiIntelligenceService';

interface GeminiInsightPanelProps {
  symbols: MarketSymbol[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onTradeExecuted?: () => void;
}

export const GeminiInsightPanel: React.FC<GeminiInsightPanelProps> = ({
  symbols,
  selectedSymbol,
  onSelectSymbol,
  onTradeExecuted
}) => {
  const [insight, setInsight] = useState<GeminiMarketInsight | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [executingRecId, setExecutingRecId] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const currentSym = symbols.find(s => s.symbol === selectedSymbol) || symbols[0];

  const loadInsights = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      const data = await geminiIntelligenceService.getMarketInsight(selectedSymbol, force);
      setInsight(data);
    } catch (err) {
      console.error('Error fetching Gemini insight:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsights();
    // 2 minutes periodic background refresh (preserves API quota while keeping data fresh)
    const interval = setInterval(() => {
      loadInsights(false);
    }, 120000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleExecuteRecommendation = async (rec: GeminiSmartRecommendation, idx: number) => {
    const idKey = `${rec.symbol}-${rec.action}-${idx}`;
    try {
      setExecutingRecId(idKey);
      setExecutionMessage(null);
      const result = await geminiIntelligenceService.executeSmartRecommendation(rec);
      setExecutionMessage(result.message);
      if (onTradeExecuted) onTradeExecuted();
      setTimeout(() => setExecutionMessage(null), 6000);
    } catch (err: any) {
      setExecutionMessage(`❌ تعذر التنفيذ: ${err.message}`);
    } finally {
      setExecutingRecId(null);
    }
  };

  const isBull = insight?.bias.includes('BULLISH');
  const isBear = insight?.bias.includes('BEARISH');

  return (
    <div id="gemini-insight-panel-container" className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Header & Symbol Details */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Gemini Market Intelligence & Zero-Loss Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  LIVE AI v3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                معالجة التدفق المؤسسي اللحظي • استخراج الدعم والمقاومة الديناميكية • تفعيل خوارزمي محكم بسقف لوت 0.05
              </p>
            </div>
          </div>

          {/* Quick Actions & Pair Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Symbol Selector */}
            <select
              id="gemini-insight-symbol-select"
              value={selectedSymbol}
              onChange={(e) => onSelectSymbol(e.target.value)}
              aria-label="اختر الزوج للتحليل"
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition"
            >
              {symbols.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} ({s.price})
                </option>
              ))}
            </select>

            {/* Refresh S/R & Liquidity Button */}
            <button
              id="refresh-gemini-insight-btn"
              onClick={() => loadInsights(true)}
              disabled={refreshing || loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
              title="تحديث الدعوم والمقاومات والسيولة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{refreshing ? 'جارٍ التحديث...' : 'تحديث الدعوم والسيولة'}</span>
            </button>
          </div>
        </div>

        {executionMessage && (
          <div className="mt-3.5 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2 transition animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>{executionMessage}</span>
          </div>
        )}
      </div>

      {loading && !insight ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-medium">جاري معالجة بيانات البث المباشر والتحليل الكمي عبر Gemini...</p>
        </div>
      ) : insight ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT 7 COLS: Executive Analysis, Dynamic Levels, & Order Flow */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Executive Analysis Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">الملخص التنفيذي اللحظي لزوج {insight.symbol}</h3>
                </div>
                
                {/* Bias Badge */}
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isBull 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : isBear 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                }`}>
                  {isBull ? <TrendingUp className="w-3.5 h-3.5" /> : isBear ? <TrendingDown className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                  <span>{insight.bias} ({insight.biasScore}%)</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                {insight.executiveSummary}
              </p>

              {/* Capital Preservation & Auto Break-Even Metric */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تأمين رأس المال (Auto BE)</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {insight.zeroLossMetrics.activeProtectedTradesCount} صفقات مؤمنة
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">وقف عند نقطة الدخول + ربح</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>الأرباح المحجوزة بالوقف</span>
                  </div>
                  <div className="text-sm font-bold text-amber-300">
                    +${insight.zeroLossMetrics.lockedProfitTotalUSD} USD
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">هامش ربح مضمون بالخروج</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>سقف حجم اللوت</span>
                  </div>
                  <div className="text-sm font-bold text-indigo-300">
                    0.05 Max Lot
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">انضباط كمي صارم</div>
                </div>
              </div>
            </div>

            {/* Dynamic Support & Resistance Zones */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">مستويات الدعم والمقاومة الديناميكية (Dynamic S/R Zones)</h3>
                </div>
                <span className="text-[11px] text-slate-400">نطاق التذبذب: {insight.dynamicLevels.dynamicRange}</span>
              </div>

              <div className="space-y-2.5">
                {/* Resistance 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-bold text-rose-300">مقاومة رئيسية (R2 / Major Supply)</span>
                  </div>
                  <span className="font-mono font-bold text-white">{insight.dynamicLevels.resistance2}</span>
                </div>

                {/* Resistance 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/15 border border-rose-900/20 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400/60" />
                    <span className="text-rose-200">مقاومة لحظية (R1 / FVG Ceiling)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">{insight.dynamicLevels.resistance1}</span>
                </div>

                {/* POC / Middle Point */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-bold text-amber-300">نقطة التحكم المؤسسية (POC / Fair Value)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-200">{insight.dynamicLevels.poc}</span>
                </div>

                {/* Support 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/15 border border-emerald-900/20 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="text-emerald-200">دعم لحظي (S1 / FVG Floor)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">{insight.dynamicLevels.support1}</span>
                </div>

                {/* Support 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-300">دعم رئيسي (S2 / Demand Block)</span>
                  </div>
                  <span className="font-mono font-bold text-white">{insight.dynamicLevels.support2}</span>
                </div>
              </div>
            </div>

            {/* Institutional Order Flow & Macro Context */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">تدفق السيولة المؤسسية والأسواق المتقاطعة (Intermarket)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1 font-semibold">الضغط المسيطر (Dominant Flow)</div>
                  <div className="text-slate-200">{insight.orderFlowInsights.dominantPressure}</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1 font-semibold">سلوك الحيتان والمصارف</div>
                  <div className="text-slate-200">{insight.orderFlowInsights.institutionalFootprint}</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1 font-semibold">أهداف قنص السيولة (Liquidity Pools)</div>
                  <div className="text-slate-200">{insight.orderFlowInsights.liquidityPools}</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1 font-semibold">مصائد الاختراق الوهمي (Traps)</div>
                  <div className="text-slate-200">{insight.orderFlowInsights.retailTraps}</div>
                </div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-3 text-xs text-indigo-300">
                <span className="font-bold">سياق الدولار والعوائد: </span>
                {insight.intermarketContext.dxyImpact} • {insight.intermarketContext.yieldsImpact}
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: Smart Recommendations with 1-Click Bot Activation */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">توصيات التداول الذكية المباشرة</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  سقف 0.05 لوت
                </span>
              </div>

              <div className="space-y-4">
                {insight.smartRecommendations.map((rec, idx) => {
                  const isBuy = rec.action === 'BUY';
                  const isSell = rec.action === 'SELL';
                  const isExec = executingRecId === `${rec.symbol}-${rec.action}-${idx}`;

                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isBuy 
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60' 
                          : isSell 
                          ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60' 
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Rec Header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                            isBuy ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : isSell ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{rec.action}</span>
                          </span>
                          <span className="text-xs font-bold text-white">{rec.symbol}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-400">{rec.confidencePct}% ثقة</span>
                          <span className="text-[10px] text-slate-400 block">R:R = 1:{rec.riskRewardRatio}</span>
                        </div>
                      </div>

                      {/* Rationale */}
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {rec.rationale}
                      </p>

                      {/* Levels Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3.5">
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400">منطقة الدخول</div>
                          <div className="font-mono font-bold text-slate-200 text-[11px] truncate">{rec.entryZone}</div>
                        </div>

                        <div className="bg-slate-950/70 p-2 rounded-lg border border-rose-900/30">
                          <div className="text-[10px] text-rose-400">وقف الخسارة (SL)</div>
                          <div className="font-mono font-bold text-rose-300 text-[11px]">{rec.stopLoss}</div>
                        </div>

                        <div className="bg-slate-950/70 p-2 rounded-lg border border-emerald-900/30">
                          <div className="text-[10px] text-emerald-400">الهدف الأول (TP1)</div>
                          <div className="font-mono font-bold text-emerald-300 text-[11px]">{rec.target1}</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {rec.action !== 'WAIT' && (
                        <button
                          onClick={() => handleExecuteRecommendation(rec, idx)}
                          disabled={isExec}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-md ${
                            isBuy 
                              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' 
                              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                          } disabled:opacity-50`}
                        >
                          <Zap className={`w-3.5 h-3.5 ${isExec ? 'animate-spin' : ''}`} />
                          <span>{isExec ? 'جاري التنفيذ في البوت...' : `تفعيل صفقة ${rec.action} في البوت (لوت ${rec.recommendedLot})`}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Rules & Protections Summary */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>قواعد الأمان الخوارزمية الفعالة:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400">
                <li><strong className="text-slate-300">سقف اللوت 0.05:</strong> لا يمكن لأي صفقة آلية أو يدوية تجاوز حجم 0.05 لوت.</li>
                <li><strong className="text-slate-300">تأمين نقطة الدخول (Auto BE):</strong> تحريك الوقف لنقطة الدخول + هامش ربح فور تحرك السعر بنسبة 45% نحو الهدف الأول.</li>
                <li><strong className="text-slate-300">إغلاق على أرباح عند الانعكاس:</strong> تأمين أقصى ربح قبل ارتداد السعر.</li>
                <li><strong className="text-slate-300">تطهير التعارض والتكرار:</strong> إلغاء الصفقات المتضاربة على نفس الزوج تلقائياً.</li>
              </ul>
            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
};
