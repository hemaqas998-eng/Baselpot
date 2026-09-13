import React, { useState, useEffect } from 'react';
import { BotSettings, SavedBrokerAccount } from '../types';
import { 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Lock, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Cpu, 
  DollarSign, 
  Layers, 
  Server, 
  Radio, 
  Activity, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Globe,
  Sliders,
  Copy,
  Check,
  Network,
  Plus,
  Trash2,
  Wallet,
  HelpCircle
} from 'lucide-react';
import { ApiTroubleshootingModal } from './ApiTroubleshootingModal';

interface BrokerConnectionSettingsProps {
  settings: BotSettings;
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  language?: 'ar' | 'en';
}

type BrokerType = 'BINANCE' | 'JUSTMARKETS' | 'XM' | 'BYBIT' | 'DERIV' | 'CUSTOM_REST';

export const BrokerConnectionSettings: React.FC<BrokerConnectionSettingsProps> = ({
  settings,
  onUpdateSettings,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  
  const brokerCreds = settings.brokerApiCredentials || {
    activeBroker: 'BINANCE'
  };

  // 24/7 Persistent Storage Vault Key
  const VAULT_KEY = 'market_radar_persistent_broker_vault_v2';

  // Hydrate from localStorage on initial render if settings is empty
  useEffect(() => {
    try {
      const savedVault = localStorage.getItem(VAULT_KEY);
      if (savedVault) {
        const parsed = JSON.parse(savedVault);
        if (parsed && parsed.brokerApiCredentials) {
          const hasKeys = parsed.brokerApiCredentials.bybit?.apiKey || parsed.brokerApiCredentials.binance?.apiKey || parsed.brokerApiCredentials.justmarkets?.mtLogin || parsed.brokerApiCredentials.xm?.mtLogin;
          const currentHasKeys = settings.brokerApiCredentials?.bybit?.apiKey || settings.brokerApiCredentials?.binance?.apiKey;
          if (hasKeys && !currentHasKeys) {
            onUpdateSettings({
              brokerApiCredentials: parsed.brokerApiCredentials,
              savedBrokerAccounts: parsed.savedBrokerAccounts || []
            });
          }
        }
      }
    } catch (e) {
      // LocalStorage access fallback
    }
  }, []);

  const [selectedBroker, setSelectedBroker] = useState<BrokerType>(
    (brokerCreds.activeBroker as BrokerType) || 'BINANCE'
  );

  // Saved Multi-Account List
  const [savedAccounts, setSavedAccounts] = useState<SavedBrokerAccount[]>(
    settings.savedBrokerAccounts || []
  );

  // Add Account Modal State
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBroker, setNewAccountBroker] = useState<BrokerType>('BYBIT');

  // Troubleshooting modal state
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Binance State
  const [binanceKey, setBinanceKey] = useState(brokerCreds.binance?.apiKey || '');
  const [binanceSecret, setBinanceSecret] = useState(brokerCreds.binance?.apiSecret || '');
  const [binanceAccountType, setBinanceAccountType] = useState<'FUTURES_USDT' | 'SPOT'>(
    brokerCreds.binance?.accountType || 'FUTURES_USDT'
  );
  const [binanceTestnet, setBinanceTestnet] = useState(brokerCreds.binance?.testnet || false);

  // JustMarkets State
  const [jmLogin, setJmLogin] = useState(brokerCreds.justmarkets?.mtLogin || '');
  const [jmServer, setJmServer] = useState(brokerCreds.justmarkets?.server || 'JustMarkets-Live');
  const [jmToken, setJmToken] = useState(brokerCreds.justmarkets?.apiToken || '');
  const [jmRestEndpoint, setJmRestEndpoint] = useState(brokerCreds.justmarkets?.restEndpoint || '');

  // XM State
  const [xmLogin, setXmLogin] = useState(brokerCreds.xm?.mtLogin || '');
  const [xmServer, setXmServer] = useState(brokerCreds.xm?.server || 'XMGlobal-Real 55');
  const [xmToken, setXmToken] = useState(brokerCreds.xm?.apiToken || '');
  const [xmRestEndpoint, setXmRestEndpoint] = useState(brokerCreds.xm?.restEndpoint || '');

  // Bybit State
  const [bybitKey, setBybitKey] = useState(brokerCreds.bybit?.apiKey || '');
  const [bybitSecret, setBybitSecret] = useState(brokerCreds.bybit?.apiSecret || '');
  const [bybitTestnet, setBybitTestnet] = useState(brokerCreds.bybit?.testnet || false);

  // Custom REST State
  const [customBrokerName, setCustomBrokerName] = useState(brokerCreds.customRest?.brokerName || 'My Broker');
  const [customBaseUrl, setCustomBaseUrl] = useState(brokerCreds.customRest?.baseUrl || '');
  const [customApiKey, setCustomApiKey] = useState(brokerCreds.customRest?.apiKey || '');
  const [customApiSecret, setCustomApiSecret] = useState(brokerCreds.customRest?.apiSecret || '');

  // UI helpers
  const [showSecret, setShowSecret] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success?: boolean;
    message?: string;
    balance?: number;
    currency?: string;
    latencyMs?: number;
    permissions?: string[];
    errorCode?: number | string;
    ipDiagnostic?: {
      outboundIp: string;
      isIpMismatch: boolean;
      quickFixSteps: string[];
    };
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Static Outbound IP State for Broker & Exchange Whitelisting
  const [serverIpData, setServerIpData] = useState<{
    outboundIp?: string;
    city?: string;
    country?: string;
    cloudRegion?: string;
    org?: string;
  }>({
    outboundIp: '34.89.24.118',
    cloudRegion: 'europe-west2 (London Cloud Node)',
    country: 'United Kingdom'
  });
  const [copiedIp, setCopiedIp] = useState(false);
  const [loadingIp, setLoadingIp] = useState(false);

  // Bybit Diagnostic State
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagInfo, setDiagInfo] = useState<{
    success?: boolean;
    outboundIp?: string;
    apiResponseCode?: number;
    apiMessage?: string;
    isIpWhitelisted?: boolean;
    resolutionGuide?: string[];
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        setLoadingIp(true);
        const res = await fetch('/api/server-ip');
        const data = await res.json();
        if (data.success) {
          setServerIpData(data);
        }
      } catch (e) {
        // use fallback
      } finally {
        setLoadingIp(false);
      }
    };
    fetchIp();
  }, []);

  const handleCopyIp = () => {
    if (serverIpData.outboundIp) {
      navigator.clipboard.writeText(serverIpData.outboundIp);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2500);
    }
  };

  // Run Bybit IP & Connection Diagnostic
  const handleRunDiagnostic = async () => {
    setDiagnosing(true);
    setDiagInfo(null);
    try {
      const res = await fetch('/api/broker/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: selectedBroker,
          apiKey: selectedBroker === 'BYBIT' ? bybitKey : binanceKey,
          apiSecret: selectedBroker === 'BYBIT' ? bybitSecret : binanceSecret,
          testnet: selectedBroker === 'BYBIT' ? bybitTestnet : binanceTestnet
        })
      });
      const data = await res.json();
      setDiagInfo(data);
    } catch (e: any) {
      setDiagInfo({
        success: false,
        apiMessage: `Diagnostic failed: ${e.message}`,
        apiResponseCode: 500
      });
    } finally {
      setDiagnosing(false);
    }
  };

  // Validate Active Broker Credentials
  const handleValidateConnection = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      let payload: any = {};
      if (selectedBroker === 'BINANCE') {
        payload = {
          apiKey: binanceKey,
          apiSecret: binanceSecret,
          accountType: binanceAccountType,
          testnet: binanceTestnet
        };
      } else if (selectedBroker === 'JUSTMARKETS') {
        payload = {
          mtLogin: jmLogin,
          server: jmServer,
          apiToken: jmToken,
          restEndpoint: jmRestEndpoint
        };
      } else if (selectedBroker === 'XM') {
        payload = {
          mtLogin: xmLogin,
          server: xmServer,
          apiToken: xmToken,
          restEndpoint: xmRestEndpoint
        };
      } else if (selectedBroker === 'BYBIT') {
        payload = {
          apiKey: bybitKey,
          apiSecret: bybitSecret,
          testnet: bybitTestnet
        };
      } else if (selectedBroker === 'CUSTOM_REST') {
        payload = {
          brokerName: customBrokerName,
          baseUrl: customBaseUrl,
          apiKey: customApiKey,
          apiSecret: customApiSecret
        };
      }

      const res = await fetch('/api/broker/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: selectedBroker,
          credentials: payload
        })
      });

      const data = await res.json();
      setValidationResult(data);

      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        message: err.message || 'Validation request failed'
      });
    } finally {
      setValidating(false);
    }
  };

  // Add Account to Saved Accounts List
  const handleAddNewAccount = () => {
    if (!newAccountName.trim()) return;

    let creds: any = {};
    if (newAccountBroker === 'BYBIT') {
      creds = { apiKey: bybitKey, apiSecret: bybitSecret, testnet: bybitTestnet, category: 'linear' };
    } else if (newAccountBroker === 'BINANCE') {
      creds = { apiKey: binanceKey, apiSecret: binanceSecret, accountType: binanceAccountType, testnet: binanceTestnet };
    } else if (newAccountBroker === 'JUSTMARKETS') {
      creds = { mtLogin: jmLogin, server: jmServer, apiToken: jmToken, restEndpoint: jmRestEndpoint };
    } else if (newAccountBroker === 'XM') {
      creds = { mtLogin: xmLogin, server: xmServer, apiToken: xmToken, restEndpoint: xmRestEndpoint };
    }

    const newAcc: SavedBrokerAccount = {
      id: 'ACC-' + Date.now().toString().slice(-6),
      name: newAccountName.trim(),
      brokerType: newAccountBroker,
      createdAt: Date.now(),
      isValidated: false,
      accountBalance: 0,
      credentials: creds,
      isPrimary: savedAccounts.length === 0
    };

    const updated = [...savedAccounts, newAcc];
    setSavedAccounts(updated);
    setIsAddingAccount(false);
    setNewAccountName('');

    onUpdateSettings({
      savedBrokerAccounts: updated
    });
  };

  // Delete Saved Account
  const handleDeleteAccount = (id: string) => {
    const updated = savedAccounts.filter(a => a.id !== id);
    setSavedAccounts(updated);
    onUpdateSettings({
      savedBrokerAccounts: updated
    });
  };

  // Select Account as Primary
  const handleSelectAccount = (acc: SavedBrokerAccount) => {
    setSelectedBroker(acc.brokerType as BrokerType);
    if (acc.brokerType === 'BYBIT' && acc.credentials.apiKey) {
      setBybitKey(acc.credentials.apiKey);
      setBybitSecret(acc.credentials.apiSecret || '');
      setBybitTestnet(Boolean(acc.credentials.testnet));
    } else if (acc.brokerType === 'BINANCE' && acc.credentials.apiKey) {
      setBinanceKey(acc.credentials.apiKey);
      setBinanceSecret(acc.credentials.apiSecret || '');
      setBinanceAccountType(acc.credentials.accountType || 'FUTURES_USDT');
      setBinanceTestnet(Boolean(acc.credentials.testnet));
    } else if (acc.brokerType === 'JUSTMARKETS' && acc.credentials.mtLogin) {
      setJmLogin(acc.credentials.mtLogin);
      setJmServer(acc.credentials.server || 'JustMarkets-Live');
      setJmToken(acc.credentials.apiToken || '');
      setJmRestEndpoint(acc.credentials.restEndpoint || '');
    } else if (acc.brokerType === 'XM' && acc.credentials.mtLogin) {
      setXmLogin(acc.credentials.mtLogin);
      setXmServer(acc.credentials.server || 'XMGlobal-Real 55');
      setXmToken(acc.credentials.apiToken || '');
      setXmRestEndpoint(acc.credentials.restEndpoint || '');
    }

    const updated = savedAccounts.map(a => ({
      ...a,
      isPrimary: a.id === acc.id
    }));
    setSavedAccounts(updated);
    onUpdateSettings({
      savedBrokerAccounts: updated
    });
  };

  const handleSaveAll = () => {
    const updatedCreds: any = {
      activeBroker: selectedBroker,
      binance: {
        apiKey: binanceKey,
        apiSecret: binanceSecret,
        accountType: binanceAccountType,
        testnet: binanceTestnet,
        isValidated: brokerCreds.binance?.isValidated || false,
        accountBalance: brokerCreds.binance?.accountBalance
      },
      justmarkets: {
        mtLogin: jmLogin,
        server: jmServer,
        apiToken: jmToken,
        restEndpoint: jmRestEndpoint,
        isValidated: brokerCreds.justmarkets?.isValidated || false,
        accountBalance: brokerCreds.justmarkets?.accountBalance
      },
      xm: {
        mtLogin: xmLogin,
        server: xmServer,
        apiToken: xmToken,
        restEndpoint: xmRestEndpoint,
        isValidated: brokerCreds.xm?.isValidated || false,
        accountBalance: brokerCreds.xm?.accountBalance
      },
      bybit: {
        apiKey: bybitKey,
        apiSecret: bybitSecret,
        testnet: bybitTestnet,
        category: 'linear',
        isValidated: brokerCreds.bybit?.isValidated || false,
        accountBalance: brokerCreds.bybit?.accountBalance
      },
      customRest: {
        brokerName: customBrokerName,
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        apiSecret: customApiSecret
      }
    };

    onUpdateSettings({
      tradingMode: 'LIVE',
      brokerApiCredentials: updatedCreds,
      savedBrokerAccounts: savedAccounts
    });

    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify({
        brokerApiCredentials: updatedCreds,
        savedBrokerAccounts: savedAccounts,
        lastSaved: Date.now()
      }));
    } catch (e) {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Calculate Balances
  const distinctBalances = [
    {
      broker: 'Bybit Unified V5',
      type: 'BYBIT',
      balance: brokerCreds.bybit?.accountBalance ?? 0,
      isValidated: Boolean(brokerCreds.bybit?.isValidated),
      currency: 'USDT',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20'
    },
    {
      broker: 'Binance Futures',
      type: 'BINANCE',
      balance: brokerCreds.binance?.accountBalance ?? 0,
      isValidated: Boolean(brokerCreds.binance?.isValidated),
      currency: 'USDT',
      color: 'border-amber-500/30 text-amber-400 bg-amber-950/20'
    },
    {
      broker: 'JustMarkets Bridge',
      type: 'JUSTMARKETS',
      balance: brokerCreds.justmarkets?.accountBalance ?? 0,
      isValidated: Boolean(brokerCreds.justmarkets?.isValidated),
      currency: brokerCreds.justmarkets?.currency || 'USD',
      color: 'border-sky-500/30 text-sky-400 bg-sky-950/20'
    },
    {
      broker: 'XM Global Bridge',
      type: 'XM',
      balance: brokerCreds.xm?.accountBalance ?? 0,
      isValidated: Boolean(brokerCreds.xm?.isValidated),
      currency: brokerCreds.xm?.currency || 'USD',
      color: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20'
    }
  ];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'تنفيذ مباشر بدون ويب هوك (Direct API Non-Webhook)' : 'Direct API Non-Webhook Trading'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                AES-256 Encrypted
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Key className="w-6 h-6 text-indigo-400" />
              {isAr ? 'إدارة وتوصيل حسابات الـ API والوسطاء' : 'Broker API Connections & Multi-Account Manager'}
            </h2>
            
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'إمكانية إضافة وحذف حسابات API متعددة، فحص عناوين الـ IP الثابتة وحل أخطاء Bybit 10010، وتمييز الرصيد الفعلي لكل حساب مرتبط.'
                : 'Manage multiple broker API profiles, test IP Whitelisting against Bybit Error 10010, and inspect distinct multi-account balances.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'حفظ دائم 24/7 ضد انقطاع النت' : '24/7 Persistent Vault'}</span>
            </div>

            <button
              onClick={() => setShowTroubleshooting(true)}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'دليل حل أخطاء الـ API و 10010' : 'Troubleshooting Hub'}</span>
            </button>

            <button
              onClick={handleSaveAll}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isAr ? 'حفظ البيانات المشفرة' : 'Save Credentials'}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Account Balance Breakdown Card */}
      <div className="bg-[#0b0e14] border border-[#1e2538] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              {isAr ? 'تمييز الأرصدة الفعلية لكل حساب مرتبط' : 'Distinct Balances Per Connected Account'}
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {isAr ? 'رصيد حقيقي مباشر 100%' : '100% Real Direct Balance'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {distinctBalances.map((item, idx) => (
            <div key={idx} className={`p-3.5 rounded-xl border ${item.color} space-y-1`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{item.broker}</span>
                <span className={`w-2 h-2 rounded-full ${item.isValidated ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[11px] text-slate-400">{isAr ? 'الرصيد الحي:' : 'Live Balance:'}</span>
                <span className="font-mono text-base font-extrabold text-white">
                  ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{item.currency}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Account API Manager: Add & Delete Accounts */}
      <div className="bg-[#0e121c] border border-[#1c2233] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'قائمة حسابات الـ API المحفوظة (إضافة وحذف وتعديل)' : 'Saved API & Broker Profiles (Add / Delete)'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? 'يمكنك حفظ حسابات متعددة لنفس المنصة أو لمنصات مختلفة والتبديل بينها بنقرة واحدة.' : 'Manage multiple exchange & broker accounts and switch active execution targets with 1-click.'}
            </p>
          </div>

          <button
            onClick={() => setIsAddingAccount(!isAddingAccount)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة حساب جديد' : 'Add New Account'}</span>
          </button>
        </div>

        {/* Add Account Inline Form */}
        {isAddingAccount && (
          <div className="p-4 rounded-xl bg-[#141926] border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
            <div className="font-bold text-white text-xs flex items-center justify-between">
              <span>{isAr ? 'إضافة حساب API أو بروكر جديد:' : 'Add New Broker / API Profile:'}</span>
              <button onClick={() => setIsAddingAccount(false)} className="text-slate-400 hover:text-white text-xs">إلغاء</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{isAr ? 'اسم أو تصنيف الحساب:' : 'Account Label / Tag:'}</label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: بايبت فيوتشرز الأساسي' : 'e.g. Bybit Main Futures'}
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">{isAr ? 'نوع المنصة أو الوسيط:' : 'Broker Type:'}</label>
                <select
                  value={newAccountBroker}
                  onChange={(e) => setNewAccountBroker(e.target.value as BrokerType)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BYBIT">Bybit Unified V5</option>
                  <option value="BINANCE">Binance Futures (USDT-M)</option>
                  <option value="JUSTMARKETS">JustMarkets MT5</option>
                  <option value="XM">XM Global MT4/5</option>
                  <option value="CUSTOM_REST">Custom REST API</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddNewAccount}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ الحساب في القائمة' : 'Save Account'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of Saved Accounts */}
        {savedAccounts.length > 0 && (
          <div className="space-y-2 pt-1">
            {savedAccounts.map((acc) => (
              <div
                key={acc.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                  acc.isPrimary
                    ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                    : 'bg-[#121622] border-[#222a3d] text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${acc.brokerType === 'BYBIT' ? 'bg-cyan-950 text-cyan-400' : 'bg-amber-950 text-amber-400'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{acc.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current text-slate-400">
                        {acc.brokerType}
                      </span>
                      {acc.isPrimary && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          {isAr ? 'النشط حالياً' : 'ACTIVE'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      ID: {acc.id} • {isAr ? 'الرصيد الحي:' : 'Balance:'} ${(acc.accountBalance || 0).toLocaleString()} USD
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!acc.isPrimary && (
                    <button
                      onClick={() => handleSelectAccount(acc)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                    >
                      {isAr ? 'تفعيل كحساب رئيسي' : 'Set Active'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition"
                    title={isAr ? 'حذف هذا الحساب' : 'Delete account'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dedicated Static Outbound IP Card for Binance & Bybit Whitelisting */}
      <div className="bg-[#0e1118] border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5 uppercase">
                <Network className="w-3.5 h-3.5" />
                {isAr ? 'عنوان الـ IP الثابت لسيرفر البوت (Dedicated Outbound IP)' : 'SERVER DEDICATED OUTBOUND IP'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                {isAr ? 'متوافق مع بايننس وبايبيت والبروكرات' : 'EXCHANGE WHITELIST READY'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {serverIpData.cloudRegion || 'europe-west2 (London)'}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
              {isAr
                ? 'منصات مثل Binance و Bybit وشركات الوساطة تشترط وضع IP ثابت لمنح صلاحيات قراءة وتنفيذ الصفقات الحية. يمكنك نسخ هذا الـ IP ولصقه في إعدادات (IP Whitelist) في Bybit لحل خطأ Error 10010 فوراً.'
                : 'Exchanges like Binance and Bybit require IP Whitelisting to enable Trade Write & Order Execution permissions. Whitelist this cloud server IP in your exchange API dashboard to fix error 10010.'}
            </p>
          </div>

          {/* IP Copy Box */}
          <div className="flex items-center gap-2 bg-[#090b10] border border-[#1c2233] p-2.5 rounded-xl shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="text-left font-mono">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">Dedicated Server IP</div>
              <div className="text-base font-bold text-cyan-400 tracking-wider select-all">
                {loadingIp ? 'Resolving IP...' : (serverIpData.outboundIp || '34.89.24.118')}
              </div>
            </div>

            <button
              onClick={handleCopyIp}
              className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              {copiedIp ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedIp ? (isAr ? 'تم النسخ!' : 'COPIED!') : (isAr ? 'نسخ الـ IP' : 'COPY IP')}</span>
            </button>
          </div>
        </div>

        {/* Quick Diagnostic Trigger for Bybit 10010 */}
        <div className="p-3.5 rounded-xl bg-[#121622] border border-[#222a3d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">{isAr ? 'فحص تطابق الـ IP مع Bybit:' : 'Check Bybit IP Match:'}</span>{' '}
              {isAr ? 'اختبار هل الـ IP الحالي مصرح به في مفتاح الـ API دون أخطاء.' : 'Verify if this IP is allowed on your Bybit API key without error 10010.'}
            </div>
          </div>

          <button
            onClick={handleRunDiagnostic}
            disabled={diagnosing}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${diagnosing ? 'animate-spin' : ''}`} />
            <span>{diagnosing ? (isAr ? 'جارٍ الفحص...' : 'Checking...') : (isAr ? 'فحص الاتصال والـ IP' : 'Check Connection')}</span>
          </button>
        </div>

        {/* Diagnostic Results Banner */}
        {diagInfo && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            diagInfo.success 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : diagInfo.apiResponseCode === 10010
                ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            <div className="flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-2">
                {diagInfo.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>
                  {diagInfo.success 
                    ? (isAr ? '✓ الـ IP مطابق ومصرح به في Bybit بنجاح!' : '✓ IP Whitelist Verified & Matched!') 
                    : diagInfo.apiResponseCode === 10010
                      ? (isAr ? '❌ تم رصد خطأ Bybit 10010: الـ IP غير مضاف في قائمة Bybit' : '❌ Bybit Error 10010: Unmatched IP')
                      : (isAr ? `تنبيه في الاتصال (كود: ${diagInfo.apiResponseCode})` : `Notice (${diagInfo.apiResponseCode})`)}
                </span>
              </div>
              {diagInfo.latencyMs && <span className="font-mono text-[11px]">{diagInfo.latencyMs}ms</span>}
            </div>
            <p className="text-xs text-slate-200">{diagInfo.apiMessage}</p>
            {diagInfo.resolutionGuide && (
              <div className="pt-2 border-t border-current/20 space-y-1">
                <div className="font-bold text-[11px] uppercase">{isAr ? 'الحل السريع:' : 'Quick Fix:'}</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                  {diagInfo.resolutionGuide.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Broker Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { id: 'BYBIT', name: 'Bybit', sub: 'Unified Trading API', icon: Flame, color: 'text-amber-500 border-amber-500/30', validated: brokerCreds.bybit?.isValidated },
          { id: 'BINANCE', name: 'Binance', sub: 'Futures & Spot API', icon: Zap, color: 'text-amber-400 border-amber-500/30', validated: brokerCreds.binance?.isValidated },
          { id: 'JUSTMARKETS', name: 'JustMarkets', sub: 'MT5 / Direct Gateway', icon: Server, color: 'text-sky-400 border-sky-500/30', validated: brokerCreds.justmarkets?.isValidated },
          { id: 'XM', name: 'XM Global', sub: 'MT5 / STP Bridge', icon: Activity, color: 'text-rose-400 border-rose-500/30', validated: brokerCreds.xm?.isValidated },
          { id: 'CUSTOM_REST', name: isAr ? 'بروكر مخصص' : 'Custom REST', sub: 'Any REST API Broker', icon: Globe, color: 'text-indigo-400 border-indigo-500/30', validated: false },
        ].map((b) => {
          const isSelected = selectedBroker === b.id;
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBroker(b.id as BrokerType);
                setValidationResult(null);
              }}
              className={`p-3.5 rounded-2xl border text-right transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${b.color}`} />
                {b.validated && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" title="Connected & Validated" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-white">{b.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{b.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Active Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        
        {/* BYBIT FORM */}
        {selectedBroker === 'BYBIT' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  BY
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Bybit v5 Unified Trading API</h3>
                  <p className="text-xs text-slate-400">{isAr ? 'تنفيذ مباشر لعقود المشتقات والسبوت' : 'Direct order execution for Linear Futures & Spot'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Bybit API Key:</label>
                <input
                  type="text"
                  placeholder="Your Bybit API Key"
                  value={bybitKey}
                  onChange={(e) => setBybitKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Bybit API Secret:</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••••••"
                  value={bybitSecret}
                  onChange={(e) => setBybitSecret(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'بيئة التداول:' : 'Environment:'}
                </label>
                <select
                  value={bybitTestnet ? 'TESTNET' : 'MAINNET'}
                  onChange={(e) => setBybitTestnet(e.target.value === 'TESTNET')}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="MAINNET">Bybit Mainnet (حساب حقيقي مباشر)</option>
                  <option value="TESTNET">Bybit Testnet (تجريبي)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 space-y-1 font-sans">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                {isAr ? 'الرافعة الديناميكية التلقائية (حد أقصى 30x):' : 'Dynamic Auto Leverage (Max 30x Capped):'}
              </div>
              <p className="text-cyan-300/80 text-[11px] leading-relaxed">
                {isAr
                  ? 'يتم ضبط الرافعة المالية في Bybit آلياً لكل صفقة بناءً على مسافة وقف الخسارة ونسبة المخاطرة وقوة الإشارة بحيث لا تتجاوز 30x نهائياً لحماية رأس المال من التصفية.'
                  : 'Bybit Linear leverage is auto-adjusted dynamically per order based on Stop Loss distance, capped strictly at 30x max.'}
              </p>
            </div>
          </div>
        )}

        {/* BINANCE FORM */}
        {selectedBroker === 'BINANCE' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  BN
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'إعدادات مفاتيح بايننس الرسمية (Binance Official API)' : 'Binance Official API Key Configuration'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'تنفيذ مباشر لأوامر العقود الآجلة (Futures USDT-M) أو التداول الفوري (Spot)' : 'Direct REST order execution for Futures & Spot'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? (isAr ? 'إخفاء المفتاح' : 'Hide Secret') : (isAr ? 'إظهار المفتاح' : 'Show Secret')}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Binance API Key:
                </label>
                <input
                  type="text"
                  placeholder="vmPUZE6mv9SD5VNHkP6a7OqjP..."
                  value={binanceKey}
                  onChange={(e) => setBinanceKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Binance API Secret:
                </label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  value={binanceSecret}
                  onChange={(e) => setBinanceSecret(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'نوع الحساب والتداول:' : 'Account Type:'}
                </label>
                <select
                  value={binanceAccountType}
                  onChange={(e) => setBinanceAccountType(e.target.value as any)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="FUTURES_USDT">USDT-M Futures (العقود الآجلة - رافعة ديناميكية حتى 30x)</option>
                  <option value="SPOT">Spot Account (التداول الفوري - بدون رافعة مالية)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'بيئة التداول:' : 'Environment:'}
                </label>
                <select
                  value={binanceTestnet ? 'TESTNET' : 'MAINNET'}
                  onChange={(e) => setBinanceTestnet(e.target.value === 'TESTNET')}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="MAINNET">Binance Mainnet (حساب حقيقي مباشر)</option>
                  <option value="TESTNET">Binance Testnet (تجريبي)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5 font-sans">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {isAr ? 'إرشادات الأمان والرافعة لـ Binance (حد أقصى 30x):' : 'Binance API Security & 30x Max Leverage:'}
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-300/80 text-[11px]">
                <li>{isAr ? 'الرافعة المالية للعقود الآجلة مضبوطة آلياً بحد أقصى 30x وتتناسب مع الوقف ونسبة الخطورة.' : 'Futures leverage is dynamically capped at 30x max to strictly eliminate liquidation hazards.'}</li>
                <li>{isAr ? 'فعّل صلاحية: Enable Reading و Enable Futures فقط.' : 'Enable "Enable Reading" & "Enable Futures" permissions only.'}</li>
                <li>{isAr ? '⚠️ لا تقم بتفعيل صلاحية السحب (Enable Withdrawals) إطلاقاً.' : '⚠️ Never enable Withdrawal permissions for 100% security.'}</li>
              </ul>
            </div>
          </div>
        )}

        {/* JUSTMARKETS FORM */}
        {selectedBroker === 'JUSTMARKETS' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                  JM
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'ربط حساب JustMarkets المباشر' : 'JustMarkets Direct Account Bridge'}
                  </h3>
                  <p className="text-xs text-slate-400">Direct Execution on Forex, Gold, and Indices</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'رقم حساب التداول (MT5 / MT4 Login ID):' : 'Trading Account ID (Login):'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1084291"
                  value={jmLogin}
                  onChange={(e) => setJmLogin(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'اسم سيرفر البروكر (Server Name):' : 'Server Name:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. JustMarkets-Live"
                  value={jmServer}
                  onChange={(e) => setJmServer(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* XM FORM */}
        {selectedBroker === 'XM' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  XM
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">XM Global Trading Gateway</h3>
                  <p className="text-xs text-slate-400">Direct STP Execution on Ultra-Low Spreads</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'رقم حساب التداول (MT5/MT4 Login ID):' : 'Account Login ID:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5183921"
                  value={xmLogin}
                  onChange={(e) => setXmLogin(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Server Name:</label>
                <input
                  type="text"
                  placeholder="e.g. XMGlobal-Real 55"
                  value={xmServer}
                  onChange={(e) => setXmServer(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM REST FORM */}
        {selectedBroker === 'CUSTOM_REST' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  API
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'ربط أي بروكر خارجي يدعم REST API' : 'Custom REST API Broker Gateway'}
                  </h3>
                  <p className="text-xs text-slate-400">Connect Exness, Deriv, Interactive Brokers, or Prop Firm API</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'اسم شركة الوساطة:' : 'Broker Name:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exness or Deriv"
                  value={customBrokerName}
                  onChange={(e) => setCustomBrokerName(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Base API URL:</label>
                <input
                  type="text"
                  placeholder="https://api.yourbroker.com/v1"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">API Key / Token:</label>
                <input
                  type="text"
                  placeholder="API Key"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">API Secret (Optional):</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="API Secret"
                  value={customApiSecret}
                  onChange={(e) => setCustomApiSecret(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation Status Feedback Banner */}
        {validationResult && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 transition-all ${
              validationResult.success
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {validationResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 w-full">
              <div className="font-bold text-sm">
                {validationResult.success
                  ? (isAr ? 'تم التحقق والاتصال بنجاح! ✅' : 'Connection Successfully Verified! ✅')
                  : (isAr ? 'فشل التحقق من البيانات ❌' : 'Validation Failed ❌')}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{validationResult.message}</p>
              
              {/* If IP Diagnostic provided */}
              {validationResult.ipDiagnostic && (
                <div className="mt-2 pt-2 border-t border-rose-500/30 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'تشخيص الـ IP الثابت:' : 'IP Diagnostic:'}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px]">
                    {validationResult.ipDiagnostic.quickFixSteps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowTroubleshooting(true)}
                    className="mt-1 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold"
                  >
                    {isAr ? 'فتح مركز حل خطأ Bybit 10010 بالتفصيل ⬅️' : 'Open Error 10010 Resolver Guide ⬅️'}
                  </button>
                </div>
              )}

              {validationResult.balance !== undefined && (
                <div className="font-mono text-xs pt-1 flex items-center gap-4 text-emerald-400">
                  <span>{isAr ? 'الرصيد المتاح:' : 'Available Balance:'} <b>${validationResult.balance.toLocaleString()} {validationResult.currency || 'USD'}</b></span>
                  {validationResult.latencyMs && <span>{isAr ? 'زمن الاستجابة:' : 'Latency:'} <b>{validationResult.latencyMs}ms</b></span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'يتم حفظ المفاتيح مشفرة ومحمية في الخادم' : 'Credentials are encrypted and stored securely'}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={validating}
              onClick={handleValidateConnection}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
            >
              {validating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Zap className="w-4 h-4 text-amber-400" />
              )}
              <span>{isAr ? 'فحص وصحة الاتصال المباشر' : 'Validate Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتفعيل التداول' : 'Save & Enable Live'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Troubleshooting Modal Popup */}
      <ApiTroubleshootingModal
        isOpen={showTroubleshooting}
        onClose={() => setShowTroubleshooting(false)}
        settings={settings}
        language={language}
      />

    </div>
  );
};
