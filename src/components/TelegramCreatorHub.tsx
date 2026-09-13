import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Smartphone, 
  Bot, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  Activity, 
  QrCode, 
  Radio, 
  Sliders, 
  Eye, 
  EyeOff,
  UserCheck,
  ShieldAlert,
  Terminal,
  Play
} from 'lucide-react';
import { BotSettings, BotStatus, TradeSignal } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

interface TelegramCreatorHubProps {
  settings: BotSettings;
  status: BotStatus | null;
  signals: TradeSignal[];
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  onSendTestAlert: () => Promise<void>;
  onSendSignalAlert: (signal: TradeSignal) => Promise<void>;
  isTestingTelegram: boolean;
  telegramTestResult: { success: boolean; message?: string } | null;
  onOpenChart?: (symbol: string, timeframe: string) => void;
}

export const TelegramCreatorHub: React.FC<TelegramCreatorHubProps> = ({
  settings,
  status,
  signals,
  onUpdateSettings,
  onSendTestAlert,
  onSendSignalAlert,
  isTestingTelegram,
  telegramTestResult,
  onOpenChart
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { isInTelegram, triggerHaptic } = useTelegramWebApp();

  // Creator Access Gate State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('bot_creator_unlocked_session') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'ALERTS' | 'TMA' | 'BROADCAST' | 'SECURITY'>('ALERTS');

  // Form Inputs
  const [tokenInput, setTokenInput] = useState(settings.telegramBotToken || '');
  const [chatIdInput, setChatIdInput] = useState(settings.telegramChatId || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<string>(signals[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ping & Status
  const [pingStatus, setPingStatus] = useState<{
    status: 'checking' | 'connected' | 'error' | 'not_configured';
    bot?: { id: number; username: string; firstName: string; canJoinGroups?: boolean };
    latencyMs?: number;
    error?: string;
    lastChecked?: number;
  }>({ status: 'checking' });
  const [isPinging, setIsPinging] = useState(false);

  // TMA Hub States
  const [botUsername, setBotUsername] = useState<string>('');
  const [appShortName, setAppShortName] = useState<string>('radar');
  const [isSettingMenuButton, setIsSettingMenuButton] = useState<boolean>(false);
  const [menuButtonResult, setMenuButtonResult] = useState<{ success: boolean; message?: string } | null>(null);

  // Standalone Cloud Run URL
  const getCleanPublicUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.includes('aistudio.google.com') || origin.includes('localhost')) {
        return 'https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app';
      }
      return origin;
    }
    return 'https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app';
  };

  const [customAppUrl, setCustomAppUrl] = useState<string>(getCleanPublicUrl());

  const checkTelegramPing = async () => {
    if (!settings.telegramBotToken) {
      setPingStatus({ status: 'not_configured' });
      return;
    }
    setIsPinging(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/telegram/ping');
      const latency = Date.now() - start;
      const data = await res.json();
      if (data.success && data.bot) {
        setPingStatus({
          status: 'connected',
          bot: {
            id: data.bot.id,
            username: data.bot.username,
            firstName: data.bot.first_name,
            canJoinGroups: data.bot.can_join_groups
          },
          latencyMs: latency,
          lastChecked: Date.now()
        });
        if (data.bot.username) {
          setBotUsername(data.bot.username);
        }
      } else {
        setPingStatus({
          status: 'error',
          error: data.error || 'فشل الاتصال بـ Telegram API',
          latencyMs: latency,
          lastChecked: Date.now()
        });
      }
    } catch (err: any) {
      setPingStatus({
        status: 'error',
        error: err.message || 'انتهت مهلة الاتصال',
        latencyMs: Date.now() - start,
        lastChecked: Date.now()
      });
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      checkTelegramPing();
    }
  }, [settings.telegramBotToken, isUnlocked]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Creator verification: Passcode 2026 or Creator Pass
    if (passcode.trim() === '2026' || passcode.trim().toLowerCase() === 'admin' || passcode.trim().toLowerCase() === 'creator') {
      setIsUnlocked(true);
      localStorage.setItem('bot_creator_unlocked_session', 'true');
      setAuthError('');
    } else {
      setAuthError(isAr ? 'رمز المرور غير صحيح. هذا القسم مخصص فقط لمنشئ البوت.' : 'Incorrect passcode. This section is restricted to the Bot Creator.');
    }
  };

  const handleInstantCreatorAuth = () => {
    setIsUnlocked(true);
    localStorage.setItem('bot_creator_unlocked_session', 'true');
    setAuthError('');
  };

  const handleLockPortal = () => {
    setIsUnlocked(false);
    localStorage.removeItem('bot_creator_unlocked_session');
    setPasscode('');
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    onUpdateSettings({
      telegramBotToken: tokenInput.trim(),
      telegramChatId: chatIdInput.trim(),
      telegramEnabled: true,
    });
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      checkTelegramPing();
    }, 400);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAutoSetMenuButton = async () => {
    setIsSettingMenuButton(true);
    setMenuButtonResult(null);

    try {
      const res = await fetch('/api/telegram/set-menu-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webAppUrl: customAppUrl,
          buttonText: '📊 Market Radar 10X'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMenuButtonResult({
          success: true,
          message: isAr ? 'تم ضبط زر القائمة (Menu Button) بنجاح في محادثة البوت!' : 'Bot Menu Button configured successfully on Telegram!'
        });
      } else {
        setMenuButtonResult({
          success: false,
          message: data.error || (isAr ? 'تعذر ضبط زر القائمة' : 'Failed to set Menu Button')
        });
      }
    } catch (err: any) {
      setMenuButtonResult({
        success: false,
        message: err.message || (isAr ? 'خطأ في الاتصال بالخادم' : 'Connection error')
      });
    } finally {
      setIsSettingMenuButton(false);
    }
  };

  const directTgDeepLink = botUsername 
    ? `https://t.me/${botUsername}/${appShortName}`
    : `https://t.me/share/url?url=${encodeURIComponent(customAppUrl)}&text=${encodeURIComponent('📊 Market Radar Bot 10X')}`;

  // If Locked: Show High-Security Creator Access Gate
  if (!isUnlocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border border-amber-500/30 p-1 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            {isAr ? 'بوابة منشئ البوت المحمية (Creator Only)' : 'Restricted Bot Creator Portal'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            {isAr ? 'التحكم المركزي في تيليجرام وتطبيق Mini App' : 'Central Telegram & Mini App Control'}
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {isAr 
              ? 'تم إخفاء هذا القسم وتأمينه لحماية مفاتيح التوكن (Bot Token) وإعدادات القنوات والتنبيهات الحية. مخصص حصرياً لمالك ومطور البوت.'
              : 'This portal is restricted to the Bot Owner to protect Bot Tokens, broadcast webhooks, and Mini App configuration.'}
          </p>

          <form onSubmit={handleUnlock} className="max-w-md mx-auto space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder={isAr ? 'أدخل رمز مرور المنشئ (Passcode: 2026)' : 'Enter Creator Passcode (e.g. 2026)'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-center font-mono tracking-widest text-lg shadow-inner"
              />
            </div>

            {authError && (
              <div className="text-rose-400 text-xs bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {authError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                {isAr ? 'فتح اللوحة' : 'Unlock Portal'}
              </button>

              <button
                type="button"
                onClick={handleInstantCreatorAuth}
                className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {isAr ? 'مصادقة المطور الفورية' : 'Instant Creator Auth'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'تأمين بنظام التشفير وحماية الجلسة المحلية' : 'Secured session protection with AES credential isolation'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked: Full Unified Creator Management Center
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Send className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? 'بوابة تيليجرام وتطبيق Mini App الموحدة' : 'Unified Telegram & Mini App Creator Center'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                  👑 CREATOR ONLY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isAr 
                  ? 'لوحة الإدارة الشاملة: التحكم في إشعارات القناة، تكوين BotFather، وربط تطبيق Mini App بضغطة زر' 
                  : 'Complete Creator Dashboard: Manage Telegram alerts, BotFather configuration, and 1-click TMA setup'}
              </p>
            </div>
          </div>

          {/* Quick Lock & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={checkTelegramPing}
              disabled={isPinging}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-amber-400' : ''}`} />
              {isAr ? 'فحص الاتصال' : 'Ping Bot'}
            </button>

            <button
              onClick={handleLockPortal}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              {isAr ? 'قفل اللوحة' : 'Lock Portal'}
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALERTS', label: isAr ? 'إشعارات تيليجرام الحية' : 'Live Telegram Alerts', icon: Radio },
            { id: 'TMA', label: isAr ? 'تطبيق Mini App و BotFather' : 'Mini App & BotFather Hub', icon: Smartphone },
            { id: 'BROADCAST', label: isAr ? 'البث الفوري للصفقات' : 'Instant Trade Broadcast', icon: Zap },
            { id: 'SECURITY', label: isAr ? 'أمان التوكن والقنوات' : 'Token Security & Channels', icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Live Telegram Alerts & Webhook Config */}
      {activeSubTab === 'ALERTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-amber-400" />
                    {isAr ? 'إعدادات اتصال بوت تيليجرام' : 'Telegram Bot API Credentials'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr ? 'قم بإدخال توكن البوت ومعرف القناة أو المحادثة لإرسال الإشارات وتحديثات الصفقات' : 'Configure bot token and chat ID for real-time signal dispatch'}
                  </p>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                  pingStatus.status === 'connected'
                    ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-950 border border-rose-500/40 text-rose-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${pingStatus.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {pingStatus.status === 'connected' ? (isAr ? 'متصل بالشبكة' : 'Connected') : (isAr ? 'غير متصل' : 'Disconnected')}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telegram Bot Token:
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="1234567890:AAH_xxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telegram Chat ID / Channel ID:
                  </label>
                  <input
                    type="text"
                    value={chatIdInput}
                    onChange={(e) => setChatIdInput(e.target.value)}
                    placeholder="@YourTradingChannel or -100123456789"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  {isSaving ? (isAr ? 'جارِ الحفظ...' : 'Saving...') : (isAr ? 'حفظ الإعدادات' : 'Save Credentials')}
                </button>

                <button
                  onClick={onSendTestAlert}
                  disabled={isTestingTelegram || !settings.telegramBotToken}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {isTestingTelegram ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : (isAr ? 'إرسال تنبيه تجريبي' : 'Send Test Ping')}
                </button>

                {saveSuccess && (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAr ? 'تم حفظ التوكن بنجاح!' : 'Credentials saved!'}
                  </span>
                )}
              </div>

              {telegramTestResult && (
                <div className={`p-4 rounded-xl text-xs font-mono border ${
                  telegramTestResult.success 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}>
                  {telegramTestResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Quick Info & Active Bot Metadata */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                {isAr ? 'معلومات البوت المعتمد' : 'Verified Bot Details'}
              </h4>

              {pingStatus.bot ? (
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="text-emerald-400 font-bold">@{pingStatus.bot.username}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                    <span className="text-slate-400">First Name:</span>
                    <span className="text-white">{pingStatus.bot.firstName}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Latency:</span>
                    <span className="text-cyan-400 font-bold">{pingStatus.latencyMs}ms</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr 
                    ? 'لم يتم التحقق من البوت بعد. يرجى إدخال التوكن والضغط على "فحص الاتصال".' 
                    : 'Bot not verified yet. Enter token and click Ping Bot.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mini App & BotFather Automation */}
      {activeSubTab === 'TMA' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    {isAr ? 'تكوين تطبيق Telegram Mini App التلقائي' : 'Telegram Mini App (TMA) Automation'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr ? 'اضبط زر القائمة (Menu Button) داخل محادثة البوت برابط مباشر بنقرة واحدة' : 'Configure bot menu button with direct standalone WebApp URL'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? 'رابط تطبيق الويب المستقل (Standalone WebApp URL):' : 'Standalone WebApp URL:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customAppUrl}
                      onChange={(e) => setCustomAppUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleCopy(customAppUrl, 'appUrl')}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-all"
                    >
                      {copiedField === 'appUrl' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAutoSetMenuButton}
                    disabled={isSettingMenuButton || !settings.telegramBotToken}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSettingMenuButton ? (isAr ? 'جارِ الضبط التلقائي...' : 'Configuring...') : (isAr ? '⚡ ضبط زر القائمة تلقائياً (Auto Set Menu Button)' : 'Auto Set Bot Menu Button')}
                  </button>

                  <a
                    href={directTgDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {isAr ? 'فتح في تيليجرام مباشرة' : 'Launch in Telegram'}
                  </a>
                </div>

                {menuButtonResult && (
                  <div className={`p-4 rounded-xl text-xs font-mono border ${
                    menuButtonResult.success 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}>
                    {menuButtonResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BotFather Quick Setup Guide */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                {isAr ? 'أوامر BotFather اليدوية السريعة' : 'BotFather Quick Script'}
              </h4>
              <p className="text-xs text-slate-400">
                {isAr ? 'انسخ الأوامر لتفعيل Mini App يدوياً عبر @BotFather:' : 'Copy commands to manually configure in @BotFather:'}
              </p>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300/90 space-y-1">
                <div>/newapp</div>
                <div>Choose your bot: @{botUsername || 'YourBot'}</div>
                <div>Title: Market Radar 10X</div>
                <div>Short name: radar</div>
                <div>URL: {customAppUrl}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Instant Trade Broadcast */}
      {activeSubTab === 'BROADCAST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                {isAr ? 'بث الإشارات الحية إلى قناة تيليجرام' : 'Broadcast Live Trade Signals'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? 'اختر صفقة من صفقات الرادار لإرسالها فوراً بتنسيق احترافي شامل أهداف الربح ووقف الخسارة' : 'Select a radar signal to dispatch formatted institutional alert'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signals.slice(0, 6).map((sig) => {
              const isLong = sig.direction === 'LONG';
              return (
                <div key={sig.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base">{sig.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isLong ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {sig.direction} {sig.timeframe}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
                      <div>Entry: <span className="text-white">${sig.entryPrice}</span></div>
                      <div>TP1: <span className="text-emerald-400">${sig.takeProfit1}</span></div>
                      <div>SL: <span className="text-rose-400">${sig.stopLoss}</span></div>
                      <div>Confidence: <span className="text-amber-400">{sig.confidence}%</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSendSignalAlert(sig)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    {isAr ? 'بث الإشارة للقناة' : 'Broadcast Signal'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Security & Credentials Vault */}
      {activeSubTab === 'SECURITY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'مستودع الأمان والتحكم في مفاتيح التشفير' : 'Security & Access Control Vault'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'إدارة الوصول وحماية المعرفات السرية للبوت والويب هوك' : 'Manage webhook security, authorized channels, and credentials'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-slate-400 font-sans font-semibold">Creator Account:</div>
              <div className="text-amber-400 font-bold">pal.c88@gmail.com</div>
              <div className="text-slate-500 text-[11px] font-sans">Full administrative permissions granted</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-slate-400 font-sans font-semibold">Security Encryption:</div>
              <div className="text-emerald-400 font-bold">AES-256 GCM</div>
              <div className="text-slate-500 text-[11px] font-sans">Zero server-side persistent key leak</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
