import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Clock, 
  Percent, 
  Sliders, 
  Layers, 
  Key, 
  CheckCircle2, 
  RotateCcw,
  Zap,
  Globe,
  Radio,
  Calendar,
  Lock,
  MessageSquare,
  GripVertical,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Shield,
  Activity
} from 'lucide-react';
import { BotSettings, MarketSymbol } from '../types';
import { BrokerConnectionSettings } from './BrokerConnectionSettings';

interface SettingsViewProps {
  settings: BotSettings;
  symbols: MarketSymbol[];
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  symbols,
  onUpdateSettings,
}) => {
  const [formState, setFormState] = useState<BotSettings>({ ...settings });
  const [saveToast, setSaveToast] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'forex' | 'crypto' | 'commodity' | 'index'>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formState);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newActive = [...formState.activeSymbols];
    const draggedItem = newActive[draggedIndex];
    newActive.splice(draggedIndex, 1);
    newActive.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setFormState({ ...formState, activeSymbols: newActive });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveSymbol = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formState.activeSymbols.length) return;
    const newActive = [...formState.activeSymbols];
    const temp = newActive[index];
    newActive[index] = newActive[targetIndex];
    newActive[targetIndex] = temp;
    setFormState({ ...formState, activeSymbols: newActive });
  };

  const removeSymbol = (sym: string) => {
    const updated = formState.activeSymbols.filter(s => s !== sym);
    setFormState({ ...formState, activeSymbols: updated });
  };

  const addSymbol = (sym: string) => {
    if (!formState.activeSymbols.includes(sym)) {
      setFormState({ ...formState, activeSymbols: [...formState.activeSymbols, sym] });
    }
  };

  const filteredCatalog = symbols.filter(s => {
    if (selectedCategory === 'ALL') return true;
    return s.assetClass === selectedCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full max-w-full overflow-hidden">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            Market Radar Bot Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Tune algorithmic scanning thresholds, live data providers, trailing stop rules, and notifications.
          </p>
        </div>

        {saveToast && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved!
          </div>
        )}
      </div>

      {/* Dedicated Direct Broker API Connection Component */}
      <BrokerConnectionSettings
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        language={settings.language || 'ar'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Live Data Source & Exchange Connection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-sky-400" />
            Market Data Feed & Live Exchange Bridge
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                Market Data Feed Mode:
              </label>
              <select
                value={formState.dataSource}
                onChange={(e) => setFormState({ ...formState, dataSource: e.target.value as any })}
                className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="HYBRID">Hybrid (Real-time Biquote + Binance Crypto + Macro)</option>
                <option value="BINANCE_LIVE">Binance & Biquote Public Live Stream</option>
                <option value="SIMULATED">Simulated Low-Latency Tick Feed</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Fetches live Forex, Metals, Indices, and Crypto rates with real-time latency analyzer.
              </p>
            </div>

            {/* Economic News Calendar Filter */}
            <div className="flex flex-col justify-between">
              <label className="text-slate-300 font-semibold block mb-1.5">
                High-Impact Macro News Filter:
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Pause executions 30m before major news</span>
                </div>
                <input
                  type="checkbox"
                  checked={formState.economicNewsFilter}
                  onChange={(e) => setFormState({ ...formState, economicNewsFilter: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Close & ATR Risk Trigger Engine */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Auto-Close Trigger & ATR Multiplier Engine
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Automatically execute Take Profit & Stop Loss closures on open live broker orders scaled dynamically to asset volatility (ATR).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                (formState.atrTpMultiplier || 2.5) / (formState.atrSlMultiplier || 1.5) >= 1.5 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/30'
              }`}>
                Dynamic R:R = 1 : {((formState.atrTpMultiplier || 2.5) / (formState.atrSlMultiplier || 1.5)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Master Auto-Close Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold block">Auto-Close Open Trades</span>
                  <span className="text-[10px] text-slate-400 font-sans">Enforce TP/SL closures automatically</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.autoCloseEnabled ?? true}
                onChange={(e) => setFormState({ ...formState, autoCloseEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Opposite Signal Reversal Auto-Close */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="font-semibold block">Opposite Signal Auto-Close</span>
                  <span className="text-[10px] text-slate-400 font-sans">Close early if strong reversal emerges</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.autoCloseOnOppositeSignal ?? true}
                onChange={(e) => setFormState({ ...formState, autoCloseOnOppositeSignal: e.target.checked })}
                className="w-4 h-4 rounded text-rose-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* ATR Take-Profit Multiplier */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ArrowUp className="w-3.5 h-3.5" />
                  Take Profit (TP) Multiplier:
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {(formState.atrTpMultiplier ?? 2.5).toFixed(1)}x ATR
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={6.0}
                step={0.1}
                value={formState.atrTpMultiplier ?? 2.5}
                onChange={(e) => setFormState({ ...formState, atrTpMultiplier: Number(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>1.0x (Tight Scalp)</span>
                <span className="text-slate-300 font-mono">Target = Entry ± (ATR × {(formState.atrTpMultiplier ?? 2.5).toFixed(1)})</span>
                <span>6.0x (Swing Runner)</span>
              </div>
            </div>

            {/* ATR Stop-Loss Multiplier */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                  Stop Loss (SL) Multiplier:
                </span>
                <span className="text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                  {(formState.atrSlMultiplier ?? 1.5).toFixed(1)}x ATR
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={4.0}
                step={0.1}
                value={formState.atrSlMultiplier ?? 1.5}
                onChange={(e) => setFormState({ ...formState, atrSlMultiplier: Number(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>0.5x (Ultra Tight)</span>
                <span className="text-slate-300 font-mono">Risk = Entry ∓ (ATR × {(formState.atrSlMultiplier ?? 1.5).toFixed(1)})</span>
                <span>4.0x (Wide Buffer)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trailing Stop & Risk Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Stop ديناميكي (ATR-based) & حماية أرباح السوينج
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Dynamic ATR Trailing Stop Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-semibold block">Stop ديناميكي متكيف (ATR-based)</span>
                  <span className="text-[10px] text-slate-400 font-sans">يتحرك مع السعر بمضاعف ATR لحماية الأرباح العائمة</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.atrDynamicTrailingEnabled ?? true}
                onChange={(e) => setFormState({ ...formState, atrDynamicTrailingEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* ATR Dynamic Trailing Multiplier */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-semibold">
                <span className="text-cyan-400">مسافة الوقف المتحرك (ATR Trailing Distance):</span>
                <span className="text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {(formState.atrTrailingMultiplier ?? 1.5).toFixed(1)}x ATR
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={3.0}
                step={0.1}
                value={formState.atrTrailingMultiplier ?? 1.5}
                onChange={(e) => setFormState({ ...formState, atrTrailingMultiplier: Number(e.target.value) })}
                className="w-full accent-cyan-500 bg-slate-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>0.8x (قفل أرباح سريع)</span>
                <span>3.0x (مساحة أكبر للسوينج)</span>
              </div>
            </div>

            {/* Volatility Spike Filter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold block">فلتر التقلّب اللحظي (Volatility Spike Filter)</span>
                  <span className="text-[10px] text-slate-400 font-sans">تجميد الدخول في شموع الذبذبة العشوائية الشاذة</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.volatilitySpikeFilterEnabled ?? true}
                onChange={(e) => setFormState({ ...formState, volatilitySpikeFilterEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Volatility Spike Threshold */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-semibold">
                <span className="text-amber-400">عتبة تصفية التقلب (Spike Threshold):</span>
                <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {(formState.volatilitySpikeThreshold ?? 2.4).toFixed(1)}x ATR
                </span>
              </div>
              <input
                type="range"
                min={1.5}
                max={4.0}
                step={0.1}
                value={formState.volatilitySpikeThreshold ?? 2.4}
                onChange={(e) => setFormState({ ...formState, volatilitySpikeThreshold: Number(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>1.5x (تصفية مشددة)</span>
                <span>4.0x (سماحية عالية)</span>
              </div>
            </div>

            {/* Early Invalidation Warning */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Radio className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="font-semibold block">تنبيه انعكاس مبكر (Early Invalidation)</span>
                  <span className="text-[10px] text-slate-400 font-sans">رصد انهيار الزخم أو فوليوم الانعكاس المعاكس</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.earlyInvalidationAlerts ?? true}
                onChange={(e) => setFormState({ ...formState, earlyInvalidationAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-rose-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Early Invalidation Auto De-Risk */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold block">سحب الوقف لنقطة الدخول تلقائياً (Auto De-Risk)</span>
                  <span className="text-[10px] text-slate-400 font-sans">تأمين الصفقة فور رصد إشارة ضعف مبكرة</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.earlyInvalidationAutoDeRisk ?? true}
                onChange={(e) => setFormState({ ...formState, earlyInvalidationAutoDeRisk: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Intermarket Macro Confluence Filter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-semibold block">فلتر توافق التحليل الكلي (Intermarket Analysis Filter)</span>
                  <span className="text-[10px] text-slate-400 font-sans">ربط إشارات الذهب والفوركس باتجاهات مؤشر الدولار DXY وعوائد السندات US10Y ومؤشر VIX</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.intermarketFilterEnabled ?? true}
                onChange={(e) => setFormState({ ...formState, intermarketFilterEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {/* 🎯 Multi-TP Partial Close & Risk Shield */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>الإغلاق الجزئي المتعدد وتأمين نقطة الدخول (Multi-TP Partial Close & Break-Even)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formState.multiTpPartialCloseEnabled ?? true}
                  onChange={(e) => setFormState({ ...formState, multiTpPartialCloseEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                عند وصول السعر للهدف الأول TP1: إغلاق 50% من حجم الصفقة وتثبيت الربح فوراً في المحفظة، مع سحب وقف الخسارة (SL) تلقائياً لنقطة الدخول (Break-Even) لضمان صفقة بدون مخاطرة تمتد نحو الأهداف البعيدة TP2 و TP3.
              </p>
            </div>

            {/* 🛡️ High-Impact News Shield */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>درع الأخبار الاقتصادية العنيفة (High-Impact News Shield)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formState.highImpactNewsShieldEnabled ?? true}
                  onChange={(e) => setFormState({ ...formState, highImpactNewsShieldEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <p className="text-[11px] text-slate-400 flex-1">
                  تجميد الدخول في الصفقات الجديدة قبل 10 دقائق من صدور بيانات الفائدة والتضخم والتوظيف (FOMC, CPI, NFP) لمنع الانزلاق السعري العنيف وتأمين الحساب.
                </p>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-mono text-[11px]">مهلة الحماية:</span>
                  <span className="text-rose-400 font-bold font-mono">{formState.newsShieldBufferMinutes || 10} دقيقة</span>
                </div>
              </div>
            </div>

            {/* Market Closures, Rollover & Pre-Weekend De-Risk Guard */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 md:col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>حارس إغلاقات الأسواق العالمية والتسويات اليومية (Market Closures Guard)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-200">حظر التداول عند الإغلاق</span>
                    <span className="text-[10px] text-slate-400">عطلات نهاية الأسبوع والأعياد</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formState.marketClosureGuardEnabled ?? true}
                    onChange={(e) => setFormState({ ...formState, marketClosureGuardEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-200">حارس التسوية اليومية</span>
                    <span className="text-[10px] text-slate-400">تجميد الصفقات 21:55-22:05 UTC</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formState.dailyRolloverGuardEnabled ?? true}
                    onChange={(e) => setFormState({ ...formState, dailyRolloverGuardEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-semibold block text-slate-200">تأمين صفقات نهاية الأسبوع</span>
                    <span className="text-[10px] text-slate-400">تضييق الوقف قبل إغلاق الجمعة</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formState.preWeekendDeRiskEnabled ?? true}
                    onChange={(e) => setFormState({ ...formState, preWeekendDeRiskEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Risk Per Trade */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
                <span>Risk Per Trade:</span>
                <span className="text-emerald-400 font-bold">{formState.riskPerTradePct}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.25}
                value={formState.riskPerTradePct}
                onChange={(e) => setFormState({ ...formState, riskPerTradePct: Number(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* 15% Max Daily Loss Margin (Circuit Breaker) */}
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <ShieldCheck className="w-4 h-4" />
                  أقصى هامش خسارة يومي (15% Max Daily Loss):
                </span>
                <span className="text-rose-300 font-bold font-mono bg-rose-950 px-2 py-0.5 rounded border border-rose-500/50">
                  {formState.maxDailyLossPct || 15.0}% من رأس المال
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                step={1}
                value={formState.maxDailyLossPct || 15}
                onChange={(e) => setFormState({ ...formState, maxDailyLossPct: Number(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>5% (تحفظ شديد)</span>
                <span className="text-rose-300 font-mono">الحد الحالي: 15% ($0.15 لكل $1.00 رصيد)</span>
                <span>25% (مرونة مضاربة)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                قاطع الحماية التلقائي (Circuit Breaker): عند وصول إجمالي الخسائر العائمة والمحققة خلال اليوم إلى 15% من رأس مال المحفظة يتم إيقاف فتح أي صفقات جديدة فوراً لحماية رأس المال.
              </p>
            </div>

            {/* Account Capital */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                رصيد المحفظة / حساب التداول ($):
              </label>
              <input
                type="number"
                value={formState.accountBalance}
                onChange={(e) => setFormState({ ...formState, accountBalance: Number(e.target.value) })}
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">يتم تحديث الرصيد تلقائياً وبدقة فور ربط حساب Bybit / Binance / البروكر الحقيقي.</span>
            </div>

            {/* 10x Daily Profit Target */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
                <span>Daily Profit Target Multiplier (مضاعف هدف الربح):</span>
                <span className="text-emerald-400 font-bold font-mono">{formState.dailyProfitTargetMultiplier || 10}x (${((formState.accountBalance || 50) * (formState.dailyProfitTargetMultiplier || 10)).toFixed(0)})</span>
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={formState.dailyProfitTargetMultiplier || 10}
                onChange={(e) => setFormState({ ...formState, dailyProfitTargetMultiplier: Number(e.target.value), dailyProfitTargetUSD: Number(e.target.value) * (formState.accountBalance || 50) })}
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Target: 10x (${((formState.accountBalance || 50) * (formState.dailyProfitTargetMultiplier || 10)).toFixed(2)} USD Daily Target)</span>
            </div>
          </div>
        </div>

        {/* Discord & Webhook Integration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Discord Webhook & Multi-Channel Broadcast
          </h3>

          <div className="grid grid-cols-1 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                Discord Webhook URL (Optional):
              </label>
              <input
                type="text"
                value={formState.discordWebhookUrl || ''}
                onChange={(e) => setFormState({ ...formState, discordWebhookUrl: e.target.value, discordEnabled: Boolean(e.target.value) })}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Sends beautiful rich embed alerts with Take Profit targets and AI Trade plans directly to your Discord channel.
              </p>
            </div>
          </div>
        </div>

          {/* Dedicated Watchlist Manager with Drag & Drop */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Dedicated Watchlist Manager ({formState.activeSymbols.length} Active)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Drag and drop or use the arrows to reorder scan priority. Click delete to remove a pair.
              </p>
              <div className="mt-2 text-[11px] bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  <strong>ملاحظة السياسة الاستثمارية:</strong> المؤشرات والنفط تعمل كبوصلة ومراجع ماكرو (Macro Barometers) لقراءة اتجاهات السوق، بينما التداول التلقائي محصور في أزواج الفوركس، الذهب والفضة، والعملات الرقمية.
                </span>
              </div>
            </div>

            {/* Category Filter Chips for Catalog */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              {(['ALL', 'forex', 'crypto', 'commodity', 'index'] as const).map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    selectedCategory === cat ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Active Ordered Watchlist */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-300">Current Scanner Priority List:</h4>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {formState.activeSymbols.map((symStr, index) => {
                const symObj = symbols.find(s => s.symbol === symStr);
                const isMacroOnly = symObj?.isTradeable === false || symObj?.macroRole === 'INDICATOR_ONLY';
                return (
                  <div
                    key={symStr}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      draggedIndex === index
                        ? 'bg-emerald-950/60 border-emerald-500/80 shadow-lg scale-[1.01]'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="w-5 text-center text-[10px] font-mono font-bold text-slate-500">
                        #{index + 1}
                      </span>
                      <div>
                        <span className="text-xs font-mono font-bold text-white mr-2">{symStr}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 uppercase font-mono mr-1.5">
                          {symObj?.assetClass || 'Asset'}
                        </span>
                        {isMacroOnly && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            مرجع ماكرو
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveSymbol(index, 'UP')}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSymbol(index, 'DOWN')}
                        disabled={index === formState.activeSymbols.length - 1}
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSymbol(symStr)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 ml-1"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Add From Available Catalog */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Available Asset Catalog (Click to add):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-xs">
              {filteredCatalog.map(sym => {
                const isTracked = formState.activeSymbols.includes(sym.symbol);
                const isMacroOnly = sym.isTradeable === false || sym.macroRole === 'INDICATOR_ONLY';
                return (
                  <button
                    type="button"
                    key={sym.symbol}
                    onClick={() => isTracked ? removeSymbol(sym.symbol) : addSymbol(sym.symbol)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isTracked 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{sym.symbol}</span>
                        {isMacroOnly && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">Macro</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">{sym.assetClass}</div>
                    </div>
                    {isTracked ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Active</span>
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
};
