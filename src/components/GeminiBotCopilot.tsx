import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  BarChart2, 
  Briefcase, 
  Terminal, 
  User, 
  Trash2,
  Lock,
  Compass,
  Flame,
  Activity,
  Sliders
} from 'lucide-react';
import { MarketSymbol, TradeSignal, PaperTrade, BotStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  executedActions?: Array<{
    toolName: string;
    description: string;
    params?: any;
    result?: any;
    timestamp: number;
  }>;
}

interface GeminiBotCopilotProps {
  symbols: MarketSymbol[];
  signals: TradeSignal[];
  trades?: PaperTrade[];
  status?: BotStatus | null;
  currentSymbol?: string;
  accountBalance?: number;
  onOpenChart?: (symbol: string, timeframe: string) => void;
  onRefreshData?: () => void;
  onSelectSignal?: (signal: TradeSignal) => void;
}

export const GeminiBotCopilot: React.FC<GeminiBotCopilotProps> = ({
  symbols,
  signals,
  trades = [],
  status,
  currentSymbol = 'XAU/USD',
  accountBalance = 25000,
  onOpenChart,
  onRefreshData,
  onSelectSignal
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Bot Owner Authentication Gatekeeper State
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('radar_bot_creator_token') === 'OWNER_VERIFIED_2026';
  });
  const [passcodeKey, setPasscodeKey] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthHelp, setShowAuthHelp] = useState<boolean>(false);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      content: isArabic
        ? `أهلاً بك يا منشئ ومدير البوت! معك **Gemini Autonomous Copilot**، كبير المتداولين والمدير التنفيذي للتحليل الكمي والتنفيذ المباشر. 👑⚡\n\n` +
          `لقد تم التحقق من هويتك كمنشئ للبوت وتم منحك الصلاحيات التنفيذية الكاملة غير المقيدة:\n` +
          `• 🧬 **التكامل الكمي والهندسي**: تفكيك الاستراتيجيات، تقييم هجين السيولة، وحساب اللوت بكسر كيلي (سقف 0.05 لوت أقصى).\n` +
          `• ⚡ **التنفيذ وإدارة الأوامر**: فتح صفقات، تعديل الأهداف، تأمين الأرباح، وسحب الوقف لنقطة الدخول (Break-Even).\n` +
          `• 🛡️ **تصفية الإشارات الخوارزمية**: فرز الإشارات وحل التعارض وتفعيل الصفقات المطابقة للبوت مباشرة.\n` +
          `• 🔍 **استكشاف الأخطاء والتشخيص**: فحص سجلات النظام، مراقبة الانزلاق السعري، وتصحيح أي شذوذ في التغذية السعرية.\n` +
          `• 🌐 **تحليل الماكرو والسيولة**: مراقبة مؤشر الدولار DXY وعوائد السندات وتدفقات الصناديق المؤسسية.\n\n` +
          `ما هي المهمة التي تود البدء بها الآن؟`
        : `Welcome, Bot Creator! I am your **Gemini Autonomous AI Execution Commander** and Chief Quantitative Strategist. 👑⚡\n\n` +
          `Your Creator credentials have been verified with unrestricted operational and execution access:\n` +
          `• 🧬 **Quantitative Synergy & Deconstruction**: Evaluate strategy hybrids, fractional Kelly sizing (capped ≤ 0.05 lot), and Wyckoff phases.\n` +
          `• ⚡ **Direct Execution & Order Routing**: Instant orders, dynamic trailing stop, and zero-loss profit locks.\n` +
          `• 🛡️ **Signal Reconciler & Conflict Resolver**: Algorithmic filtration and automated live bot injection.\n` +
          `• 🔍 **Deep Diagnostic & Troubleshooting**: Inspect error logs, execution latency, and slippage.\n` +
          `• 🌐 **Intermarket Macro Dynamics**: DXY, 10-Year Treasury Yields, and institutional volume flows.\n\n` +
          `How can I assist your trading desk right now?`,
      timestamp: Date.now()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState(currentSymbol);
  const [selectedLot, setSelectedLot] = useState(0.01);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOwnerAuthenticated) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOwnerAuthenticated]);

  const handleAuthenticateOwner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = passcodeKey.trim().toUpperCase();
    // Valid creator keys: MASTER KEY, CREATOR EMAIL or DEFAULT KEY
    if (
      cleanKey === 'OWNER_RADAR_2026' || 
      cleanKey === 'PAL.C88@GMAIL.COM' || 
      cleanKey === 'ADMIN' || 
      cleanKey === 'CREATOR' ||
      cleanKey === 'RADAR2026'
    ) {
      localStorage.setItem('radar_bot_creator_token', 'OWNER_VERIFIED_2026');
      setIsOwnerAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError(isArabic ? 'رمز المرور غير صحيح! يرجى إدخال مفتاح منشئ البوت المصرح به.' : 'Invalid Master Passcode. Please enter the authorized Bot Creator key.');
    }
  };

  const handleLogoutOwner = () => {
    localStorage.removeItem('radar_bot_creator_token');
    setIsOwnerAuthenticated(false);
    setPasscodeKey('');
  };

  // Suggested Interactive Prompts
  const quickPrompts = isArabic ? [
    { label: '🎯 صيد وتنفيذ صفقة قناص فورية', prompt: 'قم فوراً بصيد واقتناص أفضل فرصة تداول مؤسسية ونفذ فتح الصفقة في البوت فوراً مع تسليح حارس الأرباح ومنع الانعكاس بسقف 0.05 لوت.' },
    { label: '⚡ المحرك الكمي والهجين الموحد', prompt: 'قم بدمج التحليل الكمي وتفكيك الاستراتيجيات (ICT/SMC) وهجين السيولة وحساب لوت كيلي وتطبيقها على البوت في خطوة واحدة.' },
    { label: '🧬 التوافق الكمي وهجين الاستراتيجيات', prompt: 'افحص التوافق الكمي والهندسي (Quantitative Synergy) لزوج الذهب XAU/USD واحسب لوت كيلي الأمثل والهدف والوقف.' },
    { label: '🛡️ تصفية الإشارات وتفعيل الصفقات', prompt: 'قم بفرز وتصفية الإشارات النشطة واستبعاد أي تعارض وتفعيل الصفقات المتوافقة في البوت الآلي.' },
    { label: '🔒 تأمين الصفقات (Break-Even)', prompt: 'قم بمراجعة وتأمين كافة الصفقات المفتوحة وسحب الوقف لنقطة الدخول Break-Even لحمايتها من الانعكاس بدون خسارة.' },
    { label: '🔍 تشخيص واستكشاف أخطاء البوت', prompt: 'أجرِ فحصاً تشخيصياً شاملاً لحالة البوت وسجلات النظام وتأكد من جودة التنفيذ والانزلاق السعري وحل أي خطأ.' },
    { label: '🌐 تحليل الماكرو ومؤشر الدولار', prompt: 'ما هو التأثير اللحظي لمؤشر الدولار DXY وعوائد السندات الأمريكية US10Y على الذهب والعملات؟' },
    { label: '💰 إغلاق الصفقات الرابحة', prompt: 'أغلق جميع الصفقات الرابحة فوراً واحتفظ بالأرباح في المحفظة.' },
  ] : [
    { label: '🎯 Hunt & Auto-Execute Sniper', prompt: 'Instantly hunt the highest-conviction institutional setup and execute the order live with Zero-Loss Reversal Guard armed (max 0.05 lot).' },
    { label: '⚡ Unified Quant & Hybrid Engine', prompt: 'Merge Quantitative Analysis, Strategy Deconstruction (ICT/SMC), Kelly Sizing, and apply the winning hybrid directly to the bot in one step.' },
    { label: '🧬 Quantitative Synergy Matrix', prompt: 'Evaluate the Unified Quantitative Synergy and strategy deconstruction for XAU/USD with optimal fractional Kelly lot size.' },
    { label: '🛡️ Filter & Activate Signals', prompt: 'Filter active signals, discard directional conflicts, and activate high-conviction trades directly into the bot.' },
    { label: '🔒 Move to Break-Even (Zero-Loss)', prompt: 'Audit all active positions and trail stop loss to break-even to eliminate downside risk.' },
    { label: '🔍 Diagnose & Troubleshoot Bot', prompt: 'Run deep diagnostic troubleshooting on the bot logs, latency, and execution accuracy.' },
    { label: '🌐 Intermarket Macro Analysis', prompt: 'Analyze DXY Dollar Index, 10Y Yields, and macro institutional flow impact on assets.' },
    { label: '💰 Secure Profitable Trades', prompt: 'Close all open profitable positions and bank the realized gains.' },
  ];

  // Send message to Copilot API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);
    setLastActionStatus(null);

    try {
      // Build conversation payload for backend
      const payloadMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          currentSymbol: selectedPair
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const botReply: CopilotMessage = {
          id: `bot-${Date.now()}`,
          role: 'model',
          content: data.reply.content,
          executedActions: data.reply.executedActions,
          timestamp: data.reply.timestamp || Date.now()
        };

        setMessages(prev => [...prev, botReply]);

        // If tools were executed, trigger data refresh and set feedback
        if (data.reply.executedActions && data.reply.executedActions.length > 0) {
          const actionCount = data.reply.executedActions.length;
          setLastActionStatus(isArabic ? `⚡ تم تنفيذ ${actionCount} أمر تداول وإدارة بنجاح!` : `⚡ Executed ${actionCount} trading actions!`);
          if (onRefreshData) {
            setTimeout(onRefreshData, 600);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      console.error('Copilot Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: isArabic
            ? `⚠️ واجهت صعوبة في الاتصال المباشر، لكنني قمت بتأمين العمليات المحلية. يرجى تكرار طلبك.`
            : `⚠️ Experienced a momentary connection glitch, but local execution remains safeguarded. Please retry.`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Execution Short-cuts
  const handleQuickExecute = (direction: 'LONG' | 'SHORT') => {
    const dirText = direction === 'LONG' ? (isArabic ? 'شراء' : 'BUY') : (isArabic ? 'بيع' : 'SELL');
    const prompt = isArabic 
      ? `افتح صفقة ${dirText} فورية على ${selectedPair} بلوت ${selectedLot}.`
      : `Execute an immediate ${dirText} trade on ${selectedPair} with lot size ${selectedLot}.`;
    handleSendMessage(prompt);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: isArabic
          ? `تم مسح سجل المحادثة. أنا جاهز لأوامرك الجديدة! 🚀`
          : `Chat history cleared. Standing by for your next command! 🚀`,
        timestamp: Date.now()
      }
    ]);
  };

  const openTradesCount = trades.filter(t => t.status === 'OPEN').length;
  const currentSymbolData = symbols.find(s => s.symbol === selectedPair);

  // If user is a visitor and not the authenticated Bot Creator, display the Security Vault Guard screen
  if (!isOwnerAuthenticated) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Locked Header Icon */}
          <div className="text-center space-y-4">
            <div className="inline-flex relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-cyan-500/20 p-1 border border-amber-500/30 flex items-center justify-center shadow-xl shadow-amber-500/10">
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                  <Lock className="w-9 h-9 text-amber-400 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-rose-500 text-white rounded-full border-2 border-slate-950">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block">
                {isArabic ? '🔒 منطقة تحكم محظورة للمتصفحين' : '🔒 RESTRICTED CREATOR ACCESS'}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {isArabic ? 'بوابة تحكم Gemini Copilot — خاصة بمنشئ ومدير البوت فقط' : 'Gemini Copilot — Bot Creator Exclusive Access'}
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                {isArabic
                  ? 'تتضمن واجهة Gemini Copilot صلاحيات تنفيذ مالي مباشر، وتعديل إعدادات التداول الآلي، وإدارة صفقات المحفظة الحقيقية، واستكشاف أخطاء السيرفر. لحماية أمان واستقرار المنصة، تم إغلاق هذه الميزة عن الزوار والمتصفحين.'
                  : 'Gemini Copilot possesses autonomous order routing, quantitative algorithm deconstruction, live position management, and system-level diagnostics. To protect asset security, access is strictly reserved for the verified Bot Creator.'}
              </p>
            </div>
          </div>

          {/* Passcode Unlock Form */}
          <div className="max-w-md mx-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-inner">
            <form onSubmit={handleAuthenticateOwner} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{isArabic ? 'مفتاح المرور السري لمنشئ البوت (Master Key):' : 'Creator Master Passcode / Email:'}</span>
                  <button
                    type="button"
                    onClick={() => setShowAuthHelp(!showAuthHelp)}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    {isArabic ? 'مساعدة المنشئ 💡' : 'Creator Hint 💡'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passcodeKey}
                    onChange={(e) => setPasscodeKey(e.target.value)}
                    placeholder={isArabic ? 'أدخل الرمز السري أو بريد المنشئ...' : 'Enter Master key or Creator ID...'}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono transition"
                    autoFocus
                  />
                </div>
                {authError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {authError}
                  </p>
                )}
              </div>

              {showAuthHelp && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
                  <div className="text-emerald-400 font-bold">{isArabic ? 'مفتاح منشئ المنصة الافتراضي:' : 'Default Creator Passcode:'}</div>
                  <div>• Key: <span className="text-white font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">OWNER_RADAR_2026</span></div>
                  <div>• Email: <span className="text-white font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">pal.c88@gmail.com</span></div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                {isArabic ? 'التحقق وفتح الصلاحيات الكاملة' : 'Verify & Unlock Unrestricted Access'}
              </button>

              {/* Instant Demo/Creator Bypass */}
              <button
                type="button"
                onClick={() => {
                  setPasscodeKey('OWNER_RADAR_2026');
                  localStorage.setItem('radar_bot_creator_token', 'OWNER_VERIFIED_2026');
                  setIsOwnerAuthenticated(true);
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {isArabic ? 'الدخول السريع كمنشئ البوت (One-Click Owner Login)' : 'One-Click Owner Demo Login'}
              </button>
            </form>
          </div>

          {/* Visitor Information Note */}
          <div className="border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500 max-w-lg mx-auto">
            {isArabic
              ? 'إذا كنت زائراً أو متصفحاً، يمكنك متابعة كافة الإشارات الحية ومصفوفة الترابط والتحليلات عبر باقي أقسام المنصة بدون قيود.'
              : 'Visitors can still monitor real-time signals, intermarket macro feeds, and live chart radar freely through the public tabs.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full overflow-hidden">
      
      {/* Left / Main Column: AI Copilot Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[640px] max-h-[820px]">
        
        {/* Chat Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">Gemini Trading Copilot</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  👑 {isArabic ? 'منشئ البوت (Verified Owner)' : 'CREATOR VERIFIED'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  UNLIMITED AUTONOMY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isArabic ? 'كبير المتداولين الكميين • تحكم تنفيذي كامل • إدارة أخطاء وأوامر حية' : 'Chief Quantitative Trader • Full Execution Autonomy • Live Diagnostics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogoutOwner}
              title={isArabic ? 'قفل والخروج من وضع المنشئ' : 'Lock / Sign Out'}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'قفل' : 'Lock'}</span>
            </button>
            <button
              onClick={handleClearHistory}
              title={isArabic ? 'مسح المحادثة' : 'Clear History'}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Status Banner */}
        {lastActionStatus && (
          <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {lastActionStatus}
            </span>
            <button 
              onClick={() => setLastActionStatus(null)}
              className="text-emerald-400/60 hover:text-emerald-300 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Chat Messages Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                  }`}>
                    {msg.content}
                  </div>

                  {/* Executed Tools / Function Calling Badges */}
                  {msg.executedActions && msg.executedActions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.executedActions.map((act, idx) => (
                        <div 
                          key={idx}
                          className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 text-xs space-y-1.5 shadow-md"
                        >
                          <div className="flex items-center justify-between text-emerald-400 font-mono font-bold">
                            <span className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              Tool Executed: <span className="text-white">{act.toolName}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(act.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="text-slate-300 text-xs">
                            {act.description}
                          </div>

                          {act.result && act.result.trade && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] grid grid-cols-2 gap-2 text-slate-300">
                              <div>Symbol: <strong className="text-white">{act.result.trade.symbol}</strong></div>
                              <div>Type: <strong className={act.result.trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>{act.result.trade.direction}</strong></div>
                              <div>Entry: <strong className="text-white">${act.result.trade.entryPrice}</strong></div>
                              <div>Lot: <strong className="text-white">{act.result.trade.lotSize}</strong></div>
                              <div>SL: <strong className="text-rose-400">${act.result.trade.stopLoss}</strong></div>
                              <div>TP1: <strong className="text-emerald-400">${act.result.trade.takeProfit1}</strong></div>
                            </div>
                          )}

                          {act.params?.symbol && onOpenChart && (
                            <div className="pt-1 flex items-center gap-2">
                              <button
                                onClick={() => onOpenChart(act.params.symbol, '15m')}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] flex items-center gap-1 font-mono transition"
                              >
                                <BarChart2 className="w-3 h-3 text-emerald-400" />
                                {isArabic ? `عرض شارت ${act.params.symbol}` : `View ${act.params.symbol} Chart`}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono block px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none text-xs text-slate-400 font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>{isArabic ? 'جاري التحليل واستدعاء دوال التداول...' : 'Analyzing market data & invoking trading functions...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isArabic ? 'تحدث مع جيمناي.. مثلاً: "افحص الذهب وافتح صفقة شراء" أو "أغلق الصفقات الرابحة"...' : 'Talk with Gemini.. e.g. "Scan gold and open buy 0.01 lot" or "Close profitable trades"...'}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50 font-sans"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <span>{isArabic ? 'إرسال' : 'Send'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Right Column: Instant Execution Deck & Tactical Control Center */}
      <div className="w-full lg:w-80 space-y-5 shrink-0">
        
        {/* Instant Order Pad for Copilot */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {isArabic ? 'لوحة الأوامر المباشرة' : 'Direct Execution Pad'}
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              FAST ORDER
            </span>
          </div>

          {/* Symbol Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono">{isArabic ? 'الرمز المحدد:' : 'Selected Symbol:'}</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              {symbols.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - ${s.price} ({s.change24h > 0 ? '+' : ''}{s.change24h}%)
                </option>
              ))}
            </select>
          </div>

          {/* Lot Size Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">{isArabic ? 'حجم اللوت:' : 'Lot Size:'}</span>
              <span className="text-emerald-400 font-bold">{selectedLot} Lot</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.01, 0.05, 0.10, 0.50].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelectedLot(l)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    selectedLot === l 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Live Symbol Snapshot */}
          {currentSymbolData && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Price:</span>
                <span className="text-white font-bold">${currentSymbolData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">24h Change:</span>
                <span className={currentSymbolData.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {currentSymbolData.change24h > 0 ? '+' : ''}{currentSymbolData.change24h}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spread:</span>
                <span className="text-slate-300">{currentSymbolData.spread} pips</span>
              </div>
            </div>
          )}

          {/* Direct Buy / Sell Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleQuickExecute('LONG')}
              disabled={isLoading}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>BUY {selectedPair.split('/')[0]}</span>
              </div>
              <span className="text-[10px] font-mono opacity-90">{selectedLot} Lot</span>
            </button>

            <button
              onClick={() => handleQuickExecute('SHORT')}
              disabled={isLoading}
              className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>SELL {selectedPair.split('/')[0]}</span>
              </div>
              <span className="text-[10px] font-mono opacity-90">{selectedLot} Lot</span>
            </button>
          </div>
        </div>

        {/* Quick Position Management Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isArabic ? 'إدارة المخاطر السريعة' : 'Tactical Risk Safeguards'}
            </h4>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              {openTradesCount} Active
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSendMessage(isArabic ? 'قم فوراً بصيد واقتناص أفضل فرصة تداول مؤسسية ونفذ فتح الصفقة في البوت فوراً مع تسليح حارس الأرباح ومنع الانعكاس بسقف 0.05 لوت.' : 'Instantly hunt the highest-conviction institutional setup and execute the order live with Zero-Loss Reversal Guard armed (max 0.05 lot).')}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-between transition disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                {isArabic ? '🎯 صيد وتنفيذ صفقة قناص' : '🎯 Sniper Trade Hunter'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Auto Open</span>
            </button>

            <button
              onClick={() => handleSendMessage(isArabic ? 'قم بدمج التحليل الكمي وتفكيك الاستراتيجيات (ICT/SMC) وهجين السيولة وحساب لوت كيلي وتطبيقها على البوت في خطوة واحدة.' : 'Merge Quantitative Analysis, Strategy Deconstruction (ICT/SMC), Kelly Sizing, and apply the winning hybrid directly to the bot in one step.')}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-teal-500/20 hover:from-indigo-500/30 hover:to-teal-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center justify-between transition disabled:opacity-40 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                {isArabic ? '⚡ المحرك الكمي والهجين' : '⚡ Unified Quant Engine'}
              </span>
              <span className="text-[10px] font-mono text-indigo-300 font-bold">4-in-1</span>
            </button>

            <button
              onClick={() => handleSendMessage(isArabic ? 'قم بتأمين الأرباح ونقل وقف الخسارة لنقطة الدخول Break-Even لجميع الصفقات المفتوحة.' : 'Trail all open positions to Break-Even immediately.')}
              disabled={isLoading || openTradesCount === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50 text-xs font-medium flex items-center justify-between transition disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                {isArabic ? 'تأمين الوقف (Break-Even)' : 'Trail to Break-Even'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">SL → Entry</span>
            </button>

            <button
              onClick={() => handleSendMessage(isArabic ? 'أغلق جميع الصفقات الرابحة واحتفظ بالأرباح في المحفظة.' : 'Close all currently profitable positions.')}
              disabled={isLoading || openTradesCount === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center justify-between transition disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                {isArabic ? 'إغلاق الصفقات الرابحة' : 'Bank Profitable Trades'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Secure Gains</span>
            </button>

            <button
              onClick={() => handleSendMessage(isArabic ? 'أجرِ فحصاً رادارياً فورياً للسوق وأظهر لي أقوى الإشارات.' : 'Run a full radar market scan across all pairs.')}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-teal-500/50 text-xs font-medium flex items-center justify-between transition disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-teal-400" />
                {isArabic ? 'مسح راداري فوري' : 'Instant Radar Scan'}
              </span>
              <span className="text-[10px] font-mono text-teal-400">Scan Now</span>
            </button>
          </div>
        </div>

        {/* Portfolio Live Snapshot */}
        {status && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5 text-xs font-mono">
            <div className="text-slate-400 font-sans font-bold flex items-center justify-between">
              <span>{isArabic ? 'ملخص الأداء المباشر' : 'Live Bot Telemetry'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Balance:</div>
                <div className="font-bold text-white">${accountBalance.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Win Rate:</div>
                <div className="font-bold text-emerald-400">{status.winRatePct}%</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Net PnL:</div>
                <div className={`font-bold ${status.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {status.totalPnL >= 0 ? '+' : ''}${status.totalPnL.toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Sentiment:</div>
                <div className="font-bold text-amber-400">{status.fearAndGreed.value}/100</div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
