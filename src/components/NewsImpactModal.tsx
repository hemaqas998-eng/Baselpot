import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Zap, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  ExternalLink,
  BarChart2
} from 'lucide-react';
import { TradeSignal, SignalNewsImpact } from '../types';

interface NewsImpactModalProps {
  signal: TradeSignal;
  onClose: () => void;
  onOpenChart: (symbol: string, timeframe: string) => void;
}

export const NewsImpactModal: React.FC<NewsImpactModalProps> = ({
  signal,
  onClose,
  onOpenChart,
}) => {
  const isLong = signal.direction === 'LONG';
  const impact = signal.newsImpact;

  const formatCountdown = (scheduledTime?: number, fallbackMinutes?: number | null) => {
    if (scheduledTime) {
      const diffMs = scheduledTime - Date.now();
      if (diffMs <= 0) return 'Released just now';
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `in ${mins}m`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `in ${hours}h ${remMins}m`;
    }
    if (fallbackMinutes != null) {
      return fallbackMinutes > 0 ? `in ${fallbackMinutes}m` : 'imminent';
    }
    return 'Upcoming';
  };

  const isExtreme = impact?.volatilityRisk === 'EXTREME';
  const isHigh = impact?.volatilityRisk === 'HIGH' || impact?.highestImpact === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative text-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border ${
            isExtreme 
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-500/10' 
              : isHigh 
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-500/10' 
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
          }`}>
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>NEWS IMPACT ASSESSMENT OVERLAY</span>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {formatCountdown(impact?.scheduledTime, impact?.minutesUntilEvent)}
          </span>
        </div>

        {/* Target Signal Header */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-white">
              {signal.symbol.split('/')[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">{signal.symbol}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {signal.timeframe}
                </span>
              </div>
              <span className="text-xs text-slate-400">{signal.pattern.name}</span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 border ${
            isLong ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {signal.direction}
          </div>
        </div>

        {/* Catalyst Event Card */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">
                INCOMING ECONOMIC CATALYST
              </span>
              <h3 className="font-extrabold text-base text-white">
                {impact?.closestEventTitle || 'US Macroeconomic Release'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
              {impact?.highestImpact || 'HIGH'} IMPACT
            </span>
          </div>

          {/* Forecast & Previous Strip */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">MARKET FORECAST</span>
              <span className="font-bold text-slate-200">{impact?.forecast || '0.3% (Consensus)'}</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">PREVIOUS RELEASE</span>
              <span className="font-bold text-slate-300">{impact?.previous || '0.3%'}</span>
            </div>
          </div>
        </div>

        {/* Volatility & Invalidation Risk Engine */}
        <div className="space-y-3 mb-5">
          {/* Volatility Warning */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 mb-1">
                Volatility & Spread Risk: {impact?.volatilityRisk || 'HIGH'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {impact?.invalidationWarning || 'Approaching macro announcement may cause rapid liquidity sweeps and wide bid-ask spread expansion.'}
              </p>
            </div>
          </div>

          {/* Actionable Strategy Advice */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-300 mb-1">
                Quantitative Execution Guidance
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {impact?.actionableGuidance || 'Ensure stop loss is fortified behind swing levels. If already in profit, advance stop to break-even.'}
              </p>
            </div>
          </div>
        </div>

        {/* Trade Levels Check */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 rounded-xl p-3 border border-slate-800 text-center font-mono text-xs mb-5">
          <div>
            <span className="text-[10px] text-slate-400 block">ENTRY PRICE</span>
            <span className="font-bold text-white">${signal.entryPrice}</span>
          </div>
          <div>
            <span className="text-[10px] text-rose-400 block">STOP LOSS</span>
            <span className="font-bold text-rose-300">${signal.stopLoss}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 block">TAKE PROFIT 1</span>
            <span className="font-bold text-emerald-300">${signal.takeProfit1}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onOpenChart(signal.symbol, signal.timeframe);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            Inspect on Chart
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            Got It, Close
          </button>
        </div>

      </div>
    </div>
  );
};
