import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Fingerprint, 
  Sparkles,
  Cpu,
  Zap,
  Activity
} from 'lucide-react';
import { securityVault } from '../services/securityVaultService';

interface SecurityLoginGateProps {
  onAuthenticated: () => void;
  language?: 'ar' | 'en';
}

export const SecurityLoginGate: React.FC<SecurityLoginGateProps> = ({
  onAuthenticated,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const hasExistingPasscode = securityVault.hasPasscode();

  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(!hasExistingPasscode);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (passcode.length < 4) {
      setErrorMsg(isAr ? 'يجب أن يتكون رمز المرور من 4 أرقام أو أحرف على الأقل.' : 'Passcode must be at least 4 characters/digits.');
      return;
    }

    if (isSettingUp && passcode !== confirmPasscode) {
      setErrorMsg(isAr ? 'رمز المرور غير متطابق.' : 'Passcodes do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isSettingUp) {
        await securityVault.setMasterPasscode(passcode);
        onAuthenticated();
      } else {
        const success = await securityVault.unlock(passcode);
        if (success) {
          onAuthenticated();
        } else {
          setErrorMsg(isAr ? 'رمز المرور غير صحيح. يرجى المحاولة مرة أخرى.' : 'Incorrect passcode. Please try again.');
        }
      }
    } catch (err) {
      setErrorMsg(isAr ? 'حدث خطأ أثناء فك التشفير.' : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Icon */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-teal-600 to-emerald-500 p-0.5 mx-auto shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                <Lock className="w-3 h-3" />
                <span>PBKDF2 + AES-256-GCM Vault</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAr ? 'بوابة الأمان وتشفير الحساب' : 'Security & Encryption Gate'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isSettingUp
                  ? (isAr ? 'قم بإنشاء رمز مرور شخصي قوي (Master PIN) لتشفير وحماية مفاتيح التداول وبياناتك الحساسة.' : 'Create a strong master passcode to encrypt and protect your broker credentials.')
                  : (isAr ? 'أدخل رمز المرور لفتح المنصة والوصول إلى محفظة التداول الحقيقية.' : 'Enter your master passcode to access the live trading terminal.')}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {isSettingUp ? (isAr ? 'إنشاء رمز المرور الرئيسي' : 'Create Master Passcode') : (isAr ? 'رمز المرور الرئيسي (Master PIN)' : 'Master Passcode')}
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder={isSettingUp ? (isAr ? 'أدخل 4 خانات أو أكثر' : 'Enter 4+ characters') : '••••••••'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest text-lg transition outline-none"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {isSettingUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  {isAr ? 'تأكيد رمز المرور' : 'Confirm Master Passcode'}
                </label>
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder={isAr ? 'أعد كتابة الرمز نفسه' : 'Re-enter passcode'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest text-lg transition outline-none"
                  required
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>
                {loading 
                  ? (isAr ? 'جارٍ التحقق وتفكيك التشفير...' : 'Decrypting Vault...') 
                  : (isSettingUp ? (isAr ? 'حفظ وتأمين المنصة' : 'Set & Encrypt Vault') : (isAr ? 'فتح المنصة' : 'Unlock Terminal'))}
              </span>
            </button>
          </form>

          {/* Security Status Footnote */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? 'التشفير اللحظي مشدد ونشط' : 'Zero-Knowledge Vault Active'}</span>
            </div>
            
            <div className="text-slate-500 text-[10px] flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? 'حماية مشددة ضد الاختراق' : 'Hardware PBKDF2'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
