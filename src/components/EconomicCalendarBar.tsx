import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Flame, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Info,
  Zap,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { EconomicCalendarEvent } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface EconomicCalendarBarProps {
  onSelectAffectedSymbol?: (symbol: string) => void;
  selectedSymbolFilter?: string | null;
}

export const EconomicCalendarBar: React.FC<EconomicCalendarBarProps> = ({
  onSelectAffectedSymbol,
  selectedSymbolFilter
}) => {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<EconomicCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');

  const fetchCalendar = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const url = forceRefresh ? '/api/radar/economic-calendar/refresh' : '/api/radar/economic-calendar';
      const method = forceRefresh ? 'POST' : 'GET';
      const res = await fetch(url, { method });
      const data = await res.json();
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch economic calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    const interval = setInterval(() => fetchCalendar(false), 25000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (scheduledTime: number) => {
    const diffMs = scheduledTime - Date.now();
    if (diffMs <= 0) {
      const pastMins = Math.abs(Math.floor(diffMs / 60000));
      return pastMins < 60 
        ? (language === 'ar' ? `صدرت منذ ${pastMins} دقيقة` : `Released ${pastMins}m ago`)
        : (language === 'ar' ? 'صدرت اليوم' : 'Released today');
    }
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return language === 'ar' ? `خلال ${mins} دقيقة` : `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return language === 'ar' ? `خلال ${hours} س و ${remMins} د` : `in ${hours}h ${remMins}m`;
  };

  const getCurrencyFlag = (currency: string) => {
    switch (currency) {
      case 'USD': return '🇺🇸';
      case 'EUR': return '🇪🇺';
      case 'GBP': return '🇬🇧';
      case 'JPY': return '🇯🇵';
      case 'AUD': return '🇦🇺';
      case 'CAD': return '🇨🇦';
      case 'CHF': return '🇨🇭';
      default: return '🌐';
    }
  };

  const filteredEvents = events.filter(e => {
    if (selectedImpact !== 'ALL' && e.impact !== selectedImpact) return false;
    return true;
  });

  const highImpactCount = events.filter(e => e.impact === 'HIGH').length;

  return (
    <div className="bg-[#0e1118] border border-[#1c2233] rounded-lg overflow-hidden transition-all duration-200">
      
      {/* Header Bar */}
      <div className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 bg-[#0a0d14] border-b border-[#1c2233]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#141924] border border-[#222a3d] flex items-center justify-center text-amber-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-mono text-xs text-white tracking-wider uppercase flex items-center gap-1.5">
                {t('economicCalendar')}
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t('liveFeeds')}
              </span>
              {highImpactCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  {highImpactCount} {language === 'ar' ? 'أحداث عالية التأثير' : 'HIGH IMPACT'}
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              {t('economicDesc')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCalendar(true)}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#10141f] hover:bg-[#161e30] text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 border border-[#1e2538] transition disabled:opacity-50"
            title={language === 'ar' ? 'تحديث البيانات اللحظية' : 'Refresh Real-time Data'}
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded bg-[#10141f] hover:bg-[#161e30] text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 border border-[#1e2538] transition"
          >
            <span>{isExpanded ? (language === 'ar' ? 'طي' : 'COLLAPSE') : (language === 'ar' ? 'عرض الكل' : 'EXPAND')}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Horizontal Compact Preview Strip (when collapsed) */}
      {!isExpanded && (
        <div className="p-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {events.slice(0, 6).map(ev => {
              const isHigh = ev.impact === 'HIGH';
              const isMed = ev.impact === 'MEDIUM';
              const isImminent = ev.scheduledTime - Date.now() < 60 * 60 * 1000 && ev.scheduledTime - Date.now() > 0;

              return (
                <div
                  key={ev.id}
                  className={`px-2.5 py-1.5 rounded border flex items-center gap-2 text-xs transition ${
                    isHigh
                      ? 'bg-rose-950/20 border-rose-500/30 text-slate-200'
                      : isMed
                      ? 'bg-amber-950/15 border-amber-500/30 text-slate-200'
                      : 'bg-[#0a0d14] border-[#1c2233] text-slate-300'
                  }`}
                >
                  <span className="text-sm">{getCurrencyFlag(ev.currency)}</span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white max-w-[160px] truncate text-[11px]">{ev.title}</span>
                      <span className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                        isHigh ? 'bg-rose-500/20 text-rose-300' : isMed ? 'bg-amber-500/20 text-amber-300' : 'bg-[#141924] text-slate-400'
                      }`}>
                        {ev.impact}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className={`flex items-center gap-1 tabular-nums ${isImminent ? 'text-amber-400 font-bold' : ''}`}>
                        <Clock className="w-2.5 h-2.5" />
                        {formatCountdown(ev.scheduledTime)}
                      </span>
                      {ev.actual ? (
                        <>
                          <span>•</span>
                          <span className={`font-bold tabular-nums ${ev.actualSurprise === 'BEAT' ? 'text-emerald-400' : ev.actualSurprise === 'MISS' ? 'text-rose-400' : 'text-slate-200'}`}>
                            Act: {ev.actual}
                          </span>
                        </>
                      ) : null}
                      <span>•</span>
                      <span className="tabular-nums">FC: {ev.forecast}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Full Calendar Grid */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Impact Filter Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> {language === 'ar' ? 'تصفية حسب التأثير:' : 'Filter Impact:'}
            </span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedImpact(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedImpact === lvl
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {lvl === 'ALL' ? (language === 'ar' ? 'الكل' : 'ALL') : lvl}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEvents.map(ev => {
              const isHigh = ev.impact === 'HIGH';
              const isMed = ev.impact === 'MEDIUM';

              return (
                <div
                  key={ev.id}
                  className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Top Row: Currency, Impact, Countdown */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCurrencyFlag(ev.currency)}</span>
                        <div>
                          <span className="font-bold text-xs text-white font-mono">{ev.currency}</span>
                          {ev.country && <span className="text-[10px] text-slate-400 block">{ev.country}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isHigh 
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' 
                            : isMed 
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ev.impact}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-extrabold text-sm text-slate-100 mb-1">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                        {ev.description}
                      </p>
                    )}

                    {/* Macro Stats */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 rounded-lg p-2 text-center text-xs font-mono border border-slate-800/80">
                      <div>
                        <span className="text-[9px] text-slate-400 block">{t('countdown')}</span>
                        <span className="font-bold text-amber-400 text-[11px]">
                          {formatCountdown(ev.scheduledTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">{t('forecast')}</span>
                        <span className="font-bold text-slate-200 text-[11px]">{ev.forecast}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">{t('previous')}</span>
                        <span className="font-bold text-slate-300 text-[11px]">{ev.previous}</span>
                      </div>
                    </div>

                    {/* Live Actual Release Box if Available */}
                    {ev.actual && (
                      <div className={`mt-2 p-2 rounded-lg border text-xs flex items-center justify-between font-mono ${
                        ev.actualSurprise === 'BEAT' 
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                          : ev.actualSurprise === 'MISS'
                          ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {ev.actualSurprise === 'BEAT' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                          <span className="font-bold">{t('actual')}: {ev.actual}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-bold bg-black/40">
                          {ev.actualSurprise === 'BEAT' ? (language === 'ar' ? '🟢 أعلى من التوقعات' : '🟢 Above Forecast') : (language === 'ar' ? '🔴 أدنى من التوقعات' : '🔴 Below Forecast')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Affected Symbols */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-semibold">
                      {t('affectedAssets')}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ev.affectedSymbols.map(sym => (
                        <button
                          key={sym}
                          onClick={() => onSelectAffectedSymbol?.(sym)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                            selectedSymbolFilter === sym
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
