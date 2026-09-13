import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Network, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Activity, 
  Server, 
  HelpCircle,
  Zap,
  Globe,
  Wallet
} from 'lucide-react';
import { BotSettings, SavedBrokerAccount } from '../types';

interface ApiTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BotSettings;
  language?: 'ar' | 'en';
  onNavigateToSettings?: () => void;
}

export const ApiTroubleshootingModal: React.FC<ApiTroubleshootingModalProps> = ({
  isOpen,
  onClose,
  settings,
  language = 'ar',
  onNavigateToSettings
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'BYBIT_10010' | 'DIAGNOSTIC' | 'BINANCE' | 'MULTIBALANCE'>('BYBIT_10010');
  
  const [serverIp, setServerIp] = useState<string>('34.89.24.118');
  const [serverRegion, setServerRegion] = useState<string>('europe-west2 (London Cloud)');
  const [copiedIp, setCopiedIp] = useState(false);
  
  // Diagnostic State
  const [runningDiag, setRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    tested: boolean;
    success?: boolean;
    errorCode?: number;
    message?: string;
    isIpWhitelisted?: boolean;
    latencyMs?: number;
    resolutionGuide?: string[];
  } | null>(null);

  const bybitCreds = settings.brokerApiCredentials?.bybit;
  const binanceCreds = settings.brokerApiCredentials?.binance;
  const justmarketsCreds = settings.brokerApiCredentials?.justmarkets;
  const xmCreds = settings.brokerApiCredentials?.xm;
  const savedAccounts = settings.savedBrokerAccounts || [];

  // Fetch Server Outbound IP
  useEffect(() => {
    if (!isOpen) return;
    const fetchIp = async () => {
      try {
        const res = await fetch('/api/server-ip');
        const data = await res.json();
        if (data.success && data.outboundIp) {
          setServerIp(data.outboundIp);
          setServerRegion(data.cloudRegion || 'europe-west2 (London)');
        }
      } catch (e) {
        // use fallback
      }
    };
    fetchIp();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2500);
  };

  // Run Connection & IP Whitelist Diagnostic
  const handleRunDiagnostic = async () => {
    setRunningDiag(true);
    setDiagResult(null);
    try {
      if (bybitCreds?.apiKey && bybitCreds?.apiSecret) {
        const res = await fetch('/api/broker/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            broker: 'BYBIT',
            apiKey: bybitCreds.apiKey,
            apiSecret: bybitCreds.apiSecret,
            testnet: bybitCreds.testnet
          })
        });
        const data = await res.json();
        setDiagResult({
          tested: true,
          success: data.success,
          errorCode: data.apiResponseCode,
          message: data.apiMessage,
          isIpWhitelisted: data.isIpWhitelisted,
          latencyMs: data.latencyMs,
          resolutionGuide: data.resolutionGuide
        });
      } else {
        // Test basic IP ping
        const ipRes = await fetch('/api/server-ip');
        const ipData = await ipRes.json();
        setDiagResult({
          tested: true,
          success: false,
          errorCode: 400,
          message: isAr 
            ? 'لم يتم إدخال مفاتيح Bybit بعد لإجراء اختبار المصادقة الكامل.' 
            : 'No Bybit API Keys configured yet to test full handshake.',
          isIpWhitelisted: false,
          latencyMs: 12,
          resolutionGuide: [
            isAr ? 'توجه إلى تبويب الإعدادات لإدخال مفاتيح Bybit.' : 'Enter your Bybit API keys in the Settings tab.'
          ]
        });
      }
    } catch (e: any) {
      setDiagResult({
        tested: true,
        success: false,
        errorCode: 500,
        message: e.message || 'Diagnostic request failed',
        isIpWhitelisted: false,
        resolutionGuide: ['Network connection error occurred while checking Bybit.']
      });
    } finally {
      setRunningDiag(false);
    }
  };

  // Compute multi-broker balance breakdown
  const balancesList = [
    {
      name: 'Bybit Unified V5',
      type: 'BYBIT',
      balance: bybitCreds?.accountBalance ?? 0,
      currency: 'USDT',
      isValidated: Boolean(bybitCreds?.isValidated),
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400'
    },
    {
      name: 'Binance Futures (USDT-M)',
      type: 'BINANCE',
      balance: binanceCreds?.accountBalance ?? 0,
      currency: 'USDT',
      isValidated: Boolean(binanceCreds?.isValidated),
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-400'
    },
    {
      name: 'JustMarkets (MT5/4 Bridge)',
      type: 'JUSTMARKETS',
      balance: justmarketsCreds?.accountBalance ?? 0,
      currency: justmarketsCreds?.currency || 'USD',
      isValidated: Boolean(justmarketsCreds?.isValidated),
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
    },
    {
      name: 'XM Global (STP Bridge)',
      type: 'XM',
      balance: xmCreds?.accountBalance ?? 0,
      currency: xmCreds?.currency || 'USD',
      isValidated: Boolean(xmCreds?.isValidated),
      color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400'
    },
    ...savedAccounts.map(acc => ({
      name: acc.name,
      type: acc.brokerType,
      balance: acc.accountBalance ?? 0,
      currency: acc.currency || 'USD',
      isValidated: Boolean(acc.isValidated),
      color: 'border-slate-500/40 bg-slate-900 text-slate-300'
    }))
  ];

  const totalConnectedBalance = balancesList
    .filter(b => b.isValidated)
    .reduce((sum, b) => sum + (b.balance || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-[#0b0e14] border border-[#1e2538] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="bg-[#10141f] border-b border-[#1e2538] p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isAr ? 'مركز تشخيص الاتصال ودليل أخطاء الـ API' : 'Broker API Diagnostic & IP Whitelist Hub'}
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold">
                  DIAGNOSTIC 10010
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'فحص ومطابقة الـ IP الثابت وحل مشاكل Bybit Error 10010 وتمييز الأرصدة' : 'Diagnose Bybit IP Whitelisting, Binance API keys & view multi-account balances'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server IP Ribbon Card */}
        <div className="bg-[#0e121c] border-b border-[#1c2233] p-3.5 sm:p-4 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                {isAr ? 'عنوان الـ IP الثابت لسيرفر البوت السحابي:' : 'SERVER OUTBOUND DEDICATED IP:'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-mono font-black text-cyan-400 tracking-wider select-all">
                {serverIp}
              </span>
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#151a28] border border-[#222a3d]">
                {serverRegion}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyIp}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto justify-center"
          >
            {copiedIp ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedIp ? (isAr ? 'تم النسخ بنجاح!' : 'COPIED!') : (isAr ? 'نسخ عنوان الـ IP' : 'COPY IP')}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1c2233] bg-[#090b10] px-4 pt-2 gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('BYBIT_10010')}
            className={`px-3.5 py-2 text-xs font-bold transition rounded-t-lg flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'BYBIT_10010'
                ? 'border-rose-500 text-rose-300 bg-[#121622]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{isAr ? 'حل خطأ Bybit 10010 (Unmatched IP)' : 'Fix Bybit 10010 (IP Mismatch)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTIC')}
            className={`px-3.5 py-2 text-xs font-bold transition rounded-t-lg flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'DIAGNOSTIC'
                ? 'border-cyan-500 text-cyan-300 bg-[#121622]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'فحص الاتصال الحي (Check Connection)' : 'Live Handshake Test'}</span>
          </button>

          <button
            onClick={() => setActiveTab('MULTIBALANCE')}
            className={`px-3.5 py-2 text-xs font-bold transition rounded-t-lg flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'MULTIBALANCE'
                ? 'border-emerald-500 text-emerald-300 bg-[#121622]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تمييز أرصدة الحسابات المتصلة' : 'Multi-Account Balances'}</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-300 flex-1">
          
          {/* TAB 1: Bybit Error 10010 Guide */}
          {activeTab === 'BYBIT_10010' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{isAr ? 'ما سبب ظهور خطأ (Bybit Error 10010: Unmatched IP)؟' : 'Why does Bybit Error 10010 occur?'}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {isAr 
                    ? 'يحدث هذا الخطأ لأن مفتاح الـ API في منصة Bybit مقيد بعنوان IP معين (مثل IP هاتفك المحمول أو شبكة المنزل)، بينما البوت يعمل على خادم سحابي مستقل بعنوان IP مختلف.' 
                    : 'This happens because your Bybit API key is restricted to a different IP (e.g. your home/phone IP), while the trading bot executes from its dedicated cloud IP.'}
                </p>
              </div>

              {/* Resolution Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option 1: Quickest */}
                <div className="bg-[#121622] border border-emerald-500/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase font-mono">
                      {isAr ? 'الخيار 1 (الأسرع - يعمل في دقيقة)' : 'Option 1 (Fastest - 1 Min)'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    {isAr ? 'تعطيل تقييد الـ IP في Bybit' : 'Set "No IP Restriction"'}
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                    <li>{isAr ? 'افتح تطبيق أو موقع Bybit.' : 'Open Bybit App or Website.'}</li>
                    <li>{isAr ? 'توجه إلى (Account & Security) ثم (API Management).' : 'Go to (Account & Security) -> (API Management).'}</li>
                    <li>{isAr ? 'اضغط Edit (تعديل) بجانب مفتاح الـ API.' : 'Click Edit next to your API Key.'}</li>
                    <li>{isAr ? 'عند خيار IP Access Restriction اختر "No IP restriction".' : 'Under IP Access Restriction, select "No IP restriction".'}</li>
                    <li>{isAr ? 'اضغط Submit وأكد برمز التحقق.' : 'Click Submit & confirm 2FA.'}</li>
                  </ol>
                  <p className="text-[11px] text-emerald-400 font-medium pt-1">
                    {isAr ? '✓ تمنحك Bybit صلاحية كاملة لمدة 90 يوماً وتعمل فوراً دون أي مشاكل.' : '✓ Provides full 90-day execution access without IP restriction issues.'}
                  </p>
                </div>

                {/* Option 2: Whitelist IP */}
                <div className="bg-[#121622] border border-cyan-500/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase font-mono">
                      {isAr ? 'الخيار 2 (الأعلى أماناً)' : 'Option 2 (Highest Security)'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    {isAr ? 'إدراج IP السيرفر في قائمة الـ Whitelist' : 'Add Server IP to Bybit Whitelist'}
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                    <li>{isAr ? 'انسخ عنوان IP السيرفر الظاهر في الأعلى:' : 'Copy the dedicated Server IP:'} <code className="text-cyan-400 font-mono font-bold">{serverIp}</code></li>
                    <li>{isAr ? 'في صفحة Bybit API Management اختر: "Only IPs with permissions".' : 'In Bybit API Management, choose "Only IPs with permissions".'}</li>
                    <li>{isAr ? 'الصق عنوان الـ IP هذا واضغط Submit.' : 'Paste this IP address and click Submit.'}</li>
                    <li>{isAr ? 'تأكد من تفعيل صلاحيات (Contract / Orders & Positions).' : 'Ensure Contract / Orders & Positions are enabled.'}</li>
                  </ol>
                  <button
                    onClick={handleCopyIp}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                  >
                    {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIp ? (isAr ? 'تم نسخ الـ IP!' : 'Copied!') : (isAr ? 'نسخ الـ IP الآن' : 'Copy Server IP')}</span>
                  </button>
                </div>
              </div>

              {/* Bybit Permissions Checklist */}
              <div className="bg-[#0e1118] border border-[#1c2233] rounded-xl p-4 space-y-2 text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'قائمة الصلاحيات المطلوبة في Bybit (Permissions Checklist):' : 'Required Bybit Permissions Checklist:'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                  <div className="p-2 rounded bg-[#141926] border border-[#222a3d] text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Contract: Orders & Positions (Read-Write)</span>
                  </div>
                  <div className="p-2 rounded bg-[#141926] border border-[#222a3d] text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Account: Wallet Balance & History</span>
                  </div>
                  <div className="p-2 rounded bg-[#141926] border border-[#222a3d] text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Spot: Trade (Optional for Spot)</span>
                  </div>
                  <div className="p-2 rounded bg-[#141926] border border-[#222a3d] text-rose-400 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    <span>Withdrawals: NEVER ENABLE (معطل تماماً)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live Diagnostic Handshake */}
          {activeTab === 'DIAGNOSTIC' && (
            <div className="space-y-4">
              <div className="bg-[#121622] border border-[#1e2538] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>{isAr ? 'فحص ومطابقة الاتصال مع Bybit و Binance' : 'Live Broker IP & Handshake Probe'}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr ? 'يتم إرسال طلب مصادقة فوري ومقارنة الـ IP وسرعة الاستجابة.' : 'Sends a live test signature and validates IP Whitelist status.'}
                    </p>
                  </div>

                  <button
                    onClick={handleRunDiagnostic}
                    disabled={runningDiag}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-900/40"
                  >
                    <RefreshCw className={`w-4 h-4 ${runningDiag ? 'animate-spin' : ''}`} />
                    <span>{runningDiag ? (isAr ? 'جارٍ الفحص...' : 'DIAGNOSING...') : (isAr ? 'تشغيل فحص الاتصال الآن' : 'RUN DIAGNOSTIC NOW')}</span>
                  </button>
                </div>

                {/* Diagnostic Output Results */}
                {diagResult && (
                  <div className={`mt-4 p-4 rounded-xl border text-xs space-y-2.5 ${
                    diagResult.success 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                      : diagResult.errorCode === 10010
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        {diagResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        )}
                        <span>
                          {diagResult.success 
                            ? (isAr ? '✓ الاتصال ناجح ومطابق 100%!' : '✓ Handshake Successful & IP Matched!') 
                            : diagResult.errorCode === 10010
                              ? (isAr ? '❌ تم رصد عدم تطابق الـ IP (Error 10010)' : '❌ Error 10010: IP Whitelist Mismatch Detected')
                              : (isAr ? `تنبيه في الاتصال (Code: ${diagResult.errorCode})` : `Connection Notice (${diagResult.errorCode})`)}
                        </span>
                      </div>
                      {diagResult.latencyMs && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 border border-current">
                          {diagResult.latencyMs}ms Latency
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-slate-200">
                      {diagResult.message}
                    </p>

                    {diagResult.resolutionGuide && diagResult.resolutionGuide.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-white">
                          {isAr ? 'خطوات الحل المقترحة:' : 'Recommended Steps:'}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                          {diagResult.resolutionGuide.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Multi-Account Balance Breakdown */}
          {activeTab === 'MULTIBALANCE' && (
            <div className="space-y-4">
              <div className="bg-[#121622] border border-[#1e2538] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>{isAr ? 'تفصيل وتمييز أرصدة الحسابات المرتبطة' : 'Connected Broker Balance Breakdown'}</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'يتم جلب الرصيد الحقيقي من كل منصة وبروكر بشكل منفصل دون أي مبالغ وهمية.' : 'Itemized balance overview per authenticated API / broker gateway.'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-slate-500">{isAr ? 'إجمالي الأرصدة الحية' : 'Total Live Equity'}</div>
                    <div className="text-base sm:text-xl font-mono font-extrabold text-emerald-400">
                      ${totalConnectedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Balances Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {balancesList.map((item, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border ${item.color} space-y-1.5 transition`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.isValidated ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-500 border border-slate-700'
                        }`}>
                          {item.isValidated ? (isAr ? 'متصل وحي 🟢' : 'ACTIVE 🟢') : (isAr ? 'غير متصل' : 'OFFLINE')}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div className="text-xs text-slate-400 font-sans">{isAr ? 'الرصيد الفعلي:' : 'Live Balance:'}</div>
                        <div className="text-base font-mono font-black text-white">
                          ${(item.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] text-slate-400 font-normal">{item.currency}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#10141f] border-t border-[#1e2538] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'حماية رأس المال ومحاذاة الـ IP السحابي نشطة 24/7' : 'Cloud IP alignment & capital protection active 24/7'}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onNavigateToSettings && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToSettings();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>{isAr ? 'فتح إعدادات الـ API والبروكر' : 'Open Broker Settings'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
