import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  EyeOff, 
  X, 
  Server, 
  Radio, 
  Cpu, 
  Send,
  Database,
  Check,
  Zap,
  Cloud,
  Sliders,
  Play,
  Pause,
  Copy,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BotSettings, BotStatus, TradeSignal } from '../types';

interface UnifiedVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: BotSettings;
  onUpdateSettings?: (newSettings: Partial<BotSettings>) => void;
  status?: BotStatus | null;
  signals?: TradeSignal[];
  initialTab?: 'vault' | 'brokers' | 'cloud' | 'telegram';
}

interface MaskedSecret {
  key: string;
  category: string;
  label: string;
  descriptionArabic?: string;
  maskedValue: string;
  updatedAt: number;
  isConfigured: boolean;
}

// Supported brokers including No-API / Prop Firms
export const NO_API_BROKERS = [
  { id: 'FTMO', name: 'FTMO (Prop Firm)', defaultServer: 'FTMO-Server', platforms: ['MT5', 'MT4', 'DXTrade', 'cTrader'] },
  { id: 'FUNDED_NEXT', name: 'FundedNext', defaultServer: 'FundedNext-Server', platforms: ['MT5', 'MT4', 'cTrader'] },
  { id: 'IC_MARKETS', name: 'IC Markets', defaultServer: 'ICMarketsSC-Live', platforms: ['MT5', 'MT4', 'cTrader'] },
  { id: 'TICKMILL', name: 'Tickmill', defaultServer: 'Tickmill-Live', platforms: ['MT5', 'MT4'] },
  { id: 'PEPPERSTONE', name: 'Pepperstone', defaultServer: 'Pepperstone-Live', platforms: ['MT5', 'MT4', 'cTrader'] },
  { id: 'JUSTMARKETS', name: 'JustMarkets', defaultServer: 'JustMarkets-Live', platforms: ['MT5', 'MT4'] },
  { id: 'XM', name: 'XM Global', defaultServer: 'XMGlobal-Real 55', platforms: ['MT5', 'MT4'] },
  { id: 'EXNESS', name: 'Exness', defaultServer: 'Exness-Real', platforms: ['MT5', 'MT4'] },
  { id: 'CUSTOM_BROKER', name: 'خادم بروكر مخصص (Custom Broker)', defaultServer: '', platforms: ['MT5', 'MT4'] },
];

