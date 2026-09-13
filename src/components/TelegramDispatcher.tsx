import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Radio, 
  Bot, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  MessageSquare,
  Zap,
  Info,
  Smartphone,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { TradeSignal, BotSettings } from '../types';

interface TelegramDispatcherProps {
  settings: BotSettings;
  signals: TradeSignal[];
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  onSendTestAlert: () => Promise<void>;
  onSendSignalAlert: (signal: TradeSignal) => Promise<void>;
  isTestingTelegram: boolean;
  telegramTestResult: { success: boolean; message?: string } | null;
  onOpenMiniAppTab?: () => void;
}

export const TelegramDispatcher: React.FC<TelegramDispatcherProps> = ({
  settings,
  signals,
  onUpdateSettings,
  onSendTestAlert,
  onSendSignalAlert,
  isTestingTelegram,
  telegramTestResult,
  onOpenMiniAppTab,
}) => {
  const [tokenInput, setTokenInput] = useState(settings.telegramBotToken);
  const [chatIdInput, setChatIdInput] = useState(settings.telegramChatId);
  const [copied, setCopied] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string>(signals[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [pingStatus, setPingStatus] = useState<{
    status: 'checking' | 'connected' | 'error' | 'not_configured';
    bot?: { id: number; username: string; firstName: string; canJoinGroups?: boolean };
    latencyMs?: number;
    error?: string;
    lastChecked?: number;
  }>({ status: 'checking' });
  const [isPinging, setIsPinging] = useState(false);

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
      } else {
        setPingStatus({
          status: 'error',
          error: data.error || 'Failed to authenticate bot token with Telegram API',
          latencyMs: latency,
          lastChecked: Date.now()
        });
      }
    } catch (err: any) {
      setPingStatus({
        status: 'error',
        error: err.message || 'Network timeout contacting Telegram API',
        latencyMs: Date.now() - start,
        lastChecked: Date.now()
      });
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkTelegramPing();
    const interval = setInterval(checkTelegramPing, 20000);
    return () => clearInterval(interval);
  }, [settings.telegramBotToken]);

  const sampleSignal = signals.find(s => s.id === selectedSignalId) || signals[0];

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    onUpdateSettings({
      telegramBotToken: tokenInput.trim(),
      telegramChatId: chatIdInput.trim(),
      telegramEnabled: true,
    });
    setTimeout(() => {
      setIsSaving(false);
      checkTelegramPing();
    }, 500);
  };

  const handleCopySample = () => {
    if (!sampleSignal) return;
    const text = `🎯 MARKET RADAR SIGNAL\nAsset: ${sampleSignal.symbol} (${sampleSignal.direction})\nPattern: ${sampleSignal.pattern.name}\nEntry: ${sampleSignal.entryPrice}\nSL: ${sampleSignal.stopLoss}\nTP1: ${sampleSignal.takeProfit1}\nTP2: ${sampleSignal.takeProfit2}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Real-time Status Indicator with Background Ping */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            pingStatus.status === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : pingStatus.status === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}>
            {pingStatus.status === 'connected' ? (
              <Wifi className="w-6 h-6 animate-pulse text-emerald-400" />
            ) : pingStatus.status === 'error' ? (
              <WifiOff className="w-6 h-6 text-rose-400" />
            ) : (
              <Bot className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Telegram Signal Bot Dispatcher
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                pingStatus.status === 'connected'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : pingStatus.status === 'error'
                  ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  pingStatus.status === 'connected' ? 'bg-emerald-400 animate-ping' : pingStatus.status === 'error' ? 'bg-rose-400' : 'bg-slate-500'
                }`} />
                {pingStatus.status === 'connected' ? `ONLINE (@${pingStatus.bot?.username})` : pingStatus.status === 'error' ? 'CONNECTION ERROR' : 'STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              {pingStatus.status === 'connected' ? (
                <>
                  <span className="text-emerald-400">Ping: {pingStatus.latencyMs}ms</span>
                  <span>•</span>
                  <span>ID: {pingStatus.bot?.id}</span>
                  <span>•</span>
                  <span>Name: {pingStatus.bot?.firstName}</span>
                </>
              ) : pingStatus.status === 'error' ? (
                <span className="text-rose-400">{pingStatus.error}</span>
              ) : (
                <span>Add bot token below to verify live communication with Telegram API.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={checkTelegramPing}
            disabled={isPinging}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Refresh Ping Status"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          <button
            onClick={onSendTestAlert}
            disabled={isTestingTelegram}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-sky-600/30 disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isTestingTelegram ? 'animate-spin' : ''}`} />
            <span>{isTestingTelegram ? 'Sending Test...' : 'Send Test Ping'}</span>
          </button>
        </div>
      </div>

      {/* Critical Setup Tips for Telegram Channels */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 space-y-1.5 font-mono">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>تنبيه هام لإرسال التنبيهات إلى القنوات والمجموعات (Telegram Channel Delivery):</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-300 font-sans text-xs">
          <li>يجب إضافة البوت كـ <strong>مسؤول (Admin)</strong> في القناة مع صلاحية "نشر الرسائل" (Post Messages).</li>
          <li>معرف القنوات الخاصة يبدأ دائماً بـ <code className="text-amber-300 font-mono font-bold">-100</code> (مثال: <code className="text-amber-300 font-mono font-bold">-1001928374650</code>).</li>
          <li>للقنوات العامة، يمكنك استخدام المعرف المباشر مثل: <code className="text-amber-300 font-mono font-bold">@MyTradingChannel</code>.</li>
        </ul>
      </div>

      {/* TMA Quick Integration Promo Card */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Telegram Mini App (TMA) Integration
              <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded">NEW</span>
            </h4>
            <p className="text-xs text-slate-300">
              Launch Market Radar directly inside Telegram chats, channels, or via your bot's Menu Button.
            </p>
          </div>
        </div>

        {onOpenMiniAppTab && (
          <button
            onClick={onOpenMiniAppTab}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-sky-600/20"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open TMA Connector & Guide →</span>
          </button>
        )}
      </div>

      {telegramTestResult && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 border ${
          telegramTestResult.success 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
        }`}>
          {telegramTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{telegramTestResult.message || (telegramTestResult.success ? 'Telegram connection test passed!' : 'Failed to reach Telegram API.')}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Credentials Form & Bot Setup Guide (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Credentials Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-sky-400" />
              Bot Credentials & Channel Config
            </h3>

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Telegram Bot Token:
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Telegram Chat ID / Channel Username:
                </label>
                <input
                  type="text"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder="e.g. 987654321 or @my_vip_signals_channel"
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.telegramEnabled}
                    onChange={(e) => onUpdateSettings({ telegramEnabled: e.target.checked })}
                    className="accent-sky-500 w-4 h-4"
                  />
                  <span>Enable Automated Broadcasts</span>
                </label>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-sm"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* 3-Step Setup Guide */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              Quick 2-Minute Telegram Bot Guide
            </h4>

            <ol className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px] border border-sky-500/40">
                  1
                </span>
                <span>
                  Open Telegram and search for <code className="text-sky-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded">@BotFather</code>. Send <code className="text-sky-300 bg-slate-950 px-1 rounded">/newbot</code> and copy your token.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px] border border-sky-500/40">
                  2
                </span>
                <span>
                  To get your Chat ID, message <code className="text-sky-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded">@userinfobot</code> or add your bot as admin in your channel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px] border border-sky-500/40">
                  3
                </span>
                <span>
                  Paste the credentials above, click "Save Settings", then press "Send Test Ping".
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Col: Live Telegram Message Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              Telegram Message Bubble Preview
            </h3>

            <button
              onClick={handleCopySample}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Telegram App Mock Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 relative shadow-inner">
            
            {/* Telegram Header Ribbon */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-900 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-500 flex items-center justify-center text-slate-950 font-extrabold text-xs">
                MR
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Market Radar Alerts</h4>
                <span className="text-[10px] text-sky-400 font-mono">bot • private service</span>
              </div>
            </div>

            {/* Telegram Message Bubble */}
            {sampleSignal && (
              <div className="bg-[#182533] border border-slate-800 text-slate-100 rounded-2xl p-4 text-xs font-mono space-y-3 shadow-md">
                
                <div className="text-sm font-bold text-sky-300 flex items-center gap-1.5">
                  🎯 MARKET RADAR SIGNAL DETECTED
                </div>

                <div className="space-y-1">
                  <div><strong>Asset:</strong> <code className="bg-slate-900/80 px-1 py-0.5 rounded text-white">{sampleSignal.symbol}</code> • <strong>TF:</strong> <code className="bg-slate-900/80 px-1 py-0.5 rounded text-white">{sampleSignal.timeframe}</code></div>
                  <div><strong>Action:</strong> {sampleSignal.direction === 'LONG' ? '🟢 📈 LONG BUY' : '🔴 📉 SHORT SELL'}</div>
                  <div><strong>Pattern:</strong> {sampleSignal.pattern.name}</div>
                  <div><strong>Confidence:</strong> {sampleSignal.confidence}% (⭐⭐⭐⭐)</div>
                  <div><strong>Risk/Reward:</strong> 1:{sampleSignal.riskRewardRatio} • <strong>Confluence:</strong> {sampleSignal.confluenceScore}%</div>
                </div>

                <div className="py-2 border-y border-slate-700/60 space-y-1">
                  <div className="text-slate-200">📍 <strong>Entry Price:</strong> ${sampleSignal.entryPrice}</div>
                  <div className="text-rose-400">🛑 <strong>Stop Loss:</strong> ${sampleSignal.stopLoss}</div>
                  <div className="text-emerald-400">🎯 <strong>Take Profit 1:</strong> ${sampleSignal.takeProfit1}</div>
                  <div className="text-teal-400">🎯 <strong>Take Profit 2:</strong> ${sampleSignal.takeProfit2}</div>
                </div>

                {sampleSignal.aiAnalysis && (
                  <div className="text-[11px] text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Next Move Trade Plan
                    </div>
                    <div>• <strong>Bias:</strong> {sampleSignal.aiAnalysis.marketBias}</div>
                    <div>• <strong>Summary:</strong> {sampleSignal.aiAnalysis.summary}</div>
                    <div>• <strong>Invalidation:</strong> {sampleSignal.aiAnalysis.invalidationTrigger}</div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>🤖 Radar Bot Automated Signals</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}

            {/* Quick Broadcast Button */}
            {sampleSignal && (
              <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => onSendSignalAlert(sampleSignal)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast this Signal Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
