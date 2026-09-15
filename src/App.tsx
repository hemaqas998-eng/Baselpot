import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { RadarScanner } from './components/RadarScanner';
import { LiveMonitorView } from './components/LiveMonitorView';
import { InteractiveChart } from './components/InteractiveChart';
import { LiveBrokerTradesView } from './components/LiveBrokerTradesView';
import { QuantitativeEngineView } from './components/QuantitativeEngineView';
import { MarketHoursClosuresView } from './components/MarketHoursClosuresView';
import { GeminiMasterCenter } from './components/GeminiMasterCenter';
import { LiquidityHeatmapHub } from './components/LiquidityHeatmapHub';
import { CryptoHubView } from './components/CryptoHubView';
import { TelegramCreatorHub } from './components/TelegramCreatorHub';
import { CloudAutonomyHub } from './components/CloudAutonomyHub';
import { SettingsView } from './components/SettingsView';
import { FloatingGeminiCopilot } from './components/FloatingGeminiCopilot';
import { SecurityLoginGate } from './components/SecurityLoginGate';
import { AdaptivePatternLearningModal } from './components/AdaptivePatternLearningModal';
import { securityVault } from './services/securityVaultService';
import { MarketSymbol, TradeSignal, PaperTrade, BotSettings, BotStatus } from './types';
import { indexedDb } from './services/indexedDbService';