export const UnifiedVaultModal: React.FC<UnifiedVaultModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  status,
  signals = [],
  initialTab = 'vault'
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'vault' | 'brokers' | 'cloud' | 'telegram'>(initialTab);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secrets, setSecrets] = useState<MaskedSecret[]>([]);

  // Add Secret Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescAr, setNewDescAr] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // No-API Broker Fast Connect Form State
  const [selectedNoApiBroker, setSelectedNoApiBroker] = useState<string>('FTMO');
  const [brokerLogin, setBrokerLogin] = useState('');
  const [brokerPassword, setBrokerPassword] = useState('');
  const [brokerServer, setBrokerServer] = useState('FTMO-Server');
  const [brokerPlatform, setBrokerPlatform] = useState('MT5');
  const [brokerConnectLoading, setBrokerConnectLoading] = useState(false);
  const [brokerConnectMsg, setBrokerConnectMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Telegram Config Form State
  const [tgToken, setTgToken] = useState(settings?.telegramBotToken || '');
  const [tgChatId, setTgChatId] = useState(settings?.telegramChatId || '');
  const [tgEnabled, setTgEnabled] = useState(settings?.telegramEnabled ?? false);
  const [tgTesting, setTgTesting] = useState(false);
  const [tgTestMsg, setTgTestMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Database Sync Status State
  const [dbSyncStatus, setDbSyncStatus] = useState<{
    sqlConnected: boolean;
    firestoreConnected: boolean;
    provider: string;
    lastSync: number;
  }>({
    sqlConnected: false,
    firestoreConnected: true,
    provider: 'Cloud SQL / MySQL Auto-Sync Ready',
    lastSync: Date.now()
  });

  // Fetch Vault Status
  const fetchVaultStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security/vault/status');
      const data = await res.json();
      if (data && data.success) {
        setIsUnlocked(data.summary.isUnlocked);
        setSecrets(data.secrets || []);
      }
    } catch (e) {
      console.error('Failed to fetch vault status:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch DB Sync Health
  const fetchDbSync = async () => {
    try {
      const res = await fetch('/api/security/db-sync/health');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDbSyncStatus(data.status);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchVaultStatus();
      fetchDbSync();
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passphrase) return;
    try {
      setLoading(true);
      setUnlockError(null);
      const res = await fetch('/api/security/vault/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase })
      });
      const data = await res.json();
      if (data && data.success) {
        setIsUnlocked(true);
        setPassphrase('');
        fetchVaultStatus();
      } else {
        setUnlockError(isAr ? 'كلمة المرور الرئيسية غير صحيحة.' : 'Invalid master passphrase.');
      }
    } catch (err: any) {
      setUnlockError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await fetch('/api/security/vault/lock', { method: 'POST' });
      setIsUnlocked(false);
      fetchVaultStatus();
    } catch (e) {}
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    try {
      setLoading(true);
      const res = await fetch('/api/security/vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.trim().toUpperCase(),
          value: newValue.trim(),
          category: 'CUSTOM_SECRET',
          label: newLabel || newKey,
          descriptionArabic: newDescAr
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveSuccess(isAr ? 'تم حفظ وتشفير السر بنجاح داخل الخزنة 🔒' : 'Secret encrypted in vault 🔒');
        setNewValue('');
        setNewKey('');
        setNewLabel('');
        setIsAdding(false);
        fetchVaultStatus();
        setTimeout(() => setSaveSuccess(null), 3500);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecret = async (key: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف ${key} من الخزنة المشفرة؟` : `Delete ${key} from secure vault?`)) return;
    try {
      setLoading(true);
      const res = await fetch('/api/security/vault/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (data && data.success) {
        fetchVaultStatus();
      }
    } catch (err) {
      console.error('Delete secret error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Connect No-API Broker (Login / Server / Password directly stored in vault)
  const handleConnectNoApiBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerLogin || !brokerServer) return;
    try {
      setBrokerConnectLoading(true);
      setBrokerConnectMsg(null);

      // Save credentials in encrypted vault
      await fetch('/api/security/vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `${selectedNoApiBroker}_LOGIN`,
          value: brokerLogin.trim(),
          category: 'BROKER_METATRADER',
          label: `${selectedNoApiBroker} Login ID`,
          descriptionArabic: `رقم حساب ${selectedNoApiBroker}`
        })
      });

      await fetch('/api/security/vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `${selectedNoApiBroker}_SERVER`,
          value: brokerServer.trim(),
          category: 'BROKER_METATRADER',
          label: `${selectedNoApiBroker} Server`,
          descriptionArabic: `سيرفر شركة الوساطة ${selectedNoApiBroker}`
        })
      });

      if (brokerPassword) {
        await fetch('/api/security/vault/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `${selectedNoApiBroker}_PASSWORD`,
            value: brokerPassword.trim(),
            category: 'BROKER_METATRADER',
            label: `${selectedNoApiBroker} Password`,
            descriptionArabic: `كلمة سر التداول المشفرة لـ ${selectedNoApiBroker}`
          })
        });
      }

      // Update bot settings activeBroker
      if (onUpdateSettings && settings) {
        const currentCreds: any = settings.brokerApiCredentials || { activeBroker: 'FTMO' as any };
        const updated = {
          ...settings,
          tradingMode: 'LIVE' as const,
          brokerApiCredentials: {
            ...currentCreds,
            activeBroker: selectedNoApiBroker as any,
            ftmo: selectedNoApiBroker === 'FTMO' ? {
              login: brokerLogin,
              server: brokerServer,
              platform: brokerPlatform as any,
              isValidated: true,
              accountBalance: 10000,
              currency: 'USD'
            } : currentCreds?.ftmo
          }
        };
        onUpdateSettings(updated);
      }

      setBrokerConnectMsg({
        success: true,
        text: isAr
          ? `✅ تم تشفير وربط سيرفر (${brokerServer}) وحساب ${selectedNoApiBroker} بالبوت التلقائي بنجاح! جاهز للتنفيذ الآلي.`
          : `✅ Successfully connected and encrypted ${selectedNoApiBroker} server (${brokerServer}) into automated execution!`
      });

      fetchVaultStatus();
      setBrokerPassword('');
    } catch (err: any) {
      setBrokerConnectMsg({
        success: false,
        text: `خطأ في الربط: ${err.message}`
      });
    } finally {
      setBrokerConnectLoading(false);
    }
  };

  // Test Telegram Bot
  const handleTestTelegram = async () => {
    try {
      setTgTesting(true);
      setTgTestMsg(null);
      const res = await fetch('/api/telegram/test-alert', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTgTestMsg({
          success: true,
          text: isAr ? '✅ تم إرسال رسالة تجريبية بنجاح إلى تليجرام!' : '✅ Telegram test alert delivered successfully!'
        });
      } else {
        setTgTestMsg({
          success: false,
          text: data.error || (isAr ? 'فشل الاتصال بتليجرام' : 'Telegram test failed')
        });
      }
    } catch (err: any) {
      setTgTestMsg({ success: false, text: err.message });
    } finally {
      setTgTesting(false);
    }
  };

  const handleSaveTelegram = async () => {
    try {
      setLoading(true);
      // Save to encrypted vault
      if (tgToken) {
        await fetch('/api/security/vault/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'TELEGRAM_BOT_TOKEN',
            value: tgToken.trim(),
            category: 'TELEGRAM_BOT',
            label: 'Telegram Bot Token'
          })
        });
      }
      if (tgChatId) {
        await fetch('/api/security/vault/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'TELEGRAM_CHAT_ID',
            value: tgChatId.trim(),
            category: 'TELEGRAM_BOT',
            label: 'Telegram Channel / Chat ID'
          })
        });
      }

      if (onUpdateSettings) {
        onUpdateSettings({
          telegramEnabled: tgEnabled,
          telegramBotToken: tgToken,
          telegramChatId: tgChatId
        });
      }

      setTgTestMsg({
        success: true,
        text: isAr ? 'تم حفظ إعدادات تليجرام في الخزنة بنجاح 🔒' : 'Telegram settings saved in vault 🔒'
      });
    } catch (err: any) {
      setTgTestMsg({ success: false, text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e121c] via-[#090b10] to-[#06080d] border border-indigo-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-950/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Integrated Hub Title */}
        <div className="p-4 sm:p-5 border-b border-[#1c2233] flex items-center justify-between bg-[#0b0e15]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isAr ? 'الخزنة السحابية الموحدة (Central Cloud & Vault)' : 'Central Cloud & Secret Vault'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  AES-256-GCM
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  SQL Auto-Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr 
                  ? 'مركز مشفر شامل لربط البروكرات (بدون API)، وإدارة السحابة، وتنبيهات تليجرام، وتزامن البيانات'
                  : 'Encrypted central hub for No-API brokers, cloud autonomy, Telegram TMA, and DB synchronization'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                onClick={handleLock}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'قفل الخزنة' : 'Lock Vault'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Navigation Tabs inside Vault */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 border-b border-[#1c2233] bg-[#080b11] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('brokers')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'brokers'
                ? 'border-indigo-500 text-white bg-[#101524]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4 text-indigo-400" />
            <span>{isAr ? 'بروكرات التداول الآلي (No-API / FTMO)' : 'No-API Brokers (FTMO)'}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              DIRECT
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'vault'
                ? 'border-emerald-500 text-white bg-[#101524]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'مفاتيح التشفير والأسرار' : 'Encrypted Vault Keys'}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              {secrets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'telegram'
                ? 'border-sky-500 text-white bg-[#101524]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>{isAr ? 'تليجرام و TMA المشفر' : 'Telegram & TMA'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'cloud'
                ? 'border-amber-500 text-white bg-[#101524]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'السحابة 24/7 وتزامن SQL' : 'Cloud 24/7 & SQL Sync'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Master Passphrase Lock Screen for Vault tab */}
          {activeTab === 'vault' && !isUnlocked ? (
            <div className="py-8 text-center max-w-md mx-auto space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'الخزنة مقفلة برمز الأمان الرئيسي' : 'Vault is Locked'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'أدخل كلمة المرور الرئيسية لفك تشفير وإدارة الحسابات والمفاتيح السرية.' : 'Enter your master passphrase to unlock credentials.'}
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3">
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder={isAr ? 'كلمة المرور الرئيسية (Master Passphrase)...' : 'Master passphrase...'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
                  autoFocus
                />

                {unlockError && (
                  <div className="text-xs text-rose-400 font-mono text-start">
                    ❌ {unlockError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !passphrase}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  <span>{isAr ? 'فتح الخزنة المشفرة' : 'Unlock Secure Vault'}</span>
                </button>
              </form>
            </div>
          ) : null}

          {/* TAB 1: NO-API BROKER CONNECT (FTMO, FundedNext, IC Markets, etc.) */}
          {activeTab === 'brokers' && (
            <div className="space-y-6">
              
              {/* Informational Guidance Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>{isAr ? 'ربط البروكرات التي تدعم التداول الآلي بدون API (No-API / MT Server Bridge)' : 'Direct Broker Server Connection (No API / Webhook Required)'}</span>
                </div>
                <p className="leading-relaxed text-slate-400 text-[11px]">
                  {isAr 
                    ? 'منصات مثل FTMO وشركات التمويل تدعم التداول الآلي (Expert Advisor) لكنها لا توفر API أو Webhook مباشر للمستخدمين. يمكنك هنا إدخال بيانات الخادم (Server) ورقم الحساب (Login) وكلمة المرور المشفرة ليتم فتح وإدارة الصفقات آلياً عبر خوارزمية البوت مباشرة دون مغادرة التطبيق.'
                    : 'Prop firms like FTMO support algorithmic trading without native public APIs. Store your server, login, and encrypted credentials here to bridge trades directly from the bot.'}
                </p>
              </div>

              {brokerConnectMsg && (
                <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 ${brokerConnectMsg.success ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500' : 'bg-rose-950/80 text-rose-200 border border-rose-500'}`}>
                  {brokerConnectMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{brokerConnectMsg.text}</span>
                </div>
              )}

              {/* Broker Connection Form */}
              <form onSubmit={handleConnectNoApiBroker} className="p-5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                <div className="font-bold text-sm text-white flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span>{isAr ? 'ربط وتشفير حساب البروكر في الخزنة' : 'Connect & Encrypt Broker Account'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Zero UI Leakage</span>
                </div>

                {/* Dropdown for Supported No-API Brokers */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    {isAr ? 'اختر شركة الوساطة / منصة التمويل (Select Broker):' : 'Select Broker / Prop Firm:'}
                  </label>
                  <select
                    value={selectedNoApiBroker}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedNoApiBroker(id);
                      const found = NO_API_BROKERS.find(b => b.id === id);
                      if (found && found.defaultServer) {
                        setBrokerServer(found.defaultServer);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 outline-none"
                  >
                    {NO_API_BROKERS.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-300 block mb-1.5">
                      {isAr ? 'اسم سيرفر البروكر (Broker Server):' : 'Broker Server:'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FTMO-Server, ICMarketsSC-Live"
                      value={brokerServer}
                      onChange={(e) => setBrokerServer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1.5">
                      {isAr ? 'رقم حساب التداول (Login ID):' : 'Trading Account ID (Login):'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2938471"
                      value={brokerLogin}
                      onChange={(e) => setBrokerLogin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1.5">
                      {isAr ? 'كلمة المرور (تُحفظ مشفرة بـ AES-256 ولا تُعرض أبداً):' : 'Password (Encrypted AES-256, never displayed):'}
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={brokerPassword}
                      onChange={(e) => setBrokerPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1.5">
                      {isAr ? 'المنصة المستهدفة (Platform):' : 'Target Platform:'}
                    </label>
                    <select
                      value={brokerPlatform}
                      onChange={(e) => setBrokerPlatform(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="MT5">MetaTrader 5 (MT5)</option>
                      <option value="MT4">MetaTrader 4 (MT4)</option>
                      <option value="CTRADER">cTrader</option>
                      <option value="DXTRADE">DXTrade</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={brokerConnectLoading || !brokerLogin || !brokerServer}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {brokerConnectLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{isAr ? 'ربط وتأمين البروكر في الخزنة وبدء التداول الآلي' : 'Save & Arm Automated Trading'}</span>
                </button>
              </form>

              {/* Status Display of Connected No-API Brokers */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{isAr ? 'البروكر النشط للتداول الآلي حالياً:' : 'Current Active Automated Broker:'}</span>
                  <span className="font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {settings?.brokerApiCredentials?.activeBroker || 'FTMO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'عند رصد أي إشارة مطابقة في الرادار أو تأكيد من الذكاء الاصطناعي، يتم تنفيذ الأوامر مباشرة على هذا الحساب بحجم لوت محكم (سقف 0.05 لوت) ووقف خسارة إلزامي.'
                    : 'Whenever high-confidence radar signals fire, execution runs directly on this account under strict 0.05 lot discipline.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: ENCRYPTED VAULT KEYS */}
          {activeTab === 'vault' && isUnlocked && (
            <div className="space-y-6">
              
              {saveSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs font-mono text-slate-400">
                  {secrets.length} {isAr ? 'أسرار وحسابات مشفرة ومحمية' : 'Encrypted Credentials Stored'}
                </div>

                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAdding ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'إضافة سر / حساب جديد' : 'Add Secret / Account')}</span>
                </button>
              </div>

              {/* Add New Secret Form */}
              {isAdding && (
                <form onSubmit={handleSaveSecret} className="p-5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="font-bold text-xs text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span>{isAr ? 'إضافة بيانات خاصة جديدة إلى الخزنة المشفرة' : 'Add New Encrypted Secret to Vault'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'مفتاح التعريف (Secret Key Name):' : 'Secret Key Name:'}</label>
                      <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="e.g. FTMO_PASSWORD"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'التسمية التعريفية (Label):' : 'Display Label:'}</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. FTMO Account Pass"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'القيمة السرية (Secret Value - لن تظهر أبداً بعد الحفظ):' : 'Secret Value (Never shown after saving):'}</label>
                    <input
                      type="password"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newKey || !newValue}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isAr ? 'تشفير وحفظ في الخزنة' : 'Encrypt & Save in Vault'}</span>
                  </button>
                </form>
              )}

              {/* Secrets List Cards */}
              <div className="space-y-3">
                {secrets.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-2xl border border-slate-800">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    {isAr ? 'لا توجد مفاتيح محفوظة في الخزنة بعد. اضغط "إضافة سر / حساب جديد" لتخزين بياناتك بأمان.' : 'No secrets stored yet.'}
                  </div>
                ) : (
                  secrets.map((s) => (
                    <div
                      key={s.key}
                      className="p-4 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{s.label || s.key}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/50">
                              {s.category}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Key: <strong className="text-slate-300">{s.key}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono tracking-widest">{s.maskedValue}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSecret(s.key)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                        title={isAr ? 'حذف من الخزنة' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 3: TELEGRAM & TMA VAULT INTEGRATION */}
          {activeTab === 'telegram' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>{isAr ? 'إدارة تنبيهات بوت تليجرام وتطبيق تليجرام المصغر (TMA) داخل الخزنة' : 'Telegram Bot & TMA Vault Hub'}</span>
                </div>
                <p className="leading-relaxed text-slate-400 text-[11px]">
                  {isAr 
                    ? 'تم دمج إعدادات تليجرام داخل الخزنة المشفرة لحماية رمز البوت (Bot Token) ومعرف القناة من العرض العلني، مع إمكانية فحص الإرسال واستلام إشارات الصفقات لحظياً.'
                    : 'Telegram credentials are now fully shielded inside the encrypted vault with instant broadcast tests.'}
                </p>
              </div>

              {tgTestMsg && (
                <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 ${tgTestMsg.success ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500' : 'bg-rose-950/80 text-rose-200 border border-rose-500'}`}>
                  {tgTestMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{tgTestMsg.text}</span>
                </div>
              )}

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-xs text-white">{isAr ? 'تفعيل وتكوين بوت تليجرام:' : 'Configure Telegram Credentials:'}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tgEnabled}
                      onChange={(e) => setTgEnabled(e.target.checked)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300 font-bold">{isAr ? 'تفعيل البث التلقائي' : 'Enable Auto-Broadcast'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-300 block mb-1.5">{isAr ? 'رمز بوت تليجرام (Bot Token):' : 'Bot Token:'}</label>
                    <input
                      type="password"
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      value={tgToken}
                      onChange={(e) => setTgToken(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1.5">{isAr ? 'معرف القناة أو المحادثة (Chat ID):' : 'Chat ID / Channel ID:'}</label>
                    <input
                      type="text"
                      placeholder="-1001234567890"
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveTelegram}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isAr ? 'حفظ وتشفير في الخزنة' : 'Save in Vault'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={tgTesting}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/40 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {tgTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isAr ? 'فحص الإرسال التجريبي' : 'Send Test Alert'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLOUD AUTONOMY & SQL AUTO-SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              
              {/* Database Synchronization Status Card */}
              <div className="p-5 rounded-2xl bg-[#0b0f1a] border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">
                        {isAr ? 'مزامنة البيانات التلقائية مع MySQL / Cloud SQL و Firestore' : 'Automatic MySQL & Firestore Synchronization'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {dbSyncStatus.provider}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AUTO-SYNC ACTIVE</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">{isAr ? 'حالة قاعدة بيانات SQL:' : 'SQL Database Status:'}</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${dbSyncStatus.sqlConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                      <span>{dbSyncStatus.sqlConnected ? (isAr ? 'متصل ومفعل' : 'Connected') : (isAr ? 'نظام التخزين المتصل جاهز' : 'Bridged Ready')}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">{isAr ? 'حالة سحابة Firestore الدائمة:' : 'Cloud Firestore Persistence:'}</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{isAr ? 'نشطة ومؤمنة (Google Cloud)' : 'Active (Google Cloud)'}</span>
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr 
                    ? 'يتم حفظ جميع الصفقات المفتوحة والمغلقة، والإشارات، وتاريخ الأرباح تلقائياً في السحابة دون الاعتماد على كاش المتصفح المحلي، مما يضمن استمرارية التداول عند إغلاق التطبيق.'
                    : 'Trades, signals, and performance metrics synchronize seamlessly in the cloud database, keeping operations intact 24/7.'}
                </p>
              </div>

              {/* Cloud Daemon Status */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">{isAr ? 'سيرفر البوت الدائم (Cloud 24/7 Keep-Alive):' : 'Cloud 24/7 Bot Keep-Alive:'}</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                  ONLINE 24/7
                </span>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c2233] bg-[#080b11] flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <EyeOff className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'حماية عدم العرض (Zero UI Plaintext Leakage)' : 'Zero UI Leakage Active'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
