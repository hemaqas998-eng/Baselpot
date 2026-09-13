import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw, 
  Send, 
  Volume2, 
  VolumeX, 
  Radio, 
  Activity, 
  BarChart2, 
  BrainCircuit, 
  Briefcase, 
  Settings as SettingsIcon,
  Sparkles,
  Terminal,
  Smartphone,
  Globe,
  GitCompare,
  Languages,
  Calculator,
  Clock,
  Cloud,
  Flame,
  Waves,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  FlaskConical,
  Network,
  Wallet,
  Coins
} from 'lucide-react';
import { BotStatus, MarketSymbol, BotSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ApiTroubleshootingModal } from './ApiTroubleshootingModal';

interface NavbarProps {
  status: BotStatus | null;
  symbols: MarketSymbol[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleBot: () => void;
  onScanNow: () => void;
  isScanning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLock?: () => void;
  settings?: BotSettings;
  onOpenLearningModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  symbols,
  activeTab,
  setActiveTab,
  onToggleBot,
  onScanNow,
  isScanning,
  soundEnabled,
  onToggleSound,
  onLock,
  settings,
  onOpenLearningModal,
}) => {
  const { t, language, setLanguage, toggleLanguage } = useLanguage();
  const isRunning = status?.isRunning ?? true;
  const isAr = language === 'ar';

  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);

  // Determine Active Broker Status
  const brokerCreds = settings?.brokerApiCredentials;
  const activeBroker = brokerCreds?.activeBroker || 'BYBIT';
  
  let brokerName = 'Bybit V5';
  let isBrokerValidated = false;
  let hasBrokerKey = false;

  if (activeBroker === 'BYBIT') {
    brokerName = 'Bybit V5';
    isBrokerValidated = Boolean(brokerCreds?.bybit?.isValidated);
    hasBrokerKey = Boolean(brokerCreds?.bybit?.apiKey);
  } else if (activeBroker === 'BINANCE') {
    brokerName = 'Binance';
    isBrokerValidated = Boolean(brokerCreds?.binance?.isValidated);
    hasBrokerKey = Boolean(brokerCreds?.binance?.apiKey);
  } else if (activeBroker === 'JUSTMARKETS') {
    brokerName = 'JustMarkets';
    isBrokerValidated = Boolean(brokerCreds?.justmarkets?.isValidated);
    hasBrokerKey = Boolean(brokerCreds?.justmarkets?.mtLogin);
  } else if (activeBroker === 'XM') {
    brokerName = 'XM Global';
    isBrokerValidated = Boolean(brokerCreds?.xm?.isValidated);
    hasBrokerKey = Boolean(brokerCreds?.xm?.mtLogin);
  } else {
    brokerName = 'Custom API';
    hasBrokerKey = Boolean(brokerCreds?.customRest?.apiKey);
  }

  const navTabs = [
    { id: 'crypto-hub', label: isAr ? 'سوق الكريبتو (Top 100 💎)' : 'Crypto Top 100 💎', icon: Coins, badge: '100 COINS' },
    { id: 'live-trades', label: isAr ? 'محفظة البروكر الحقيقية' : 'Live Real Broker Ledger', icon: Briefcase, count: status?.openTradesCount, badge: 'REAL' },
    { id: 'gemini-master', label: isAr ? 'الذكاء الثنائي (Gemini + DeepSeek)' : 'Dual AI (Gemini + DeepSeek)', icon: Sparkles, badge: 'DUAL AI', count: status?.activeSignalsCount },
    { id: 'liquidity-heatmap', label: isAr ? 'خريطة السيولة' : 'Liquidity', icon: Waves, badge: 'LIQ' },
    { id: 'cloud-autonomy', label: isAr ? 'السحابة 24/7' : 'Cloud 24/7', icon: Cloud, badge: '24/7' },
    { id: 'quantitative', label: t('tabUnifiedQuant'), icon: Calculator, badge: 'QUANT' },
    { id: 'market-hours', label: t('tabMarketHours'), icon: Clock, badge: 'TIME' },
    { id: 'chart', label: t('tabChart'), icon: BarChart2 },
    { id: 'monitor', label: t('tabMonitor'), icon: Terminal, badge: 'LIVE' },
    { id: 'telegram-creator', label: t('tabTelegramCreator'), icon: Send, badge: 'TMA', dot: status?.telegramConnected },
    { id: 'settings', label: t('tabSettings'), icon: SettingsIcon },
  ];

  return (
    <>
      <header className="border-b border-[#1c2233] bg-[#090b10] sticky top-0 z-50 w-full max-w-full overflow-hidden">
        {/* Swiss Micro-Ribbon: Ticker tape with tabular numbers */}
        <div className="bg-[#0b0e14] border-b border-[#161b29] px-3 sm:px-4 py-1 overflow-x-auto no-scrollbar flex items-center gap-4 sm:gap-6 text-[11px] font-mono w-full max-w-full">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold tracking-wider uppercase shrink-0 text-[10px]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            {t('liveFeeds')}
          </div>
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {symbols.map(sym => {
              const isPos = sym.change24h >= 0;
              return (
                <div key={sym.symbol} className="flex items-center gap-2 px-2 py-0.5 rounded bg-[#10141f] border border-[#1d2438]">
                  <span className="font-bold text-slate-300 tracking-tight">{sym.symbol}</span>
                  <span className="text-white font-semibold tabular-nums">${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.digits })}</span>
                  <span className={`text-[10px] font-medium tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}{sym.change24h}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Swiss Header Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Logo & High-Precision Chrono Indicator */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#121622] border border-[#262f47] p-1.5 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                      <span>{t('appTitle')}</span>
                      <span className="text-slate-400 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#131722] border border-[#222a3d] shrink-0 font-medium">v3.3 CHRONO</span>
                    </h1>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 hidden sm:block truncate tracking-tight">
                    SWISS HIGH-PRECISION QUANTITATIVE ENGINE
                  </p>
                </div>
              </div>

              {/* Bot Running Status Indicator */}
              <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-[#1c2233]">
                <div className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold flex items-center gap-2 border ${
                  isRunning 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' 
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isRunning ? t('botActive') : t('botPaused')}</span>
                </div>
                
                {isRunning && status?.nextScanSeconds !== undefined && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <span>{isAr ? 'المسح:' : 'SCAN:'}</span>
                    <span className="text-white font-bold tabular-nums">{status.nextScanSeconds}s</span>
                  </div>
                )}
              </div>

              {/* Broker API Health & Troubleshooting Indicator (Green / Red / Amber) */}
              <button
                onClick={() => setIsTroubleshootingOpen(true)}
                className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border transition hover:opacity-90 ${
                  isBrokerValidated
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : hasBrokerKey
                      ? 'bg-rose-950/50 border-rose-500/60 text-rose-300 animate-pulse'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                }`}
                title={isAr ? 'اضغط لفحص الاتصال وتشخيص أخطاء الـ API والـ IP Whitelist' : 'Click to run connection diagnostics & troubleshoot IP whitelist'}
              >
                <span className={`w-2 h-2 rounded-full ${
                  isBrokerValidated
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                    : hasBrokerKey
                      ? 'bg-rose-500 shadow-sm shadow-rose-500'
                      : 'bg-amber-400'
                }`} />
                <span className="truncate max-w-[130px]">
                  {brokerName}: {isBrokerValidated ? (isAr ? 'متصل وحي' : 'ACTIVE') : hasBrokerKey ? (isAr ? 'فحص IP / 10010' : 'IP / 10010') : (isAr ? 'ربط API' : 'SETUP')}
                </span>
                <Network className="w-3.5 h-3.5 opacity-70 shrink-0" />
              </button>

            </div>

            {/* Quick Actions & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Adaptive Learning & Anti-Overfitting Suite Quick Button */}
              {onOpenLearningModal && (
                <button
                  onClick={onOpenLearningModal}
                  className="px-2.5 py-1.5 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition flex items-center gap-1.5 border border-indigo-500/40 shadow-sm shadow-indigo-900/30"
                  title={isAr ? 'التعلم التكيفي، تشريح الصفقات، ومنع الـ Overfitting' : 'Adaptive Pattern Learning & Anti-Overfitting Suite'}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="hidden md:inline font-mono text-[11px]">{isAr ? 'التعلم التكيفي 🧠' : 'ADAPTIVE AI'}</span>
                </button>
              )}

              {/* Diagnostic / Troubleshooting Quick Button */}
              <button
                onClick={() => setIsTroubleshootingOpen(true)}
                className="px-2 py-1.5 rounded bg-[#10141f] hover:bg-[#151b29] text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition flex items-center gap-1.5 border border-cyan-500/30"
                title={isAr ? 'تشخيص الاتصال و Bybit IP Whitelist' : 'Diagnose Connection & Whitelist'}
              >
                <Network className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono text-[11px]">{isAr ? 'تشخيص IP' : 'DIAGNOSE'}</span>
              </button>

              {/* Live Real / Paper Mode Badge Button */}
              <button
                onClick={() => setActiveTab('settings')}
                className="px-2.5 py-1.5 rounded bg-[#10141f] hover:bg-[#151b29] text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-[#222a3d] hover:border-amber-500/50"
                title={isAr ? 'إعدادات التداول الحقيقي والبروكر' : 'Live Broker & Real Trading Gateway'}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-mono text-[11px]">{isAr ? 'البروكر الحقيقي' : 'BROKER GATEWAY'}</span>
              </button>

              {/* Language Switcher Button */}
              <button
                onClick={toggleLanguage}
                className="px-2 py-1.5 rounded bg-[#10141f] hover:bg-[#151b29] text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-[#222a3d]"
                title={language === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
              >
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px]">{language === 'ar' ? 'AR' : 'EN'}</span>
              </button>

              {/* Security Vault Lock Button */}
              {onLock && (
                <button
                  onClick={onLock}
                  className="px-2 py-1.5 rounded bg-[#10141f] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#222a3d] hover:border-rose-500/40 text-xs font-semibold transition flex items-center gap-1"
                  title={isAr ? 'قفل الخزنة والبيانات الشخصية' : 'Lock Security Vault'}
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden lg:inline font-mono text-[11px]">{isAr ? 'قفل' : 'LOCK'}</span>
                </button>
              )}

              {/* Start / Pause Bot Toggle */}
              <button
                onClick={onToggleBot}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition flex items-center gap-1.5 border ${
                  isRunning
                    ? 'bg-[#141924] hover:bg-[#1a2130] text-amber-300 border-amber-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                }`}
                title={isRunning ? t('pause') : t('start')}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{t('pause')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{t('start')}</span>
                  </>
                )}
              </button>

              {/* Scan Now Button */}
              <button
                onClick={onScanNow}
                disabled={isScanning}
                className="px-3 py-1.5 rounded bg-[#151b2a] hover:bg-[#1c2438] text-emerald-400 hover:text-emerald-300 text-xs font-mono font-semibold transition flex items-center gap-1.5 border border-emerald-500/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">{isScanning ? (isAr ? 'جارٍ المسح...' : 'SCANNING...') : (isAr ? 'مسح فوري' : 'SCAN NOW')}</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'Mute Alert Sounds' : 'Unmute Alert Sounds'}
                className="p-1.5 sm:p-2 rounded bg-[#10141f] hover:bg-[#151b29] text-slate-400 border border-[#222a3d] transition"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs - Swiss Minimalist Style */}
          <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#161c2b] text-white border border-[#2a344f] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold tabular-nums ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#10141f] text-slate-400 border border-[#1c2233]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#131722] border border-[#262f47] text-slate-300">
                      {tab.badge}
                    </span>
                  )}
                  {tab.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* API Troubleshooting & 10010 Diagnostic Modal */}
      {settings && (
        <ApiTroubleshootingModal
          isOpen={isTroubleshootingOpen}
          onClose={() => setIsTroubleshootingOpen(false)}
          settings={settings}
          language={language}
          onNavigateToSettings={() => {
            setIsTroubleshootingOpen(false);
            setActiveTab('settings');
          }}
        />
      )}
    </>
  );
};
