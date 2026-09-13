import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Activity, 
  ShieldCheck, 
  DollarSign, 
  Radio, 
  ChevronUp,
  MessageSquare,
  Flame,
  Layers,
  Award
} from 'lucide-react';
import { MarketSymbol, TradeSignal, PaperTrade, BotStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { GeminiBotCopilot } from './GeminiBotCopilot';

interface FloatingGeminiCopilotProps {
  symbols: MarketSymbol[];
  signals: TradeSignal[];
  trades: PaperTrade[];
  status: BotStatus | null;
  selectedSymbol: string;
  onOpenChart: (symbol: string, timeframe: string) => void;
  onRefreshData: () => void;
  accountBalance?: number;
}

export const FloatingGeminiCopilot: React.FC<FloatingGeminiCopilotProps> = ({
  symbols,
  signals,
  trades,
  status,
  selectedSymbol,
  onOpenChart,
  onRefreshData,
  accountBalance = 50
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(false);

  const isRunning = status?.isRunning ?? true;
  const activeCount = status?.activeSignalsCount ?? signals.length;
  const winRate = status?.winRatePct ?? 76;

  // Pulse when new signals appear
  useEffect(() => {
    if (signals.length > 0 && !isOpen) {
      setHasNewAlert(true);
      const timer = setTimeout(() => setHasNewAlert(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [signals.length, isOpen]);

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Quick Notification Bubble */}
          {hasNewAlert && (
            <div className="bg-slate-900/95 border border-amber-500/40 text-amber-300 text-xs px-3 py-1.5 rounded-2xl shadow-xl animate-bounce flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'صفقات رادار جديدة متاحة للتنفيذ!' : 'New Quant Radar Setups Detected!'}</span>
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(true);
              setHasNewAlert(false);
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 hover:border-amber-400 text-white shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            title={isAr ? 'فتح جيمناي كوبايلوت الذكي (التحكم الكامل بالبوت)' : 'Open Gemini Autonomous Copilot'}
          >
            {/* Glowing Accent Ring */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 p-0.5 shadow-md shadow-amber-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="text-left rtl:text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide font-mono">
                  DUAL AI COPILOT
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                <span>{isRunning ? (isAr ? 'Gemini + DeepSeek نشط' : 'Dual AI Active') : (isAr ? 'البوت متوقف' : 'Bot Paused')}</span>
                <span className="text-emerald-400 font-bold font-mono">{winRate}% WR</span>
              </div>
            </div>

            {/* Signal Badge Counter */}
            {activeCount > 0 && (
              <span className="ml-1 rtl:mr-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] font-mono shadow-sm">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Drawer / Modal Overlay */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-300 ${
          isExpanded 
            ? 'inset-2 sm:inset-6 flex flex-col' 
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[540px] md:w-[620px] max-h-[88vh] flex flex-col'
        }`}>
          <div className="w-full h-full bg-slate-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
            
            {/* Header Toolbar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">
                      {isAr ? 'جيمناي كوبايلوت للتحكم الكمي الشامل' : 'Gemini Autonomous Quant Copilot'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                      ROOT AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'التحكم الفوري في البوت، صيد الصفقات، وتطبيق حارس الأرباح' : 'Instant Bot Control, Sniper Trades, Zero-Loss Reversal Guard'}
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all"
                  title={isExpanded ? (isAr ? 'تصغير النافذة' : 'Restore') : (isAr ? 'تكبير النافذة' : 'Maximize')}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 transition-all"
                  title={isAr ? 'إغلاق الكوبايلوت' : 'Close Copilot'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Full Copilot Engine */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 bg-slate-950/60">
              <GeminiBotCopilot
                symbols={symbols}
                signals={signals}
                trades={trades}
                status={status}
                currentSymbol={selectedSymbol}
                accountBalance={accountBalance}
                onOpenChart={onOpenChart}
                onRefreshData={onRefreshData}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
};
