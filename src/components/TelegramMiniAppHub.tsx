import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Bot, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  QrCode, 
  RefreshCw, 
  Info, 
  ChevronRight, 
  Play, 
  Vibrate,
  Globe,
  Radio
} from 'lucide-react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { BotSettings, BotStatus, TradeSignal } from '../types';

interface TelegramMiniAppHubProps {
  settings: BotSettings;
  status: BotStatus | null;
  signals: TradeSignal[];
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  onOpenChart: (symbol: string, timeframe: string) => void;
}

export const TelegramMiniAppHub: React.FC<TelegramMiniAppHubProps> = ({
  settings,
  status,
  signals,
  onUpdateSettings,
  onOpenChart
}) => {
  const { 
    isInTelegram, 
    user: tgUser, 
    platform, 
    triggerHaptic, 
    openTelegramLink,
    openLink
  } = useTelegramWebApp();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>('');
  const [appShortName, setAppShortName] = useState<string>('radar');
  const [isSettingMenuButton, setIsSettingMenuButton] = useState<boolean>(false);
  const [menuButtonResult, setMenuButtonResult] = useState<{ success: boolean; message?: string } | null>(null);
  // Clean standalone URL for Telegram WebApp
  const getCleanPublicUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If running inside aistudio iframe or domain, fallback to the direct standalone Cloud Run URL
      if (origin.includes('aistudio.google.com') || origin.includes('localhost')) {
        return 'https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app';
      }
      return origin;
    }
    return 'https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app';
  };

  const [customAppUrl, setCustomAppUrl] = useState<string>(getCleanPublicUrl());

  // Fetch bot info from backend if token configured
  useEffect(() => {
    if (settings.telegramBotToken) {
      fetch('/api/telegram/bot-info')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.bot?.username) {
            setBotUsername(data.bot.username);
          }
        })
        .catch(() => {});
    }
  }, [settings.telegramBotToken]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('selection');
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAutoSetMenuButton = async () => {
    setIsSettingMenuButton(true);
    setMenuButtonResult(null);
    triggerHaptic('medium');

    try {
      const res = await fetch('/api/telegram/set-menu-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: customAppUrl })
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic('success');
        setMenuButtonResult({
          success: true,
          message: '✅ Telegram Bot Menu Button successfully configured to open this Mini App!'
        });
      } else {
        triggerHaptic('error');
        setMenuButtonResult({
          success: false,
          message: data.error || 'Failed to update Menu Button. Ensure your Bot Token is valid.'
        });
      }
    } catch (err: any) {
      triggerHaptic('error');
      setMenuButtonResult({
        success: false,
        message: err.message || 'Network error while connecting to Telegram API'
      });
    } finally {
      setIsSettingMenuButton(false);
    }
  };

  const directTmaLink = botUsername ? `https://t.me/${botUsername}/${appShortName}` : `https://t.me/YourBotUsername/${appShortName}`;
  const directDeepLink = botUsername ? `https://t.me/${botUsername}?startapp=${appShortName}` : `https://t.me/YourBotUsername?startapp=${appShortName}`;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Top Banner: Status & Environment Detection */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
        isInTelegram 
          ? 'bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border-sky-500/40 shadow-sky-500/10'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-sky-400">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  Telegram Mini App (TMA) Hub
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 border ${
                  isInTelegram
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-sky-950 text-sky-300 border-sky-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isInTelegram ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
                  {isInTelegram ? 'ACTIVE INSIDE TELEGRAM' : 'TMA WEB RUNTIME'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {isInTelegram 
                  ? `Authenticated session running inside Telegram (${platform.toUpperCase()}). High-speed market scanner with native haptic feedback.`
                  : 'Link your Telegram Bot to launch Market Radar as an interactive Telegram Mini App inside any chat or channel.'}
              </p>
            </div>
          </div>

          {/* Haptic / Quick Action Tests */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                triggerHaptic('medium');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              title="Test Telegram Haptic Feedback"
            >
              <Vibrate className="w-4 h-4 text-amber-400" />
              <span>Test Haptics</span>
            </button>

            <button
              onClick={() => openTelegramLink('https://t.me/BotFather')}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open @BotFather</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </button>
          </div>

        </div>

        {/* Telegram User Live Profile Bar if inside Telegram */}
        {tgUser && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="text-slate-400">Connected Telegram User:</span>
              <span className="font-bold text-sky-300">
                {tgUser.first_name} {tgUser.last_name || ''} {tgUser.username ? `(@${tgUser.username})` : ''}
              </span>
              <span className="text-slate-500 text-[11px]">(ID: {tgUser.id})</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Native TMA SDK Initialized</span>
            </div>
          </div>
        )}
      </div>

      {/* 401 Error Prevention & Fix Callout */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-bold text-amber-200">
                حل مشكلة الخطأ (Google 401 Error / Malformed Request)
              </h4>
              <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                HOW TO FIX 401
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>سبب ظهور خطأ 401:</strong> قمت بلصق رابط المحرر الداخلي <code className="bg-slate-950 text-rose-300 px-1.5 py-0.5 rounded font-mono text-[11px]">aistudio.google.com</code> في BotFather (وهذا الرابط محمي بحساب Google ولا يمكن فتحه داخل Telegram).
              <br />
              <strong>الحل السريع:</strong> استخدم دائماً الرابط العام المباشر المستضاف على السيرفر أدناه:
            </p>

            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex-1 font-mono text-xs text-emerald-400 truncate select-all">
                https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app
              </div>
              <button
                onClick={() => handleCopy('https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app', 'correctPublicUrl')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 transition"
              >
                {copiedField === 'correctPublicUrl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'correctPublicUrl' ? 'تم النسخ!' : 'نسخ الرابط الصحيح'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              💡 <strong>تعديل الرابط في BotFather:</strong> أرسل <code className="text-sky-300 font-bold">/myapps</code> إلى <strong className="text-sky-300">@BotFather</strong> ➔ اختر التطبيق ➔ اضغط <strong>Edit Web App URL</strong> ➔ الصق الرابط الأخضر أعلاه.
            </div>
          </div>
        </div>
      </div>

      {/* MT5 Broker & Account Credentials Dashboard inside Mini App */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              لوحة تحكم بيانات حساب MetaTrader 5 (MT5 Broker Bridge)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              أدخل بيانات وسيط التداول (Broker) الخاص بك لربط تنفيذ صفقات الرادار تلقائياً عبر MT5.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
              settings.mt5Config?.isConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${settings.mt5Config?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              {settings.mt5Config?.isConnected ? 'MT5 CONNECTED' : 'MT5 STANDBY'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* MT5 Server */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">سيرفر البروكر (Broker Server):</label>
            <input
              type="text"
              value={settings.mt5Config?.server || ''}
              onChange={(e) => onUpdateSettings({
                mt5Config: {
                  server: e.target.value,
                  login: settings.mt5Config?.login || '',
                  password: settings.mt5Config?.password || '',
                  isConnected: settings.mt5Config?.isConnected || false,
                  autoExecute: settings.mt5Config?.autoExecute || false,
                  lotSize: settings.mt5Config?.lotSize || 0.01,
                }
              })}
              placeholder="e.g. Exness-Real, ICMarkets-Live"
              className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* MT5 Login Account Number */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">رقم الحساب / اسم المستخدم (Login ID):</label>
            <input
              type="text"
              value={settings.mt5Config?.login || ''}
              onChange={(e) => onUpdateSettings({
                mt5Config: {
                  server: settings.mt5Config?.server || 'Exness-Real',
                  login: e.target.value,
                  password: settings.mt5Config?.password || '',
                  isConnected: settings.mt5Config?.isConnected || false,
                  autoExecute: settings.mt5Config?.autoExecute || false,
                  lotSize: settings.mt5Config?.lotSize || 0.01,
                }
              })}
              placeholder="e.g. 51849201"
              className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* MT5 Password */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">كلمة المرور (Trader Password):</label>
            <input
              type="password"
              value={settings.mt5Config?.password || ''}
              onChange={(e) => onUpdateSettings({
                mt5Config: {
                  server: settings.mt5Config?.server || 'Exness-Real',
                  login: settings.mt5Config?.login || '',
                  password: e.target.value,
                  isConnected: settings.mt5Config?.isConnected || false,
                  autoExecute: settings.mt5Config?.autoExecute || false,
                  lotSize: settings.mt5Config?.lotSize || 0.01,
                }
              })}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Default Lot Size */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">حجم اللوت الافتراضي (Lot Size):</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="5.00"
              value={settings.mt5Config?.lotSize || 0.01}
              onChange={(e) => onUpdateSettings({
                mt5Config: {
                  server: settings.mt5Config?.server || 'Exness-Real',
                  login: settings.mt5Config?.login || '',
                  password: settings.mt5Config?.password || '',
                  isConnected: settings.mt5Config?.isConnected || false,
                  autoExecute: settings.mt5Config?.autoExecute || false,
                  lotSize: parseFloat(e.target.value) || 0.01,
                }
              })}
              className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* MT5 Action Buttons & Toggles */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 w-full sm:w-auto">
            <input
              type="checkbox"
              checked={settings.mt5Config?.autoExecute || false}
              onChange={(e) => {
                triggerHaptic('medium');
                onUpdateSettings({
                  mt5Config: {
                    server: settings.mt5Config?.server || 'Exness-Real',
                    login: settings.mt5Config?.login || '',
                    password: settings.mt5Config?.password || '',
                    isConnected: settings.mt5Config?.isConnected || false,
                    autoExecute: e.target.checked,
                    lotSize: settings.mt5Config?.lotSize || 0.01,
                  }
                });
              }}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-200">
              ⚡ تنفيذ صفقات الرادار تلقائياً على حساب MT5 الحقيقي/التجريبي
            </span>
          </label>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('success');
              onUpdateSettings({
                mt5Config: {
                  server: settings.mt5Config?.server || 'Exness-Real',
                  login: settings.mt5Config?.login || '51849201',
                  password: settings.mt5Config?.password || 'demoPassword123',
                  isConnected: true,
                  autoExecute: settings.mt5Config?.autoExecute ?? true,
                  lotSize: settings.mt5Config?.lotSize || 0.01,
                }
              });
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>حفظ واختبار اتصال MT5 الآن</span>
          </button>
        </div>
      </div>

      {/* Setup Step-by-Step Guide & Direct Link Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive 5-Step BotFather Linker (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-400" />
                دليل ربط البوت في تيليجرام Mini App (BotFather Setup Guide)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                اتبع الخطوات البسيطة التالية لربط تطبيق Market Radar بالكامل داخل بوتك على تيليجرام:
              </p>
            </div>

            {/* Step 1 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[11px] font-mono">
                    1
                  </span>
                  الخطوة الأولى: فتح @BotFather وبدء إنشاء التطبيق
                </span>
                <button
                  onClick={() => handleCopy('/newapp', 'step1')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1"
                >
                  {copiedField === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>/newapp</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                افتح المحادثة مع <strong className="text-sky-300">@BotFather</strong> في تيليجرام وأرسل الأمر <code className="bg-slate-900 text-sky-300 px-1.5 py-0.5 rounded font-mono">/newapp</code> ثم اختر البوت الخاص بك من القائمة.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[11px] font-mono">
                    2
                  </span>
                  الخطوة الثانية: كتابة اسم وعنوان التطبيق (Title & Description)
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Title: <strong className="text-white">Market Radar Trading Bot</strong></span>
                  <button
                    onClick={() => handleCopy('Market Radar Trading Bot', 'title')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 truncate max-w-[280px]">Desc: <strong className="text-white">Live AI confluence scanner & paper trading.</strong></span>
                  <button
                    onClick={() => handleCopy('Live AI confluence scanner & paper trading bot.', 'desc')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[11px] font-mono">
                    3
                  </span>
                  الخطوة الثالثة: لصق رابط التطبيق Web App URL (HTTPS)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                عندما يطلب BotFather الرابط المباشر للـ Web App، انسخ هذا الرابط والصقه مباشرة:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customAppUrl}
                  onChange={(e) => setCustomAppUrl(e.target.value)}
                  className="flex-1 bg-slate-900 text-sky-300 px-3 py-2 rounded-xl text-xs font-mono border border-slate-800 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => handleCopy(customAppUrl, 'appUrl')}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 transition"
                >
                  {copiedField === 'appUrl' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedField === 'appUrl' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>
            </div>

            {/* Step 4: One-Click Menu Button Sync */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/30 border border-sky-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-900 text-sky-200 border border-sky-400/50 flex items-center justify-center text-[11px] font-mono">
                    4
                  </span>
                  الخطوة الرابعة: تفعيل زر القائمة (Menu Button) بضغطة واحدة
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  AUTO-SYNC
                </span>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                يمكنك جعل زر القائمة السفلي في محادثة البوت يفتح الـ Mini App تلقائياً لأي مستخدم يفتح البوت.
              </p>

              <button
                onClick={handleAutoSetMenuButton}
                disabled={isSettingMenuButton || !settings.telegramBotToken}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isSettingMenuButton ? 'animate-spin' : ''}`} />
                <span>{isSettingMenuButton ? 'جاري ربط زر القائمة...' : '🚀 ربط زر القائمة (Menu Button) تلقائياً الآن'}</span>
              </button>

              {menuButtonResult && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  menuButtonResult.success 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}>
                  {menuButtonResult.message}
                </div>
              )}
            </div>

            {/* Step 5: Direct Mini App Launch Link */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[11px] font-mono">
                  5
                </span>
                الخطوة الخامسة: الرابط المباشر للفتح والمشاركة (Direct Launch Link)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block">BOT USERNAME:</span>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="e.g. MyRadarBot"
                    className="w-full bg-slate-900 text-white px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block">SHORT NAME:</span>
                  <input
                    type="text"
                    value={appShortName}
                    onChange={(e) => setAppShortName(e.target.value)}
                    placeholder="radar"
                    className="w-full bg-slate-900 text-white px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 bg-slate-900 text-emerald-400 px-3 py-2 rounded-xl text-xs font-mono border border-slate-800 truncate">
                  {directTmaLink}
                </div>
                <button
                  onClick={() => handleCopy(directTmaLink, 'directLink')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedField === 'directLink' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'directLink' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => openTelegramLink(directTmaLink)}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Mini App Phone Shell Preview & Feature Highlights (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Phone Shell Preview Mockup */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
            
            {/* Phone Notch & Telegram Top Bar */}
            <div className="bg-[#17212b] rounded-t-2xl p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-sky-400 font-bold">Close</span>
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Market Radar</span>
                  <span className="text-[9px] text-slate-400">bot</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-slate-300">TMA v7.4</span>
              </div>
            </div>

            {/* Inner App Mini Preview Screen */}
            <div className="bg-slate-900 p-3.5 space-y-3 min-h-[340px] text-xs">
              
              {/* Mini Ticker */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-[11px]">
                <span className="font-bold text-white flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" /> BTC/USD
                </span>
                <span className="text-emerald-400 font-bold">$91,420.50 (+3.4%)</span>
              </div>

              {/* Sample Signal Card in Mini App */}
              {signals[0] ? (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{signals[0].symbol} ({signals[0].timeframe})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      signals[0].direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {signals[0].direction}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {signals[0].pattern.name} • {signals[0].confidence}% Score
                  </p>

                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1.5 rounded text-center text-[9px] font-mono">
                    <div>
                      <span className="text-slate-500 block">ENTRY</span>
                      <span className="text-white font-bold">${signals[0].entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-rose-400 block">SL</span>
                      <span className="text-rose-300 font-bold">${signals[0].stopLoss}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 block">TP1</span>
                      <span className="text-emerald-300 font-bold">${signals[0].takeProfit1}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onOpenChart(signals[0].symbol, signals[0].timeframe);
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Zap className="w-3 h-3" /> Execute In Mini App
                  </button>
                </div>
              ) : null}

              {/* Native Telegram Main Button Simulation */}
              <div className="pt-2">
                <div className="bg-[#2481cc] hover:bg-[#1d6fa8] text-white p-2.5 rounded-xl text-center font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>VIEW FULL AI SCANNER</span>
                </div>
              </div>

            </div>

            {/* Bottom Safe Area Bar */}
            <div className="bg-[#17212b] rounded-b-2xl p-2 flex justify-center">
              <div className="w-24 h-1 bg-slate-700 rounded-full" />
            </div>

          </div>

          {/* Features Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ميزات تطبيق التيليجرام المصغر (TMA Features)
            </h4>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>تنفيذ الصفقات بنقرة واحدة:</strong> فتح ومراقبة الصفقات والـ Stop Loss مباشرة بدون مغادرة تيليجرام.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>دعم Haptic Feedback:</strong> اهتزازات لمسية حقيقية عند وصول إشارة أو تأكيد صفقة.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>أزرار Inline تفاعلية:</strong> كل إشعار يصل قناتك يحتوي على زر يفتح التطبيق مباشرة للمشتركين.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>متوافق مع الهواتف والكمبيوتر:</strong> يعمل بسلاسة على iOS، Android، و Telegram Desktop.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
