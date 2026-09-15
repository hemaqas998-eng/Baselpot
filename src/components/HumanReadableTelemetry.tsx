import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Terminal, 
  Radio, 
  RefreshCw, 
  TrendingUp, 
  Gauge, 
  Layers, 
  Calculator, 
  Clock, 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  Pause,
  Play,
  Filter,
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface HumanReadableTelemetryEvent {
  id: string;
  timestamp: string;
  category: 'QUANTUM' | 'REGIME' | 'ALPHA' | 'KELLY' | 'KILLZONE' | 'BROKER' | 'SECURITY' | 'SYSTEM';
  categoryLabelArabic: string;
  categoryLabelEnglish: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'highlight';
  titleArabic: string;
  titleEnglish: string;
  descriptionArabic: string;
  descriptionEnglish: string;
  metrics?: Record<string, string | number>;
  rawLine: string;
  iconName: string;
}

interface HumanReadableTelemetryProps {
  onOpenVault?: () => void;
}

export const HumanReadableTelemetry: React.FC<HumanReadableTelemetryProps> = ({ onOpenVault }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [events, setEvents] = useState<HumanReadableTelemetryEvent[]>([]);
  const [pulseSummaryAr, setPulseSummaryAr] = useState<string>('');
  const [pulseSummaryEn, setPulseSummaryEn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'HUMAN' | 'RAW'>('HUMAN');
  const [rawLogs, setRawLogs] = useState<string[]>([]);

  const fetchTelemetry = async () => {
    if (isPaused) return;
    try {
      const res = await fetch('/api/quant-brain/human-telemetry?limit=60');
      const data = await res.json();
      if (data && data.success) {
        setEvents(data.events || []);
        setPulseSummaryAr(data.pulseArabic || '');
        setPulseSummaryEn(data.pulseEnglish || '');
      }
      
      const rawRes = await fetch('/api/quant-brain/telemetry?limit=60');
      const rawData = await rawRes.json();
      if (rawData && rawData.success && Array.isArray(rawData.logs)) {
        setRawLogs(rawData.logs);
      }
    } catch (e) {
      console.error('Failed to fetch telemetry:', e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'QUANTUM': return Gauge;
      case 'REGIME': return TrendingUp;
      case 'ALPHA': return Layers;
      case 'KELLY': return Calculator;
      case 'KILLZONE': return Clock;
      case 'BROKER': return Zap;
      case 'SECURITY': return ShieldCheck;
      default: return Cpu;
    }
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'highlight': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'success': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'warning': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'error': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredEvents = events.filter(ev => {
    const matchesCat = selectedCategory === 'ALL' || ev.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      ev.titleArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.descriptionArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.titleEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.rawLine.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'سجل تتبع محرك بايثون الكمي المقروء (Python Daemon Live Stream)' : 'Human-Readable Quant Telemetry Stream'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {isPaused ? (isAr ? 'متوقف مؤقتاً' : 'PAUSED') : 'LIVE TELEMETRY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'نصوص مقروءة ومحللة مباشرة من محرك الكوانتم مع مؤشرات الحالة والأمان' : 'Parsed human-friendly live stream from Python background daemon'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
              isPaused 
                ? 'bg-amber-950/60 border-amber-500 text-amber-300' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPaused ? (isAr ? 'استئناف البث' : 'Resume') : (isAr ? 'إيقاف مؤقت' : 'Pause')}</span>
          </button>

          {/* View Mode Toggle: Human vs Raw */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('HUMAN')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                viewMode === 'HUMAN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'نصوص مقروءة' : 'Readable'}
            </button>
            <button
              onClick={() => setViewMode('RAW')}
              className={`px-3 py-1 rounded-lg font-mono transition ${
                viewMode === 'RAW' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'سجل الأكواد (Raw)' : 'Raw Terminal'}
            </button>
          </div>

        </div>
      </div>

      {/* Real-time Executive Pulse Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/50 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs leading-relaxed text-slate-200">
          <strong className="text-indigo-300 font-bold block sm:inline">
            {isAr ? 'الملخص التنفيذي اللحظي لنبض المحرك:' : 'Live Engine Executive Pulse:'}
          </strong>{' '}
          {isAr ? (pulseSummaryAr || 'المحرك يعمل في وضع التماسك الإيجابي المستمر...') : (pulseSummaryEn || 'Quantum engine operational at peak coherence...')}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
            { id: 'QUANTUM', labelAr: 'الكوانتم والإنتروبيا', labelEn: 'Quantum' },
            { id: 'REGIME', labelAr: 'نظام هيرست', labelEn: 'Hurst' },
            { id: 'ALPHA', labelAr: 'السيولة و SMC', labelEn: 'Alpha SMC' },
            { id: 'KELLY', labelAr: 'حجم كيلي', labelEn: 'Kelly' },
            { id: 'KILLZONE', labelAr: 'جلسات البنوك', labelEn: 'Killzones' },
            { id: 'SECURITY', labelAr: 'الأمان والخزنة', labelEn: 'Security' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition font-semibold text-xs ${
                selectedCategory === tab.id
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في سجل التتبع...' : 'Search telemetry...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Telemetry Stream Display */}
      {viewMode === 'HUMAN' ? (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
              {isAr ? 'جارٍ استقبال وتحديث نبضات المحرك المقروءة...' : 'Streaming human telemetry...'}
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const IconComp = getCategoryIcon(ev.category);
              return (
                <div
                  key={ev.id}
                  className="p-4 bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          <span>{isAr ? ev.titleArabic : ev.titleEnglish}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getSeverityBadgeClass(ev.severity)}`}>
                            {isAr ? ev.categoryLabelArabic : ev.categoryLabelEnglish}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {ev.timestamp}
                    </span>
                  </div>

                  {/* Natural Language Explanation */}
                  <p className="text-xs text-slate-300 leading-relaxed pl-10 pr-2">
                    {isAr ? ev.descriptionArabic : ev.descriptionEnglish}
                  </p>

                  {/* Metrics Pills if Available */}
                  {ev.metrics && (
                    <div className="flex flex-wrap items-center gap-2 pl-10 pr-2 pt-1">
                      {Object.entries(ev.metrics).map(([mKey, mVal]) => (
                        <div
                          key={mKey}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5"
                        >
                          <span className="text-slate-500">{mKey}:</span>
                          <strong className="text-emerald-400 font-bold">{mVal}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Raw Terminal View (Toggleable) */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 h-96 overflow-y-auto space-y-1 scrollbar-thin">
          {rawLogs.map((l, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{' '}
              <span className={l.includes('ERROR') ? 'text-rose-400' : l.includes('WARN') ? 'text-amber-400' : l.includes('QUANT') ? 'text-cyan-300' : 'text-slate-300'}>
                {l}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
