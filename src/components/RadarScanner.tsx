import React, { useState } from 'react';
import { 
  Radio, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  ShieldAlert, 
  Zap, 
  TrendingUp, 
  Send, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Filter, 
  Layers, 
  Percent, 
  DollarSign, 
  Award,
  ChevronRight,
  ExternalLink,
  Flame,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TradeSignal, MarketSymbol, BotStatus, SignalDirection, AssetClass } from '../types';
import { EconomicCalendarBar } from './EconomicCalendarBar';
import { NewsImpactModal } from './NewsImpactModal';

interface RadarScannerProps {
  signals: TradeSignal[];
  symbols: MarketSymbol[];
  status: BotStatus | null;
  onOpenChart: (symbol: string, timeframe: string) => void;
  onOpenAiAnalysis: (signal: TradeSignal) => void;
  onExecuteTrade: (signal: TradeSignal) => void;
  onSendTelegram: (signal: TradeSignal) => void;
  sendingTelegramId: string | null;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({
  signals,
  symbols,
  status,
  onOpenChart,
  onOpenAiAnalysis,
  onExecuteTrade,
  onSendTelegram,
  sendingTelegramId,
}) => {
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(75);
  const [filterNewsOnly, setFilterNewsOnly] = useState<boolean>(false);
  const [selectedNewsSignal, setSelectedNewsSignal] = useState<TradeSignal | null>(null);

  const filteredSignals = signals.filter(signal => {
    const sym = symbols.find(s => s.symbol === signal.symbol);
    const assetClassMatch = selectedAssetClass === 'ALL' || sym?.assetClass === selectedAssetClass.toLowerCase();
    const directionMatch = selectedDirection === 'ALL' || signal.direction === selectedDirection;
    const confidenceMatch = signal.confidence >= minConfidence;
    const newsMatch = !filterNewsOnly || (signal.newsImpact?.hasImpact && signal.newsImpact.highestImpact !== 'NONE');
    return assetClassMatch && directionMatch && confidenceMatch && newsMatch;
  });

  const newsImpactSignalsCount = signals.filter(s => s.newsImpact?.hasImpact && s.newsImpact.highestImpact === 'HIGH').length;

  const formatCountdown = (scheduledTime?: number, fallbackMins?: number | null) => {
    if (scheduledTime) {
      const diffMs = scheduledTime - Date.now();
      if (diffMs <= 0) return 'Live now';
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `in ${mins}m`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `in ${hours}h ${remMins}m`;
    }
    if (fallbackMins != null) {
      return fallbackMins > 0 ? `in ${fallbackMins}m` : 'imminent';
    }
    return 'Approaching';
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Top Economic Calendar Live Fetcher Bar */}
      <EconomicCalendarBar 
        onSelectAffectedSymbol={(sym) => {
          const matchingSignal = signals.find(s => s.symbol === sym);
          if (matchingSignal) {
            setSelectedNewsSignal(matchingSignal);
          }
        }}
      />

      {/* Top Metrics Row - Swiss Precision Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Active Signals */}
        <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-slate-400">ACTIVE SIGNALS</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {status?.activeSignalsCount ?? signals.length}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">CONFLUENCE</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Multi-timeframe cascade</p>
        </div>

        {/* Win Rate */}
        <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-slate-400">RADAR WIN RATE</span>
            <Award className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {status?.winRatePct ?? 76}%
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">TP1/TP2 HIT</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Monte Carlo backtested</p>
        </div>

        {/* Daily PnL */}
        <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-slate-400">DAILY LEDGER PNL</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              +${status?.dailyPnL?.toLocaleString() ?? '434.18'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">+1.74%</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Auto-execution simulation</p>
        </div>

        {/* System & Dispatcher Health */}
        <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-slate-400">DISPATCHER GATEWAY</span>
            <Send className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              {status?.telegramConnected ? 'TELEGRAM LIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 border-t border-[#161b29] pt-1.5">
            <span>News Guard: <span className="text-amber-400 font-bold tabular-nums">{newsImpactSignalsCount} Alert{newsImpactSignalsCount !== 1 ? 's' : ''}</span></span>
            <span>API: <span className="text-slate-300 font-mono tabular-nums">{status?.quota.apiRequestsToday ?? 142}/800</span></span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar - Swiss Minimalist Style */}
      <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Asset Class Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['ALL', 'FOREX', 'CRYPTO', 'COMMODITY'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedAssetClass(type)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-semibold transition whitespace-nowrap border ${
                selectedAssetClass === type
                  ? 'bg-[#182033] text-white border-emerald-500/50'
                  : 'bg-[#10141f] text-slate-400 hover:text-slate-200 border-[#1e2538]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Direction, News Filter & Confidence */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* News Alert Quick Filter */}
          <button
            onClick={() => setFilterNewsOnly(!filterNewsOnly)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold transition flex items-center gap-1.5 border ${
              filterNewsOnly
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                : 'bg-[#10141f] text-slate-400 hover:text-slate-200 border-[#1e2538]'
            }`}
            title="Filter setups affected by upcoming macroeconomic events"
          >
            <Flame className={`w-3 h-3 ${filterNewsOnly ? 'text-rose-400' : 'text-slate-400'}`} />
            <span>NEWS ONLY</span>
          </button>

          {/* Direction Filter */}
          <div className="flex items-center bg-[#10141f] p-0.5 rounded border border-[#1e2538] text-[11px] font-mono font-semibold">
            <button
              onClick={() => setSelectedDirection('ALL')}
              className={`px-2.5 py-1 rounded transition ${selectedDirection === 'ALL' ? 'bg-[#1c2438] text-white' : 'text-slate-400'}`}
            >
              ALL
            </button>
            <button
              onClick={() => setSelectedDirection('LONG')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${selectedDirection === 'LONG' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'text-emerald-400/70'}`}
            >
              <ArrowUpRight className="w-3 h-3" /> LONG
            </button>
            <button
              onClick={() => setSelectedDirection('SHORT')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${selectedDirection === 'SHORT' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'text-rose-400/70'}`}
            >
              <ArrowDownRight className="w-3 h-3" /> SHORT
            </button>
          </div>

          {/* Min Confidence Slider */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-[#10141f] px-3 py-1.5 rounded border border-[#1e2538]">
            <span>SCORE:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{minConfidence}%</span>
            <input
              type="range"
              min="60"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-16 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Signal Feed Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Active Radar Signals ({filteredSignals.length})
          </h2>
          <span className="text-xs text-slate-400">
            Real-time pattern confluence scanner with Macro News Shield
          </span>
        </div>

        {filteredSignals.length === 0 ? (
          <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-10 text-center">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold font-mono text-slate-300 uppercase">NO ACTIVE SIGNALS MATCH FILTER</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Adjust minimum confidence threshold or switch asset class to display incoming setups.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredSignals.map(signal => {
              const isLong = signal.direction === 'LONG';
              const sym = symbols.find(s => s.symbol === signal.symbol);
              const impact = signal.newsImpact;
              const hasImpact = impact?.hasImpact && impact.highestImpact !== 'NONE';
              const isHighImpact = impact?.highestImpact === 'HIGH';

              return (
                <div 
                  key={signal.id}
                  className="bg-[#0e1118] border border-[#1c2233] hover:border-[#2b354f] rounded-lg p-4 transition duration-150 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Symbol, TF, Direction Badge, Confidence */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded bg-[#121622] border border-[#222a3d] flex items-center justify-center font-bold text-xs text-slate-200 font-mono">
                          {signal.symbol.split('/')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm tracking-tight">{signal.symbol}</h3>
                            <span className="px-1.5 py-0.2 rounded bg-[#141924] border border-[#222a3d] text-slate-300 text-[10px] font-mono font-bold">
                              {signal.timeframe}
                            </span>
                            <span className="text-xs text-slate-300 font-mono tabular-nums">
                              ${sym?.price.toLocaleString(undefined, { minimumFractionDigits: sym.digits })}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{sym?.name}</span>
                        </div>
                      </div>

                      {/* Direction Badge */}
                      <div className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 border ${
                        isLong 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40' 
                          : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                      }`}>
                        {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isLong ? 'LONG BUY' : 'SHORT SELL'}
                      </div>
                    </div>

                    {/* Trade Classification Badge: Scalp vs Daily Swing */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 bg-[#10141f] px-2.5 py-1.5 rounded border border-[#1b2233]">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                          signal.tradeType === 'DAILY_SWING' || signal.tradeType === 'SWING'
                            ? 'bg-[#151c2e] text-blue-300 border-blue-500/30'
                            : 'bg-[#1e1b15] text-amber-300 border-amber-500/30'
                        }`}>
                          {signal.tradeType === 'DAILY_SWING' || signal.tradeType === 'SWING' ? 'DAILY SWING' : 'SCALP SNIPER'}
                        </span>
                        {signal.targetHoldingHorizon && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {signal.targetHoldingHorizon}
                          </span>
                        )}
                      </div>
                      {signal.timeframeCascade && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-[#0f172a] px-2 py-0.5 rounded border border-cyan-500/30 tabular-nums">
                          CASCADE {signal.timeframeCascade.cascadeAlignmentScore}%
                        </span>
                      )}
                    </div>

                    {/* News Impact Overlay / Banner on Card */}
                    {hasImpact && (
                      <div 
                        onClick={() => setSelectedNewsSignal(signal)}
                        className={`mb-2.5 p-2 rounded border cursor-pointer transition ${
                          isHighImpact
                            ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/50'
                            : 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                            <Flame className={`w-3.5 h-3.5 ${isHighImpact ? 'text-rose-400' : 'text-amber-400'}`} />
                            <span className={isHighImpact ? 'text-rose-300' : 'text-amber-300'}>
                              {impact.highestImpact} IMPACT ({formatCountdown(impact.scheduledTime, impact.minutesUntilEvent)})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 underline flex items-center gap-0.5">
                            Details <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                          {impact.closestEventTitle}
                        </p>
                      </div>
                    )}

                    {/* Pattern Banner */}
                    <div className="bg-[#10141f] border border-[#1b2233] rounded p-2.5 mb-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                          <Target className="w-3.5 h-3.5" />
                          {signal.pattern.name}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-300 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30 tabular-nums">
                          {signal.confidence}% SCORE
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {signal.pattern.description}
                      </p>
                    </div>

                    {/* Trade Levels Matrix - Swiss Precise Grid */}
                    <div className="grid grid-cols-4 gap-1.5 bg-[#090b10] rounded p-2 border border-[#1b2233] text-center font-mono mb-2.5">
                      <div className="border-r border-[#1a2133] pr-1">
                        <span className="text-[9px] text-slate-400 block tracking-wider">ENTRY</span>
                        <span className="text-xs font-bold text-slate-100 tabular-nums">${signal.entryPrice}</span>
                      </div>
                      <div className="border-r border-[#1a2133] pr-1">
                        <span className="text-[9px] text-rose-400 block tracking-wider">STOP LOSS</span>
                        <span className="text-xs font-bold text-rose-400 tabular-nums">${signal.stopLoss}</span>
                      </div>
                      <div className="border-r border-[#1a2133] pr-1">
                        <span className="text-[9px] text-emerald-400 block tracking-wider">TP1</span>
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">${signal.takeProfit1}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-teal-400 block tracking-wider">TP2</span>
                        <span className="text-xs font-bold text-teal-400 tabular-nums">${signal.takeProfit2}</span>
                      </div>
                    </div>

                    {/* Confluences & Stats */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span className="text-slate-400 text-[11px]">RISK/REWARD:</span>
                        <span className="font-bold text-emerald-400 tabular-nums">1:{signal.riskRewardRatio}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {signal.confluenceFactors.slice(0, 3).map((factor, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded bg-[#10141f] border border-[#1b2233] text-[10px] font-mono text-slate-300 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2 border-t border-[#1b2233]">
                    
                    {/* View on Chart */}
                    <button
                      onClick={() => onOpenChart(signal.symbol, signal.timeframe)}
                      className="px-2 py-1.5 rounded bg-[#10141f] hover:bg-[#151c2b] text-slate-200 text-xs font-mono font-semibold transition flex items-center justify-center gap-1 border border-[#1e2538]"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CHART</span>
                    </button>

                    {/* AI Plan Deep Dive */}
                    <button
                      onClick={() => onOpenAiAnalysis(signal)}
                      className="px-2 py-1.5 rounded bg-[#121b2b] hover:bg-[#18243a] text-cyan-300 text-xs font-mono font-semibold transition flex items-center justify-center gap-1 border border-cyan-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI PLAN</span>
                    </button>

                    {/* News Impact Inspector */}
                    <button
                      onClick={() => setSelectedNewsSignal(signal)}
                      className={`px-2 py-1.5 rounded text-xs font-mono font-semibold transition flex items-center justify-center gap-1 border ${
                        hasImpact
                          ? isHighImpact
                            ? 'bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border-rose-500/40'
                            : 'bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : 'bg-[#10141f] hover:bg-[#151c2b] text-slate-400 border-[#1e2538]'
                      }`}
                      title="Inspect Economic Calendar Impact"
                    >
                      <Flame className={`w-3.5 h-3.5 ${hasImpact ? (isHighImpact ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}`} />
                      <span>NEWS</span>
                    </button>

                    {/* Paper Trade */}
                    <button
                      onClick={() => onExecuteTrade(signal)}
                      className="px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>TRADE</span>
                    </button>

                    {/* Send Telegram */}
                    <button
                      onClick={() => onSendTelegram(signal)}
                      disabled={sendingTelegramId === signal.id}
                      className={`px-2 py-1.5 rounded text-xs font-mono font-semibold transition flex items-center justify-center gap-1 border ${
                        signal.telegramSent
                          ? 'bg-sky-950/40 text-sky-300 border-sky-500/40'
                          : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/50'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTelegramId === signal.id ? '...' : signal.telegramSent ? 'SENT' : 'TG'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market Watchlist Heatmap Table - Swiss Institutional View */}
      <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-3 border-b border-[#1c2233] pb-2.5">
          <div>
            <h3 className="font-bold font-mono text-white text-xs tracking-wider uppercase flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              LIVE TICKER & QUOTE MATRIX
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Deterministic tick updates</p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tabular-nums">{symbols.length} WATCHED ASSETS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090b10] text-slate-400 border-b border-[#1c2233]">
              <tr>
                <th className="py-2 px-3 text-[10px] tracking-wider uppercase font-semibold">ASSET</th>
                <th className="py-2 px-3 text-[10px] tracking-wider uppercase font-semibold">CLASS</th>
                <th className="py-2 px-3 text-[10px] tracking-wider uppercase font-semibold">PRICE</th>
                <th className="py-2 px-3 text-[10px] tracking-wider uppercase font-semibold">24H CHANGE</th>
                <th className="py-2 px-3 text-[10px] tracking-wider uppercase font-semibold">24H RANGE</th>
                <th className="py-2 px-3 text-[10px] tracking-wider uppercase font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161b29]">
              {symbols.map(sym => {
                const isPos = sym.change24h >= 0;
                return (
                  <tr key={sym.symbol} className="hover:bg-[#121622] transition">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {sym.symbol}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-slate-400 text-[11px] font-semibold">{sym.assetClass}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-100 tabular-nums">${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.digits })}</td>
                    <td className={`py-2.5 px-3 font-bold tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{sym.change24h}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px] tabular-nums">
                      L: ${sym.low24h} — H: ${sym.high24h}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onOpenChart(sym.symbol, '15m')}
                        className="px-2 py-0.5 rounded bg-[#10141f] hover:bg-[#161e30] text-emerald-400 text-[10px] font-mono font-bold border border-[#1e2538] flex items-center gap-1"
                      >
                        <BarChart2 className="w-3 h-3" /> CHART
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* News Impact Modal / Overlay Drawer */}
      {selectedNewsSignal && (
        <NewsImpactModal
          signal={selectedNewsSignal}
          onClose={() => setSelectedNewsSignal(null)}
          onOpenChart={onOpenChart}
        />
      )}
    </div>
  );
};