// Canonical Tab Normalization for all bot views and external deep links
export function normalizeTabId(tabStr: string | null | undefined): string {
  if (!tabStr) return 'gemini-master';
  const t = tabStr.toLowerCase().trim();
  if (t === 'radar' || t === 'signals' || t === 'screener' || t === 'scanner' || t === 'scan') return 'radar';
  if (t === 'crypto' || t === 'crypto-hub' || t === 'coins' || t === 'cryptos' || t === 'top100') return 'crypto-hub';
  if (t === 'gemini-master' || t === 'ai' || t === 'gemini' || t === 'next-move' || t === 'dual-ai' || t === 'copilot' || t === 'gemini-insight' || t === 'master') return 'gemini-master';
  if (t === 'liquidity' || t === 'liquidity-heatmap' || t === 'heatmap' || t === 'orderbook' || t === 'depth') return 'liquidity-heatmap';
  if (t === 'live-trades' || t === 'paper-trades' || t === 'trades' || t === 'paper' || t === 'portfolio' || t === 'ledger' || t === 'positions' || t === 'broker') return 'live-trades';
  if (t === 'chart' || t === 'candlestick' || t === 'candles' || t === 'graph') return 'chart';
  if (t === 'quantitative' || t === 'quant' || t === 'kelly' || t === 'synergy') return 'quantitative';
  if (t === 'market-hours' || t === 'sessions' || t === 'hours' || t === 'closures' || t === 'holidays') return 'market-hours';
  if (t === 'cloud-autonomy' || t === 'cloud' || t === 'daemon' || t === 'autonomy' || t === '247') return 'cloud-autonomy';
  if (t === 'monitor' || t === 'logs' || t === 'terminal' || t === 'telemetry' || t === 'health') return 'monitor';
  if (t === 'telegram-creator' || t === 'telegram' || t === 'tma' || t === 'bot' || t === 'creator' || t === 'botfather') return 'telegram-creator';
  if (t === 'settings' || t === 'config' || t === 'setup' || t === 'api' || t === 'preferences') return 'settings';
  return 'gemini-master';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => securityVault.isUnlocked());
  const [activeTab, setActiveTab] = useState<string>('gemini-master');
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [symbols, setSymbols] = useState<MarketSymbol[]>([]);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [settings, setSettings] = useState<BotSettings>({
    isRunning: true,
    scanIntervalSeconds: 30,
    minConfidencePct: 75,
    minRiskReward: 1.5,
    autoTradePaper: true,
    riskPerTradePct: 1.5,
    accountBalance: 50,
    dailyProfitTargetMultiplier: 10,
    dailyProfitTargetUSD: 500,
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    discordWebhookUrl: '',
    discordEnabled: false,
    dataSource: 'HYBRID',
    trailingStopEnabled: true,
    trailingStopActivationPct: 50,
    soundAlerts: true,
    economicNewsFilter: true,
    activeSymbols: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'ETH/USD', 'SOL/USD', 'SPX500', 'NVDA', 'AAPL'],
    activeTimeframes: ['5m', '15m', '1h', '4h'],
    autoCloseEnabled: true,
    atrTpMultiplier: 2.5,
    atrSlMultiplier: 1.5,
    autoCloseOnOppositeSignal: true,
  });

  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string>('BTC/USD');
  const [selectedChartTimeframe, setSelectedChartTimeframe] = useState<string>('15m');
  const [selectedAiSignalId, setSelectedAiSignalId] = useState<string | undefined>(undefined);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [sendingTelegramId, setSendingTelegramId] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevSignalsCount = useRef(0);

  // Parse Telegram Mini App or Web direct URL parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const symbolParam = params.get('symbol');
      const signalParam = params.get('signal');
      
      if (tabParam) {
        setActiveTab(normalizeTabId(tabParam));
      }
      if (symbolParam) {
        setSelectedChartSymbol(symbolParam);
      }
      if (signalParam) {
        setSelectedAiSignalId(signalParam);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, []);

  // Play subtle web audio notification chime
  const playAlertSound = () => {
    if (!settings.soundAlerts) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Ignore audio restriction errors
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initial preload from deep IndexedDB storage on mount for instant rendering & offline resiliency
  useEffect(() => {
    async function loadCachedStateFromDb() {
      try {
        const [cachedSymbols, cachedSignals, cachedTrades, cachedSettings] = await Promise.all([
          indexedDb.getQuotes(),
          indexedDb.getSignals(),
          indexedDb.getTrades(),
          indexedDb.getAppState<BotSettings>('bot_settings')
        ]);
        if (cachedSymbols && cachedSymbols.length > 0) {
          setSymbols(cachedSymbols);
        }
        if (cachedSignals && cachedSignals.length > 0) {
          setSignals(cachedSignals);
        }
        if (cachedTrades && cachedTrades.length > 0) {
          setTrades(cachedTrades);
        }
        if (cachedSettings) {
          setSettings(cachedSettings);
        }
      } catch (err) {
        console.warn('IndexedDB preload error:', err);
      }
    }
    loadCachedStateFromDb();
  }, []);

  // Poll server state every 3 seconds & persist to deep IndexedDB
  const fetchAllData = async () => {
    try {
      const [statusRes, symbolsRes, signalsRes, tradesRes, settingsRes] = await Promise.all([
        fetch('/api/radar/status').then(r => r.json()),
        fetch('/api/radar/symbols').then(r => r.json()),
        fetch('/api/radar/signals').then(r => r.json()),
        fetch('/api/trades').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);

      if (statusRes.success) setStatus(statusRes.status);
      if (symbolsRes.success && Array.isArray(symbolsRes.symbols)) {
        setSymbols(symbolsRes.symbols);
        // Persist quotes to IndexedDB in background
        indexedDb.saveQuotes(symbolsRes.symbols).catch(() => {});
      }
      if (signalsRes.success && Array.isArray(signalsRes.signals)) {
        if (signalsRes.signals.length > prevSignalsCount.current && prevSignalsCount.current > 0) {
          playAlertSound();
          showToast('🎯 New high-confluence radar signal detected!');
        }
        prevSignalsCount.current = signalsRes.signals.length;
        setSignals(signalsRes.signals);
        // Persist signals to IndexedDB
        indexedDb.saveSignals(signalsRes.signals).catch(() => {});
      }
      if (tradesRes.success && Array.isArray(tradesRes.trades)) {
        setTrades(tradesRes.trades);
        // Persist paper trades to IndexedDB
        indexedDb.saveTrades(tradesRes.trades).catch(() => {});
      }
      if (settingsRes.success && settingsRes.settings) {
        setSettings(settingsRes.settings);
        // Persist settings to IndexedDB
        indexedDb.setAppState('bot_settings', settingsRes.settings).catch(() => {});
      }
    } catch (err) {
      console.warn('Error polling radar bot state (offline fallback active):', err);
      // Attempt to load from IndexedDB if network fetch fails
      try {
        const [offlineQuotes, offlineTrades] = await Promise.all([
          indexedDb.getQuotes(),
          indexedDb.getTrades()
        ]);
        if (offlineQuotes.length > 0) setSymbols(offlineQuotes);
        if (offlineTrades.length > 0) setTrades(offlineTrades);
      } catch {}
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Bot Toggle Handler
  const handleToggleBot = async () => {
    try {
      const res = await fetch('/api/radar/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning: !status?.isRunning })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => prev ? { ...prev, isRunning: data.isRunning } : null);
        showToast(data.isRunning ? '🚀 Bot scanner resumed!' : '⏸️ Bot scanner paused.');
      }
    } catch (err) {
      console.error('Failed to toggle bot:', err);
    }
  };

  // Immediate Scan Handler
  const handleScanNow = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/radar/scan-now', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Scan complete across ${data.scannedCount || 10} symbols!`);
        fetchAllData();
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Open Chart View
  const handleOpenChart = (symbol: string, timeframe: string = '1h') => {
    setSelectedChartSymbol(symbol);
    setSelectedChartTimeframe(timeframe);
    setActiveTab('chart');
  };

  // Open AI Analysis View
  const handleOpenAiAnalysis = (signal: TradeSignal) => {
    setSelectedAiSignalId(signal.id);
    setActiveTab('ai-next-move');
  };

  // Execute Paper Trade Manually from Scanner Card
  const handleExecuteTrade = async (signal: TradeSignal) => {
    showToast(`⚡ Order placed for ${signal.symbol} (${signal.direction})!`);
    fetchAllData();
    setActiveTab('paper-trades');
  };

  // Standalone Public App URL helper (avoids Google 401 error inside Telegram Mini App)
  const getPublicAppUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.includes('aistudio.google.com') || origin.includes('localhost')) {
        return 'https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app';
      }
      return origin;
    }
    return 'https://ais-pre-ig5aucyhdu6agw22f4z5tk-862942826820.europe-west2.run.app';
  };

  // Dispatch Signal to Telegram & Discord
  const handleSendTelegram = async (signal: TradeSignal) => {
    setSendingTelegramId(signal.id);
    try {
      const appUrl = getPublicAppUrl();
      const res = await fetch('/api/telegram/send-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId: signal.id, appUrl })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`📢 Signal broadcasted to Telegram & Discord!`);
        setSignals(prev => prev.map(s => s.id === signal.id ? { ...s, telegramSent: true, discordSent: true } : s));
      } else {
        showToast(`⚠️ Telegram error: ${data.error || 'Check bot token & chat ID'}`);
      }
    } catch (err) {
      console.error('Failed to dispatch alert:', err);
    } finally {
      setSendingTelegramId(null);
    }
  };

  // Test Telegram Connection
  const handleSendTestAlert = async () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const appUrl = getPublicAppUrl();
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          discordWebhookUrl: settings.discordWebhookUrl,
          appUrl,
        })
      });
      const data = await res.json();
      setTelegramTestResult(data);
      if (data.success) {
        showToast('✅ Test message sent successfully!');
      } else {
        showToast(`❌ Connection failed: ${data.error || data.message}`);
      }
    } catch (err: any) {
      setTelegramTestResult({ success: false, message: err.message });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Close Active Paper Trade
  const handleCloseTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/close`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Position closed at market price.`);
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to close trade:', err);
    }
  };

  // Update Global Settings
  const handleUpdateSettings = async (newSettings: Partial<BotSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 w-full max-w-full overflow-x-hidden">
      
      {/* Security Login & Hardware Encryption Gate */}
      {!isAuthenticated && (
        <SecurityLoginGate
          onAuthenticated={() => setIsAuthenticated(true)}
          language={settings.language || 'ar'}
        />
      )}

      {/* Top Navigation & Status Bar */}
      <Navbar
        status={status}
        symbols={symbols}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleBot={handleToggleBot}
        onScanNow={handleScanNow}
        isScanning={isScanning}
        soundEnabled={settings.soundAlerts}
        onToggleSound={() => handleUpdateSettings({ soundAlerts: !settings.soundAlerts })}
        onLock={() => {
          securityVault.lock();
          setIsAuthenticated(false);
        }}
        settings={settings}
        onOpenLearningModal={() => setIsLearningModalOpen(true)}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        
        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono font-bold flex items-center gap-2 animate-bounce">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab: Dedicated Crypto Top 100, Whale Accumulation & 5-Slot Continuous Scalping Hub */}
        {activeTab === 'crypto-hub' && (
          <CryptoHubView
            onOpenChart={handleOpenChart}
            showToast={showToast}
          />
        )}

        {/* Tab 1: Live Multi-Timeframe Radar Scanner & High-Impact Economic News */}
        {(activeTab === 'radar' || activeTab === 'scanner' || activeTab === 'signals') && (
          <RadarScanner
            signals={signals}
            symbols={symbols}
            status={status}
            onOpenChart={handleOpenChart}
            onOpenAiAnalysis={handleOpenAiAnalysis}
            onExecuteTrade={handleExecuteTrade}
            onSendTelegram={handleSendTelegram}
            sendingTelegramId={sendingTelegramId}
          />
        )}

        {/* Tab: Unified Gemini Master AI Screener & Intelligence Center (Supervised Live Radar Embedded) */}
        {(activeTab === 'gemini-master' || activeTab === 'gemini-insight' || activeTab === 'ai-next-move' || activeTab === 'copilot' || activeTab === 'dual-ai') && (
          <GeminiMasterCenter
            symbols={symbols}
            signals={signals}
            trades={trades}
            status={status}
            selectedSymbol={selectedChartSymbol}
            onSelectSymbol={(sym) => setSelectedChartSymbol(sym)}
            onOpenChart={handleOpenChart}
            onRefreshData={fetchAllData}
            accountBalance={settings.accountBalance}
            onOpenAiAnalysis={handleOpenAiAnalysis}
            onExecuteTrade={handleExecuteTrade}
            onSendTelegram={handleSendTelegram}
            sendingTelegramId={sendingTelegramId}
          />
        )}

        {/* Tab: Real-Time Institutional Liquidity Heatmap & Order Flow Hub */}
        {activeTab === 'liquidity-heatmap' && (
          <LiquidityHeatmapHub
            symbols={symbols}
            initialSymbol={selectedChartSymbol}
            onOpenChart={handleOpenChart}
            onRefreshData={fetchAllData}
          />
        )}

        {/* Tab 2: Bot Live Operations & Telemetry Monitor */}
        {activeTab === 'monitor' && (
          <LiveMonitorView
            status={status}
            symbols={symbols}
            signals={signals}
            trades={trades}
            settings={settings}
            onToggleBot={handleToggleBot}
            onScanNow={handleScanNow}
            isScanning={isScanning}
            onOpenChart={handleOpenChart}
            onOpenAiAnalysis={handleOpenAiAnalysis}
            showToast={showToast}
          />
        )}

        {/* Tab 3: Interactive Candlestick Chart */}
        {activeTab === 'chart' && (
          <InteractiveChart
            initialSymbol={selectedChartSymbol}
            initialTimeframe={selectedChartTimeframe}
            symbols={symbols}
            onRequestAiAnalysis={(sym, tf) => {
              const sig = signals.find(s => s.symbol === sym && s.timeframe === tf) || signals[0];
              if (sig) handleOpenAiAnalysis(sig);
            }}
          />
        )}

        {/* Tab 4: Live Real Broker Orders & Portfolio Ledger (Real Trades Only) */}
        {(activeTab === 'live-trades' || activeTab === 'paper-trades') && (
          <LiveBrokerTradesView
            trades={trades}
            status={status}
            settings={settings}
            onCloseTrade={handleCloseTrade}
            onOpenBrokerSettings={() => setActiveTab('settings')}
            language={settings.language || 'ar'}
          />
        )}

        {/* Tab 4.5: Quantitative & Institutional Algorithmic Engine */}
        {activeTab === 'quantitative' && (
          <QuantitativeEngineView
            settings={settings}
            paperTrades={trades}
            onUpdateSettings={handleUpdateSettings}
            onRefreshData={fetchAllData}
          />
        )}

        {/* Tab 4.8: Market Closures, Global Sessions, Holidays & Bot Guard */}
        {activeTab === 'market-hours' && (
          <MarketHoursClosuresView
            onSelectSymbolForChart={(sym) => {
              setSelectedChartSymbol(sym);
              setActiveTab('chart');
            }}
          />
        )}

        {/* Tab 4.9: 24/7 Autonomous Cloud Daemon & Remote Hub */}
        {activeTab === 'cloud-autonomy' && (
          <CloudAutonomyHub
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            language={settings.language || 'ar'}
          />
        )}

        {/* Tab 5: Unified Telegram Alerts & Mini App Creator Hub (Creator Only) */}
        {(activeTab === 'telegram-creator' || activeTab === 'telegram' || activeTab === 'tma') && (
          <TelegramCreatorHub
            settings={settings}
            status={status}
            signals={signals}
            onUpdateSettings={handleUpdateSettings}
            onSendTestAlert={handleSendTestAlert}
            onSendSignalAlert={handleSendTelegram}
            isTestingTelegram={isTestingTelegram}
            telegramTestResult={telegramTestResult}
            onOpenChart={handleOpenChart}
          />
        )}

        {/* Tab 7: Configuration & Strategy Tuning */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            symbols={symbols}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

      </main>

      {/* Modern Status Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 sm:px-8 text-xs font-mono text-slate-500 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              Engine: <strong className="text-slate-300">{status?.isRunning ? 'SCANNING ACTIVE' : 'PAUSED'}</strong>
            </span>
            <span>•</span>
            <span>Feed: <strong className="text-emerald-400">{status?.dataSource || 'HYBRID LIVE'}</strong></span>
            <span>•</span>
            <span>Sentiment: <strong className="text-amber-400">{status?.fearAndGreed?.sentiment || 'Neutral'} ({status?.fearAndGreed?.value ?? 60}/100)</strong></span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span>Next Scan: <strong className="text-emerald-400">{status?.nextScanSeconds ?? 30}s</strong></span>
            <span>•</span>
            <span>Gemini AI: <strong className="text-emerald-400">Online</strong></span>
          </div>
        </div>
      </footer>

      {/* Floating Autonomous Gemini Copilot (Root Bot Control & Quant Commander) */}
      <FloatingGeminiCopilot
        symbols={symbols}
        signals={signals}
        trades={trades}
        status={status}
        selectedSymbol={selectedChartSymbol}
        onOpenChart={handleOpenChart}
        onRefreshData={fetchAllData}
        accountBalance={settings.accountBalance}
      />

      {/* 🧠 Adaptive Pattern Learning, Trade Failure Dissection & Anti-Overfitting Suite */}
      <AdaptivePatternLearningModal
        isOpen={isLearningModalOpen}
        onClose={() => setIsLearningModalOpen(false)}
        recentTrades={trades}
        settings={settings}
      />

    </div>
  );
}
