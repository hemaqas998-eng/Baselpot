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
  Zap
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SecretVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const PRESET_CATEGORIES = [
  { id: 'BROKER_METATRADER', nameAr: 'حساب ميتاتريدر (MT4 / MT5)', nameEn: 'MetaTrader 4/5', icon: Server, defaultKey: 'MT_LOGIN', descAr: 'رقم الحساب وكلمة مرور المستثمر/التداول وخادم البروكر' },
  { id: 'BROKER_BINANCE', nameAr: 'منصة بينانس (Binance API)', nameEn: 'Binance API', icon: Zap, defaultKey: 'BINANCE_API_KEY', descAr: 'مفاتيح API Key و Secret Key للتداول اللحظي' },
  { id: 'BROKER_BYBIT', nameAr: 'منصة بايبت (Bybit V5 API)', nameEn: 'Bybit V5 API', icon: Cpu, defaultKey: 'BYBIT_API_KEY', descAr: 'مفاتيح التداول للعقود الآجلة والفورية V5' },
  { id: 'BROKER_DERIV', nameAr: 'بروكر ديريف (Deriv / Binary)', nameEn: 'Deriv Token', icon: Radio, defaultKey: 'DERIV_API_TOKEN', descAr: 'رمز التفويض API Token لعقود المؤشرات والفوركس' },
  { id: 'TIINGO_API', nameAr: 'تغذية الأسعار (Tiingo Token)', nameEn: 'Tiingo Token', icon: Database, defaultKey: 'TIINGO_API_TOKEN', descAr: 'رمز الوصول للأسعار اللحظية وبيانات الشموع' },
  { id: 'TELEGRAM_BOT', nameAr: 'تنبيهات تيليجرام (Telegram Token)', nameEn: 'Telegram Bot', icon: Send, defaultKey: 'TELEGRAM_BOT_TOKEN', descAr: 'رمز بوت تيليجرام ومعرف القناة لإرسال الصفقات' },
  { id: 'AI_API_KEY', nameAr: 'نماذج الذكاء الاصطناعي (AI Key)', nameEn: 'AI Models Key', icon: Cpu, defaultKey: 'GEMINI_API_KEY', descAr: 'مفتاح التحليل الاستراتيجي وتوليد خطط التداول' },
  { id: 'CUSTOM_SECRET', nameAr: 'سر خاص مخصص (Custom Secret)', nameEn: 'Custom Secret', icon: Key, defaultKey: 'CUSTOM_WEBHOOK_SECRET', descAr: 'أي مفتاح أو رمز سري إضافي يحتاج للتشفير' },
];

export const SecretVaultModal: React.FC<SecretVaultModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secrets, setSecrets] = useState<MaskedSecret[]>([]);
  
  // Add Secret Form State
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('BROKER_METATRADER');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescAr, setNewDescAr] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [verifyingBroker, setVerifyingBroker] = useState<string | null>(null);
  const [verifyFeedback, setVerifyFeedback] = useState<{ key: string; msg: string; success: boolean } | null>(null);

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

  useEffect(() => {
    if (isOpen) {
      fetchVaultStatus();
    }
  }, [isOpen]);

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
          category: selectedCategory,
          label: newLabel || newKey,
          descriptionArabic: newDescAr
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveSuccess(isAr ? 'تم حفظ وتشفير السر بنجاح داخل الخزنة 🔒' : 'Secret encrypted and stored in vault 🔒');
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

  const handleVerifyBroker = async (brokerType: string, key: string) => {
    try {
      setVerifyingBroker(key);
      setVerifyFeedback(null);
      const res = await fetch('/api/security/vault/verify-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerType })
      });
      const data = await res.json();
      setVerifyFeedback({
        key,
        msg: isAr ? data.messageArabic : data.messageEnglish,
        success: data.success
      });
      setTimeout(() => setVerifyFeedback(null), 5000);
    } catch (err: any) {
      setVerifyFeedback({ key, msg: err.message, success: false });
    } finally {
      setVerifyingBroker(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  {isAr ? 'خزنة الأسرار المشفرة (Secret Vault)' : 'Secure Secret Vault'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? 'حفظ مشفر للبيانات الحساسة وحسابات المنصات والبروكرات دون عرضها على الواجهة' : 'Confidential encrypted vault for broker credentials and private keys'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                onClick={handleLock}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                {isAr ? 'قفل الخزنة' : 'Lock Vault'}
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Master Lock Screen if Locked */}
          {!isUnlocked ? (
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
          ) : (
            <div className="space-y-6">
              
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

                  {/* Preset Selector */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">{isAr ? 'نوع الحساب / المنصة:' : 'Category / Platform:'}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_CATEGORIES.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(p.id);
                            setNewKey(p.defaultKey);
                            setNewLabel(p.nameEn);
                            setNewDescAr(p.descAr);
                          }}
                          className={`p-2.5 rounded-xl border text-start transition text-xs ${
                            selectedCategory === p.id 
                              ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold truncate">{isAr ? p.nameAr : p.nameEn}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'مفتاح التعريف (Secret Key Name):' : 'Secret Key Name:'}</label>
                      <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="e.g. MT5_ACCOUNT_PASSWORD"
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
                        placeholder="e.g. MetaTrader 5 Primary Live"
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
                    {isAr ? 'لا توجد مفاتيح محفوظة في الخزنة بعد. اضغط "إضافة سر / حساب جديد" لتخزين بياناتك بأمان.' : 'No secrets stored yet. Click "Add Secret" to store your keys safely.'}
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

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Quick Broker Test */}
                        {s.category.includes('BINANCE') && (
                          <button
                            onClick={() => handleVerifyBroker('BINANCE', s.key)}
                            disabled={verifyingBroker === s.key}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            {verifyingBroker === s.key ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-400" />}
                            <span>{isAr ? 'فحص الاتصال' : 'Verify'}</span>
                          </button>
                        )}

                        {s.category.includes('BYBIT') && (
                          <button
                            onClick={() => handleVerifyBroker('BYBIT', s.key)}
                            disabled={verifyingBroker === s.key}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            {verifyingBroker === s.key ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-400" />}
                            <span>{isAr ? 'فحص الاتصال' : 'Verify'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSecret(s.key)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title={isAr ? 'حذف من الخزنة' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {verifyFeedback && verifyFeedback.key === s.key && (
                        <div className={`w-full text-xs p-2 rounded-lg mt-2 font-mono flex items-center gap-1.5 ${verifyFeedback.success ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'bg-rose-950/70 text-rose-300 border border-rose-800'}`}>
                          {verifyFeedback.success ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{verifyFeedback.msg}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500 font-mono">
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
