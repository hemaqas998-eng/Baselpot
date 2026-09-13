export type AssetClass = 'forex' | 'crypto' | 'commodity' | 'indices' | 'stock';

export type MarketDataSource = 'SIMULATED' | 'BINANCE_LIVE' | 'HYBRID' | 'WEBSOCKET_LIVE';

export interface MarketSymbol {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  category?: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  digits: number;
  pipSize: number;
  spread: number;
  currency?: string;
  baseAsset?: string;
  source?: string;
  lastUpdated: number;
  formattedDate?: string;
  formattedTime?: string;
  dayName?: string;
  isLive?: boolean;
  isTradeable?: boolean; // false for market indices used strictly as macro compass / barometers
  macroRole?: 'INDICATOR_ONLY' | 'TRADEABLE_ASSET';
  isVolatilitySpike?: boolean;
  volatilityRatio?: number; // e.g. 2.4x standard ATR
  volatilityStatus?: 'NORMAL' | 'ELEVATED' | 'SPIKE_HALT';
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface VolumeProfileBar {
  priceLevel: number;
  volume: number;
  isPoc: boolean;
}

export interface TechnicalIndicators {
  rsi: number;
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: 'BULLISH' | 'BEARISH' | 'NONE';
  };
  ema20: number;
  ema50: number;
  ema200: number;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr: number;
  supportLevels: number[];
  resistanceLevels: number[];
  adx: number;
  pivotPoints?: PivotPoints;
  volumeProfile?: VolumeProfileBar[];
}

export type SignalDirection = 'LONG' | 'SHORT';
export type SignalStatus = 'ACTIVE' | 'TRIGGERED' | 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'EXPIRED';

export interface SignalPattern {
  name: string;
  type: 'CONTINUATION' | 'REVERSAL' | 'BREAKOUT' | 'LIQUIDITY_SWEEP' | 'FVG';
  timeframe: string;
  confidence: number; // 0-100%
  description: string;
}

export interface MultiTimeframeCascade {
  htf: {
    timeframe: '4h' | '1d' | '1h';
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    keyLevel: number;
    structure: 'ORDER_BLOCK' | 'LIQUIDITY_SWEEP' | 'MACRO_TREND' | 'FAIR_VALUE_GAP';
    descArabic: string;
  };
  itf: {
    timeframe: '1h' | '15m' | '30m';
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    structureShift: 'MSS_CONFIRMED' | 'CHoCH' | 'FVG_EXPANSION' | 'CONSOLIDATION';
    descArabic: string;
  };
  ltf: {
    timeframe: '5m' | '1m' | '15m';
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    trigger: 'ORDER_BLOCK_RETEST' | 'LIQUIDITY_PURGE' | 'MOMENTUM_IGNITION' | 'FVG_TAP';
    entryConfirmation: boolean;
    descArabic: string;
  };
  cascadeAlignmentScore: number; // 0-100%
  alignmentStatus: 'PERFECT_CASCADE' | 'STRONG_CASCADE' | 'PARTIAL_CASCADE';
  cascadeSummaryArabic: string;
}

export interface SignalNewsImpact {
  hasImpact: boolean;
  highestImpact: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  closestEventTitle?: string;
  closestEventCurrency?: string;
  scheduledTime?: number;
  minutesUntilEvent?: number | null;
  volatilityRisk: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  invalidationWarning: string;
  actionableGuidance: string;
  forecast?: string;
  previous?: string;
}

export interface TradeSignal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  tradeType?: 'SCALP' | 'SWING' | 'DAILY_SWING';
  tradeTypeExplanation?: string;
  targetHoldingHorizon?: string;
  timeframeCascade?: MultiTimeframeCascade;
  pattern: SignalPattern;
  confidence: number; // 0-100%
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  confluenceScore: number; // 0-100%
  confluenceFactors: string[];
  status: SignalStatus;
  createdAt: number;
  expiresAt: number;
  currentPrice: number;
  pnlPct?: number;
  newsImpact?: SignalNewsImpact;
  volatilitySpikeWarning?: boolean | {
    isSpike: boolean;
    atrRatio: number;
    threshold: number;
    severity: string;
    message: string;
  };
  earlyInvalidation?: {
    detected: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
    timeframe: string;
    suggestedAction: string;
    timestamp: number;
  };
  intermarketConfluence?: {
    macroRegime?: string;
    macroBias: 'ALIGNED' | 'CONFLICT' | 'NEUTRAL';
    confluenceScoreDelta?: number;
    driverNotes?: string;
    dxyTrend?: string;
    us10yTrend?: string;
    macroFactor?: string;
    confluenceBoostPct?: number;
  };
  liquidityConfluence?: {
    orderBookImbalanceRatio: number; // 0-1
    dominantWallSide: 'BUY_WALL' | 'SELL_WALL' | 'BALANCED';
    dominantWallPrice: number;
    nearestLongLiqPool?: number;
    nearestShortLiqPool?: number;
    gravityPull: 'PULL_UP_TO_SHORTS' | 'PULL_DOWN_TO_LONGS' | 'EQUILIBRIUM';
    icebergStopLossShelter?: number;
    antiSpoofingScore: number;
    summaryArabic: string;
  };
  smartLimitPrice?: number;
  signalTtlMinutes?: number;
  aiAnalysis?: {
    summary: string;
    marketBias: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    rationales: string[];
    invalidationTrigger: string;
    riskRecommendation: string;
    keyLevelsNote: string;
    expectedMoveTimeframe: string;
    fearGreedConfluence?: string;
  };
  telegramSent: boolean;
  telegramMessageId?: string;
  discordSent?: boolean;
}

export interface LiveTrade {
  id: string;
  signalId: string;
  symbol: string;
  direction: SignalDirection;
  tradeType?: 'SCALP' | 'SWING' | 'DAILY_SWING';
  tradeTypeExplanation?: string;
  timeframeCascade?: MultiTimeframeCascade;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3?: number;
  status: 'OPEN' | 'CLOSED';
  pnl: number;
  pnlPercentage: number;
  openedAt: number;
  closedAt?: number;
  closeReason?: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'MANUAL' | 'TRAILING_SL' | 'AUTO_CLOSE_ATR' | 'AUTO_CLOSE_REVERSAL' | 'AUTO_CLOSE_REVERSAL_PROFIT_LOCK' | 'PARTIAL_TP1_BE';
  trailingStopActive?: boolean;
  peakPrice?: number;
  riskRewardRatio?: number;
  atr?: number;
  atrTpMultiplier?: number;
  atrSlMultiplier?: number;
  // --- Partial Close & Multi-Target Engine ---
  isPartialClosed?: boolean;
  partialCloseLotSize?: number;
  partialCloseRealizedPnL?: number;
  initialLotSize?: number;
  tp1HitTimestamp?: number;
  newsShieldProtected?: boolean;
  // --- Dynamic ATR Trailing & Profit Lock ---
  atrTrailingMultiplier?: number; // e.g. 1.5x ATR trailing buffer
  currentTrailingSlPrice?: number;
  lockedProfitUSD?: number;
  lockedProfitPct?: number;
  // --- Spread & Net Fee Deduction Engine ---
  spreadPips?: number;
  spreadCostUSD?: number;
  brokerCommissionUSD?: number;
  grossPnL?: number;
  netPnL?: number;
  isNetProfitGuaranteed?: boolean;
  spreadCushionPrice?: number;
  // --- Slippage & Execution Quality ---
  intendedEntryPrice?: number;
  actualFillPrice?: number;
  slippagePoints?: number;
  slippageUSD?: number;
  executionLatencyMs?: number;
  executionQualityGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  // --- Live Broker Integration & Execution ---
  brokerTicketId?: string;
  liveExecutionStatus?: 'DISPATCHED_TO_BROKER' | 'FILLED_LIVE' | 'REJECTED_BY_BROKER' | 'CLOSED_LIVE';
  brokerPlatform?: 'METATRADER_5' | 'METATRADER_4' | 'BINANCE' | 'BYBIT' | 'DIRECT' | 'TRADINGVIEW_CUSTOM';
  // --- Anti-Stale & Price Freshness Guard Metadata ---
  priceSource?: string;
  lastPriceTimestamp?: number;
  priceFreshnessLatencyMs?: number;
  isPriceFresh?: boolean;
  stalenessAgeMs?: number;
  stalenessPauseCount?: number;
  // --- Early Invalidation ---
  earlyInvalidation?: {
    detected: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
    suggestedAction: string;
    timestamp: number;
  };
}

export type PaperTrade = LiveTrade;

export interface EconomicCalendarEvent {
  id: string;
  title: string;
  currency: string;
  country?: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledTime: number;
  forecast: string;
  previous: string;
  actual?: string;
  actualSurprise?: 'POSITIVE' | 'NEGATIVE' | 'IN_LINE' | 'PENDING' | 'BEAT' | 'MISS';
  unit?: string;
  timeUTC?: string;
  date?: string;
  source?: string;
  affectedSymbols: string[];
  description?: string;
  volatilityExpectation?: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  directionalBiasHint?: {
    ifHigherThanForecast: string;
    ifLowerThanForecast: string;
  };
}

export interface FearAndGreedData {
  value: number;
  sentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  lastUpdated: number;
  btcPrice: number;
}

export interface ChartDrawingToolItem {
  id: string;
  type: 'TRENDLINE' | 'HORIZONTAL' | 'FIBONACCI' | 'RECTANGLE';
  points: { x: number; y: number; price?: number; time?: number }[];
  color: string;
  label?: string;
}

export interface BotSettings {
  isRunning: boolean;
  scanIntervalSeconds: number;
  minConfidencePct: number;
  minRiskReward: number;
  autoTradeLive?: boolean;
  autoTradePaper?: boolean;
  lotSize?: number;
  riskPerTradePct: number;
  accountBalance: number;
  dailyProfitTargetMultiplier?: number; // e.g. 10x capital ($50 -> $500 target)
  dailyProfitTargetUSD?: number; // e.g. $500.00
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  discordWebhookUrl?: string;
  discordEnabled?: boolean;
  dataSource: MarketDataSource;
  trailingStopEnabled: boolean;
  trailingStopActivationPct: number; // e.g. activate when 50% towards TP1
  soundAlerts: boolean;
  economicNewsFilter: boolean;
  activeSymbols: string[];
  activeTimeframes: string[];
  twelveDataApiKey?: string;
  finnhubApiKey?: string;
  // --- Language & Internationalization ---
  language?: 'ar' | 'en';
  // --- Trade Conflict & Duplication Prevention ---
  preventOppositeSignals?: boolean;
  signalCooldownMinutes?: number;
  preferredTradeStyle?: 'ALL' | 'SCALP' | 'SWING';
  // --- Auto-Close & ATR Dynamic Trigger Engine ---
  autoCloseEnabled: boolean;
  atrTpMultiplier: number; // e.g. 2.5x ATR for Take Profit
  atrSlMultiplier: number; // e.g. 1.5x ATR for Stop Loss
  autoCloseOnOppositeSignal?: boolean;
  // --- ATR Dynamic Trailing Stop ---
  atrDynamicTrailingEnabled?: boolean;
  atrTrailingMultiplier?: number; // e.g. 1.5x ATR trailing buffer
  // --- Volatility Spike Filter ---
  volatilitySpikeFilterEnabled?: boolean;
  volatilitySpikeThreshold?: number; // e.g. 2.5x normal ATR
  // --- Early Invalidation & De-risking ---
  earlyInvalidationAlerts?: boolean;
  earlyInvalidationAutoDeRisk?: boolean;
  // --- Intermarket Macro Analysis ---
  intermarketFilterEnabled?: boolean;
  // --- Quantitative Risk & Kelly Sizing ---
  kellySizingEnabled?: boolean;
  fractionalKellyScale?: number; // e.g., 0.35 (Fractional Kelly)
  volatilitySizingScaler?: boolean; // Inverse ATR position sizer
  // --- Multi-TP Partial Close & Smart Risk Shield ---
  multiTpPartialCloseEnabled?: boolean; // Close 50% at TP1 + move SL to Break-Even
  partialClosePctAtTp1?: number; // Default 50%
  highImpactNewsShieldEnabled?: boolean; // Block trade entry 5-10m before CPI/FOMC
  newsShieldBufferMinutes?: number; // Default 10 minutes
  multiTimeframeConfluenceRequired?: boolean; // 15m / 1h / 4h trend alignment
  smcOrderBlockValidationRequired?: boolean; // Liquidity sweep & FVG confirmation
  // --- Institutional Sessions & Killzones ---
  sessionKillzoneFilter?: boolean;
  blockDeadZoneTrades?: boolean;
  // --- Cross-Asset Correlation Exposure Guard ---
  correlationGuardEnabled?: boolean;
  maxCurrencyExposurePct?: number; // e.g. 3.0% max exposure per single currency
  maxPortfolioRiskPct?: number; // e.g. 6.0% max portfolio risk
  // --- Smart Limit Execution & Signal TTL ---
  smartLimitOrdersEnabled?: boolean;
  signalTtlMinutes?: number; // Time to live before expiring unfulfilled limit
  // --- Scalp vs Swing Dual-Mode Algorithm Configuration ---
  scalpSwingDualMode?: 'SCALP' | 'SWING' | 'HYBRID_AUTO';
  // --- Market Closures, Schedules & Holiday Engine ---
  marketClosureGuardEnabled?: boolean;
  preWeekendDeRiskEnabled?: boolean;
  dailyRolloverGuardEnabled?: boolean;
  mt5Config?: {
    server: string;
    login: string;
    password?: string;
    isConnected?: boolean;
    autoExecute?: boolean;
    lotSize?: number;
  };
  // --- 24/7 Autonomous Cloud Daemon & Interactive Remote Control ---
  telegramInteractiveCommands?: boolean;
  cloudAutonomyKeepAlive?: boolean;
  brokerWebhookUrl?: string;
  brokerWebhookSecret?: string;
  brokerWebhookEnabled?: boolean;
  brokerPlatform?: 'METATRADER_5' | 'METATRADER_4' | 'BINANCE' | 'BYBIT' | 'TRADINGVIEW_CUSTOM';
  // --- Live Real Trading vs Paper Trading Engine ---
  tradingMode?: 'PAPER' | 'LIVE';
  liveTradingSafeguards?: {
    maxDailyLossUSD: number;
    maxDailyLossPct?: number; // 15% Max Daily Drawdown Protection
    maxLotSize: number;
    maxOpenLiveTrades: number;
    emergencyKillswitch: boolean;
    requireManualConfirmation: boolean;
    brokerAccountName?: string;
  };
  maxDailyLossPct?: number; // 15% Maximum Daily Capital Loss Threshold
  // --- Direct Broker API Credentials (Non-Webhook Execution) ---
  brokerApiCredentials?: {
    activeBroker: 'BINANCE' | 'JUSTMARKETS' | 'XM' | 'BYBIT' | 'EXNESS' | 'DERIV' | 'CUSTOM_REST';
    binance?: {
      apiKey: string;
      apiSecret: string;
      accountType: 'FUTURES_USDT' | 'SPOT';
      testnet: boolean;
      isValidated?: boolean;
      lastValidated?: number;
      accountBalance?: number;
      permissions?: string[];
    };
    justmarkets?: {
      mtLogin: string;
      server: string;
      apiToken?: string;
      restEndpoint?: string;
      isValidated?: boolean;
      lastValidated?: number;
      accountBalance?: number;
      currency?: string;
    };
    xm?: {
      mtLogin: string;
      server: string;
      apiToken?: string;
      restEndpoint?: string;
      isValidated?: boolean;
      lastValidated?: number;
      accountBalance?: number;
      currency?: string;
    };
    bybit?: {
      apiKey: string;
      apiSecret: string;
      testnet: boolean;
      category: 'linear' | 'spot';
      isValidated?: boolean;
      lastValidated?: number;
      accountBalance?: number;
    };
    deriv?: {
      apiToken: string;
      appId: string;
      isValidated?: boolean;
      lastValidated?: number;
      accountBalance?: number;
    };
    customRest?: {
      brokerName: string;
      baseUrl: string;
      apiKey: string;
      apiSecret?: string;
      headerAuthName?: string;
      isValidated?: boolean;
      lastValidated?: number;
    };
  };
  savedBrokerAccounts?: SavedBrokerAccount[];
}

export interface SavedBrokerAccount {
  id: string;
  name: string;
  brokerType: 'BYBIT' | 'BINANCE' | 'JUSTMARKETS' | 'XM' | 'EXNESS' | 'DERIV' | 'CUSTOM_REST';
  createdAt: number;
  lastValidated?: number;
  isValidated?: boolean;
  errorCode?: string | number;
  errorMessage?: string;
  accountBalance?: number;
  currency?: string;
  isPrimary?: boolean;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    testnet?: boolean;
    category?: 'linear' | 'spot';
    accountType?: 'FUTURES_USDT' | 'SPOT';
    mtLogin?: string;
    server?: string;
    apiToken?: string;
    restEndpoint?: string;
    appId?: string;
    baseUrl?: string;
  };
}

export interface SymbolLatencyMetric {
  symbol: string;
  latencyMs: number;
  lastUpdate: number;
  isLive: boolean;
  source: 'WEBSOCKET' | 'BIQUOTE' | 'BINANCE' | 'YAHOO' | 'COINBASE' | 'INTERBANK' | 'SIMULATED';
  accuracyPct: number;
}

export interface BotLogEntry {
  id: string;
  timestamp: number;
  level: 'SCAN' | 'SIGNAL' | 'ORDER' | 'TRAILING_SL' | 'TELEGRAM' | 'DISCORD' | 'AI_GEMINI' | 'INFO' | 'WARN' | 'ERROR';
  category: 'ENGINE' | 'MARKET' | 'TELEGRAM' | 'AI' | 'EXECUTION' | 'SECURITY';
  message: string;
  details?: Record<string, any>;
  symbol?: string;
}

export interface BotStatus {
  isRunning: boolean;
  accountBalance?: number;
  uptimeSeconds?: number;
  lastScanTime: number;
  nextScanSeconds: number;
  totalSignalsGenerated: number;
  activeSignalsCount: number;
  winRatePct: number;
  totalTradesCount: number;
  openTradesCount: number;
  totalPnL: number;
  dailyPnL: number;
  dailyProfitTargetMultiplier?: number;
  dailyProfitTargetUSD?: number;
  dailyTargetProgressPct?: number;
  telegramConnected: boolean;
  discordConnected: boolean;
  geminiConnected: boolean;
  dataSource: MarketDataSource;
  fearAndGreed: FearAndGreedData;
  upcomingEvents: EconomicCalendarEvent[];
  symbolLatencies?: Record<string, SymbolLatencyMetric>;
  quota: {
    apiRequestsToday: number;
    apiLimitDaily: number;
    geminiCallsToday: number;
  };
  metrics?: {
    avgScanDurationMs: number;
    totalScanCycles: number;
    activeTrailingStopsCount: number;
    lastLivePricePing: number;
    avgLatencyMs?: number;
    dataAccuracyScore?: number;
    symbolLatencies?: Record<string, SymbolLatencyMetric>;
    executionQuality?: {
      avgSlippagePoints: number;
      avgSlippageUSD: number;
      avgLatencyMs: number;
      fillEfficiencyPct: number;
      gradesBreakdown: Record<string, number>;
    };
  };
}

export interface MarketOutlookDigest {
  generatedAt: number;
  overallSentiment: 'RISK_ON' | 'RISK_OFF' | 'SELECTIVE_NEUTRAL';
  fearGreedIndex?: number;
  fearGreedSentiment?: string;
  executiveSummary: string;
  topOpportunities: {
    symbol: string;
    direction: SignalDirection;
    reason: string;
    conviction: 'HIGH' | 'MEDIUM';
  }[];
  macroFactors: string[];
  riskWarnings: string[];
  upcomingEventsSummary?: string[];
}

export interface TelegramWebUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramMiniAppStatus {
  isAvailable: boolean;
  user: TelegramWebUser | null;
  platform: string;
  colorScheme: 'dark' | 'light';
  version: string;
  initData: string;
}

// ==========================================
// 7. Intermarket Macro Analysis Architecture
// ==========================================
export type MacroRegimeType = 
  | 'RISK_ON_EXPANSION'
  | 'RISK_OFF_DEFENSIVE'
  | 'DOLLAR_YIELD_SQUEEZE'
  | 'STAGFLATIONARY_PRESSURE'
  | 'BALANCED_NEUTRAL';

export interface IntermarketMacroState {
  macroRegime: MacroRegimeType;
  regimeNameArabic: string;
  regimeConfidence: number; // 0-100%
  regimeSummary: string;
  lastUpdated: number;
  regime?: string;
  dxyTrend?: string;
  dxyValue?: number;
  us10yYield?: number;
  yield10y?: number;
  yieldTrend?: string;
  goldBias?: string;
  oilValue?: number;
  oilBias?: string;
  // Key Macro Anchors
  dxy: {
    symbol: string;
    price: number;
    change24h: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    impactSummary: string;
  };
  us10y: {
    symbol: string;
    yield: number;
    change24h: number;
    trend: 'RISING' | 'FALLING' | 'FLAT';
    impactSummary: string;
  };
  spx500: {
    symbol: string;
    price: number;
    change24h: number;
    sentiment: 'BULLISH' | 'BEARISH' | 'CONSOLIDATING';
  };
  vix: {
    symbol: string;
    value: number;
    regime: 'CALM' | 'NORMAL' | 'ELEVATED' | 'PANIC';
  };
  oil: {
    symbol: string;
    price: number;
    change24h: number;
    inflationPressure: 'HIGH' | 'MODERATE' | 'LOW';
  };
  // Specialized Gold & Macro Asset Matrix
  goldMacroBias: {
    bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
    dxyHeadwind: number; // -100 to +100
    realYieldsHeadwind: number;
    safeHavenTailwind: number;
    intermarketScore: number; // -100 to +100
    explanation: string;
  };
  forexMacroBiases: Record<string, {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    rationale: string;
  }>;
  crossAssetCorrelations: Array<{
    pairA: string;
    pairB: string;
    correlation: number; // e.g. -0.88
    description: string;
    divergenceDetected?: boolean;
    divergenceNote?: string;
  }>;
}

// ==========================================
// Parallel Challenger / What-If Simulation
// ==========================================
export interface StrategyPerformanceMetrics {
  name: string;
  strategyType: 'BASELINE' | 'CHALLENGER';
  winRatePct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgTradeDurationMins: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  volatilitySurvivalRatePct: number;
  avgSlippageUSD: number;
  equityCurve: Array<{ time: number; equity: number; tradeLabel?: string; pnl?: number }>;
}

export interface ChallengerComparison {
  baseline: StrategyPerformanceMetrics;
  challenger: StrategyPerformanceMetrics;
  deltaPnL: number;
  deltaWinRate: number;
  deltaDrawdown: number;
  alphaGenerationPct: number;
  winningStrategy: 'BASELINE' | 'CHALLENGER';
  recommendations: string[];
  evaluatedAt: number;
}

export interface WhatIfConfig {
  atrTpMultiplier: number;
  atrSlMultiplier: number;
  atrTrailingMultiplier: number;
  volatilityFilterThreshold: number;
  earlyInvalidationStrictness: 'STRICT' | 'MODERATE' | 'OFF';
  intermarketFilterEnabled: boolean;
  simulatedSlippagePips: number;
  riskPerTradePct: number;
}

// ==========================================
// 8. Modular Strategy Decomposition & Hybridization Matrix
// ==========================================

export type StrategyPhaseType = 'BIAS' | 'TRIGGER' | 'STOP_MANAGEMENT' | 'TARGET_MANAGEMENT';

export interface StrategyModuleComponent {
  id: string;
  strategySource: string; // e.g., 'Sniper ICT', 'SuperScalp EMA', 'Weekly-CISD', 'Alpha-Differential Dynamic'
  phase: StrategyPhaseType;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  standaloneWinRatePct: number;
  standaloneSharpe: number;
  standaloneProfitFactor: number;
  avgPipsOrR: string;
  keyStrength: string;
  keyStrengthArabic: string;
  knownWeakness: string;
  knownWeaknessArabic: string;
  isHarmonicOrClassical?: boolean;
  patternRole?: 'TRIGGER_CONFIRMATION_ONLY' | 'TARGET_GEOMETRIC_PROJECTION_ONLY';
}

export interface HybridStrategyCandidate {
  id: string;
  name: string;
  nameArabic: string;
  biasModuleId: string;
  triggerModuleId: string;
  stopModuleId: string;
  targetModuleId: string;
  patternConfirmationId?: string;
  targetGeometricPatternId?: string;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  totalPnL: number;
  totalSimulatedTrades: number;
  alphaVsChampionPct: number;
  mergeRationale: string;
  mergeRationaleArabic: string;
  isShadowTested: boolean;
  status: 'PROPOSED' | 'TESTING_OFFLINE' | 'READY_FOR_CHALLENGER' | 'CHAMPION';
  auditLog: {
    timestamp: number;
    whyMerged: string;
    whyMergedArabic: string;
    triggerStrength: string;
    stopStrength: string;
    targetStrength: string;
  };
}

export interface HybridizationMatrixResult {
  modules: StrategyModuleComponent[];
  activeChampion: {
    name: string;
    nameArabic: string;
    biasId: string;
    triggerId: string;
    stopId: string;
    targetId: string;
    winRatePct: number;
    profitFactor: number;
    maxDrawdownPct: number;
    totalPnL: number;
  };
  topHybrids: HybridStrategyCandidate[];
  matrixGrid: Array<{
    triggerModuleId: string;
    stopModuleId: string;
    targetModuleId: string;
    combinedWinRate: number;
    combinedProfitFactor: number;
    combinedPnL: number;
    isTopPerformer: boolean;
  }>;
  evaluatedAt: number;
}

// ==========================================
// 9. Institutional & Quantitative Frameworks
// ==========================================

// 1. Dynamic Position Sizing & Fractional Kelly Criterion
export interface KellyPositionSizeCalculation {
  winRatePct: number;
  profitFactor: number;
  fullKellyPct: number;
  fullKellyFractionPct?: number;
  fractionalScale: number; // e.g., 0.35 (Quarter to Half Kelly)
  fractionalKellyPct?: number;
  recommendedRiskPct: number;
  recommendedRiskUSD?: number;
  volatilityScaler: number; // Inverse ATR multiplier (0.5x to 1.5x)
  calculatedLotSize: number;
  riskUSD: number;
  maxLossUSD: number;
  capitalAtRiskPct: number;
  sizingRationale: string;
  sizingRationaleArabic: string;
}

// 2. Session Liquidity & Bank Killzones Engine
export type MarketSessionType = 
  | 'LONDON_OPEN_KILLZONE' 
  | 'NEW_YORK_OPEN_KILLZONE' 
  | 'LONDON_CLOSE_KILLZONE' 
  | 'ASIAN_RANGE' 
  | 'DEAD_ZONE_RESTRICTED';

export interface SessionKillzoneState {
  currentGmtHour: number;
  currentTimeGMT?: string;
  activeSession: MarketSessionType;
  activeSessionName?: string;
  sessionName: string;
  sessionNameArabic: string;
  isKillzoneActive: boolean;
  deadzoneActive: boolean;
  confluenceMultiplier: number; // 0.6x (deadzone) to 1.35x (high liquidity killzone)
  bestPairs: string[];
  description: string;
  descriptionArabic: string;
  nextUpcomingSession: {
    name: string;
    nameArabic: string;
    startsInMinutes: number;
  };
}

// 3. Cross-Asset Correlation Exposure Guard
export interface CurrencyExposureItem {
  currency: string;
  exposureUSD: number;
  exposurePct: number;
  totalRiskPct?: number;
  maxAllowedPct: number;
  status: 'SAFE' | 'WARNING' | 'BREACHED';
  openPositionsCount: number;
  activePairs: string[];
  symbols?: string[];
}

export interface PortfolioExposureGuard {
  totalBalanceUSD: number;
  totalRiskUSD: number;
  totalRiskPct: number;
  maxPortfolioRiskLimitPct: number;
  maxSingleCurrencyLimitPct?: number;
  remainingRiskCapacityPct?: number;
  isPortfolioCapBreached: boolean;
  currencyExposures: Record<string, CurrencyExposureItem>;
  correlationWarnings: Array<{
    pairA: string;
    pairB: string;
    correlationCoefficient: number;
    warning: string;
    warningArabic: string;
  }>;
}

// 4. Smart Limit Execution & Signal TTL
export interface SmartOrderExecutionDetails {
  orderType: 'SMART_LIMIT' | 'MARKET_FILL';
  intendedEntryPrice: number;
  limitPrice: number;
  timeToLiveSeconds: number;
  antiSlippageBufferPips: number;
  isExpired: boolean;
  fillStatus: 'PENDING_LIMIT' | 'FILLED_OPTIMAL' | 'EXPIRED_CANCELLED';
  timeRemainingSeconds: number;
}

// 5. Post-Trade Analysis & Trade Post-Mortem (MAE / MFE)
export interface TradePostMortem {
  id?: string;
  tradeId: string;
  symbol: string;
  direction: SignalDirection;
  tradeStyle: 'SCALP' | 'SWING' | 'DAILY_SWING';
  lotSize?: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnL: number;
  realizedPnlPct: number;
  durationMinutes: number;
  holdingDurationMinutes?: number;
  maePips: number; // Maximum Adverse Excursion (deepest drawdown during trade)
  maeUSD: number;
  mfePips: number; // Maximum Favorable Excursion (highest peak profit during trade)
  mfeUSD: number;
  efficiencyScorePct: number; // (Realized / MFE) * 100
  efficiencyRating?: string;
  executionQualityScore?: number;
  maxFavorableExcursionPips?: number;
  maxAdverseExcursionPips?: number;
  favorableEfficiencyPct?: number;
  adverseExcursionRatioPct?: number;
  slippagePoints?: number;
  slippageUSD?: number;
  closeReason?: string;
  exitReasonExplanation?: string;
  actionableTakeaway?: string;
  exitQualityGrade: 'OPTIMAL' | 'ACCEPTABLE' | 'EARLY_EXIT' | 'LATE_DRAGGED';
  postMortemNotes: string;
  postMortemNotesArabic: string;
  aiSuggestedOptimization: string;
  aiSuggestedOptimizationArabic: string;
  failureRootCauseArabic?: string;
  aiDebriefAnalysisArabic?: string;
  patternValidationScore?: number;
  adaptiveWeightAdjustmentArabic?: string;
  marketRegimeAtTrade?: 'TRENDING_BULL' | 'TRENDING_BEAR' | 'CHOPPY_RANGE' | 'HIGH_VOLATILITY_SPIKE' | 'LIQUIDITY_HUNT';
  lessonsLearnedArabic?: string[];
  overfittingSafeguardNote?: string;
  closedAt: number;
}

// Adaptive Bayesian Pattern Learning & Anti-Overfitting Matrix
export interface PatternLearningRecord {
  patternKey: string;
  patternNameArabic: string;
  assetClassCategory: 'FOREX' | 'CRYPTO' | 'GOLD_METALS' | 'ALL';
  totalTradesObserved: number;
  winningTrades: number;
  losingTrades: number;
  rawWinRatePct: number;
  regularizedWinRatePct: number; // Bayesian smoothed / L2 regularized (prevents overfitting to small sample noise)
  profitFactor: number;
  averageMaePips: number;
  averageMfePips: number;
  optimalAtrMultiplier: number;
  optimalSlDistanceMultiplier: number;
  overfittingRiskGrade: 'SAFE_GENERALIZED' | 'MODERATE_CONFIRMED' | 'OVERFITTING_WARNING';
  weightMultiplier: number; // 0.4x to 1.6x dynamic confidence scaling based on rolling regime edge
  lastRegimeEvaluated: string;
  latestLearningSummaryArabic: string;
  lastUpdated: number;
}

export interface AdaptivePatternLearningState {
  totalAnalyzedTrades: number;
  systemOverfittingPreventionIndex: number; // 0-100 (higher is safer from overfitting)
  overallRollingWinRatePct: number;
  activePatternWeights: Record<string, PatternLearningRecord>;
  recentRegimeShifts: Array<{
    timestamp: number;
    regime: string;
    descriptionArabic: string;
    impactOnWeights: string;
  }>;
  recentDebriefs: Array<{
    tradeId: string;
    symbol: string;
    outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
    summaryArabic: string;
    weightAdjustment: string;
  }>;
  lastTunedTimestamp: number;
}

// 6. Scalp vs Swing Dual-Mode Algorithm Configuration
export interface ScalpSwingAlgorithmProfile {
  id?: string;
  name?: string;
  mode?: 'SCALP' | 'SWING' | 'HYBRID_AUTO';
  scalpConfig: {
    nameArabic?: string;
    timeframes?: string[];
    enabledTimeframes?: string[];
    minConfidencePct?: number;
    minConfidenceScore?: number;
    minRR?: number;
    atrTpMultiplier: number;
    atrSlMultiplier: number;
    trailingActivationPct?: number;
    maxHoldingMinutes?: number;
    useMicroInefficiencies?: boolean;
    activeHoursDescriptionArabic?: string;
    signalTtlMinutes?: number;
  };
  swingConfig: {
    nameArabic?: string;
    timeframes?: string[];
    enabledTimeframes?: string[];
    minConfidencePct?: number;
    minConfidenceScore?: number;
    minRR?: number;
    atrTpMultiplier: number;
    atrSlMultiplier: number;
    trailingActivationPct?: number;
    maxHoldingHours?: number;
    useMacroLiquidity?: boolean;
    activeHoursDescriptionArabic?: string;
    signalTtlMinutes?: number;
  };
}

export interface GeminiDynamicLevels {
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  poc: number;
  dynamicRange: string;
}

export interface GeminiSmartRecommendation {
  action: 'BUY' | 'SELL' | 'WAIT';
  symbol: string;
  entryZone: string;
  stopLoss: number;
  target1: number;
  target2: number;
  target3?: number;
  recommendedLot: number;
  riskRewardRatio: number;
  confidencePct: number;
  rationale: string;
  source: 'INTERMARKET_REALTIME' | 'ORDER_FLOW' | 'FVG_LIQUIDITY';
}

export interface GeminiMarketInsight {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  biasScore: number;
  executiveSummary: string;
  dynamicLevels: GeminiDynamicLevels;
  orderFlowInsights: {
    dominantPressure: string;
    institutionalFootprint: string;
    liquidityPools: string;
    retailTraps: string;
  };
  intermarketContext: {
    dxyImpact: string;
    yieldsImpact: string;
    macroConfluence: string;
  };
  smartRecommendations: GeminiSmartRecommendation[];
  zeroLossMetrics: {
    activeProtectedTradesCount: number;
    lockedProfitTotalUSD: number;
    averageSecuredR: number;
  };
  lastUpdated: number;
}

export interface ErrorBoundaryDiagnosis {
  errorName: string;
  errorMessage: string;
  componentStack?: string;
  rootCauseAnalysis: string;
  suggestedCodeFix: string;
  autoRecoveryAvailable: boolean;
  recoverySteps: string[];
  timestamp: number;
}

export interface QuantitativeSynergyMatrix {
  symbol: string;
  timeframe: string;
  synergyScore: number;
  botExecutionVerdict: 'APPROVED_IMMEDIATE_EXECUTION' | 'APPROVED_SCALP' | 'APPROVED_SWING' | 'CONDITIONAL_PULLBACK' | 'REJECTED_LOW_CONFLUENCE' | 'REJECTED_KILLZONE_DEADZONE';
  verdictExplanationArabic: string;
  deconstructedModules: {
    orderBlockScore: number;
    fairValueGapScore: number;
    liquiditySweepScore: number;
    momentumEmaScore: number;
    volumePocScore: number;
    wyckoffPhase: string;
    totalStructuralScore: number;
  };
  quantumEngineering: {
    volatilityEntropyRatio: number;
    expectedValueEV: number;
    optimalKellyLot: number;
    maxSafeLotCap: number;
    slippageRiskPoints: number;
    projectedSharpe: number;
    riskRewardRatio: number;
    stopLossDistanceUSD: number;
  };
  hybridAlphaSynthesis: {
    winningHybridName: string;
    winningHybridNameArabic: string;
    alphaVsBaselinePct: number;
    sessionConfluenceMultiplier: number;
    intermarketMacroScore: number;
    recommendedTrailingStopATR: number;
    recommendedTakeProfitATR: number;
  };
  summaryArabic: string;
  timestamp: number;
}

export interface OwnerAuthStatus {
  isOwnerAuthenticated: boolean;
  ownerEmail: string;
  role: 'CREATOR' | 'VISITOR';
  unlockedAt?: number;
}

export type RadarSignal = TradeSignal;

export interface SupportResistanceMatrix {
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  pivot: number;
  majorLiquidityZone: string;
  bias: 'BULLISH_BREAKOUT' | 'BEARISH_REVERSAL' | 'RANGE_EXPANSION' | 'LIQUIDITY_SWEEP';
}

export interface GeminiMasterScreenedTrade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
  winRatePct: number;
  compound10xMultiplierScore: number;
  strategyCategory: string;
  confluenceFactors: string[];
  rationaleArabic: string;
  kellyLotRecommended: number;
  status: 'PENDING_SCREEN' | 'ARMED' | 'EXECUTED' | 'DISMISSED';
  supportResistance?: SupportResistanceMatrix;
}

export interface GeminiMasterScreenerFilter {
  minWinRate?: number;
  minConfidence?: number;
  minRR?: number;
  assetClass?: 'ALL' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES';
  timeframe?: string;
  min10xScore?: number;
  searchQuery?: string;
}

export interface GeminiMasterScreenerResult {
  success: boolean;
  scanTime: number;
  scannedSymbolsCount: number;
  screenedTrades: GeminiMasterScreenedTrade[];
  macroRegime: string;
  geminiExecutiveSummary: string;
  automatedBotStatus: string;
  topMarketPicks?: Array<{
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entryZone: string;
    targetPrice: number;
    stopLoss: number;
    confluenceReason: string;
    confidencePct: number;
  }>;
}

export interface ModularHybridizationMatrixResult {
  symbol: string;
  bestHybridName: string;
  bestHybridNameArabic: string;
  alphaMultiplier: number;
  sharpeRatio: number;
  winRatePct: number;
  recommendedKellyLot: number;
}

export interface UnifiedMacroQuantHybridPayload {
  success: boolean;
  timestamp: number;
  targetSymbol: string;
  primaryMatrix: QuantitativeSynergyMatrix;
  appliedSettings: {
    lotSize: number;
    atrTrailingMultiplier: number;
    atrTpMultiplier: number;
    riskPerTradePct: number;
  };
  summaryArabic: string;
  summaryEnglish: string;
  intermarket?: IntermarketMacroState;
  modularStrategyMatrix?: ModularHybridizationMatrixResult[];
}

// ==========================================
// Market Closures, Schedules & Holiday Intelligence
// ==========================================

export type MarketSessionId = 'SYDNEY' | 'TOKYO' | 'LONDON' | 'NEW_YORK';

export interface MarketSessionStatus {
  id: MarketSessionId;
  name: string;
  nameArabic: string;
  city: string;
  flag: string;
  openUtc: string; // "21:00", "00:00", "07:00", "12:00"
  closeUtc: string; // "06:00", "09:00", "16:00", "21:00"
  isOpen: boolean;
  progressPct: number; // 0-100%
  timeRemaining: string;
  secondsRemaining: number;
  isKillzone: boolean;
  volatilityTier: 'HIGH' | 'MEDIUM' | 'LOW';
  activePairs: string[];
}

export type AssetMarketState = 
  | 'OPEN' 
  | 'CLOSED_WEEKEND' 
  | 'DAILY_ROLLOVER' 
  | 'DAILY_MAINTENANCE' 
  | 'HOLIDAY_CLOSED' 
  | 'EARLY_CLOSE' 
  | 'PRE_MARKET' 
  | 'AFTER_HOURS';

export interface AssetClassMarketStatus {
  assetClass: AssetClass;
  title: string;
  titleArabic: string;
  state: AssetMarketState;
  stateArabic: string;
  isOpen: boolean;
  currentSessionName?: string;
  nextEventTitle: string;
  nextEventTitleArabic: string;
  nextEventTime: number;
  countdownText: string;
  spreadWarning: boolean;
  liquidityTier: 'OPTIMAL' | 'MODERATE' | 'THIN' | 'ZERO';
  symbolsCount: number;
  notes: string;
  notesArabic: string;
}

export interface MarketHoliday {
  id: string;
  name: string;
  nameArabic: string;
  date: string; // YYYY-MM-DD
  country: string;
  countryFlag: string;
  affectedAssetClasses: AssetClass[];
  affectedMarkets: string[];
  status: 'FULL_CLOSE' | 'EARLY_CLOSE' | 'THIN_LIQUIDITY';
  earlyCloseTimeUtc?: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  botActionGuidance: string;
  botActionGuidanceArabic: string;
  isToday?: boolean;
  isUpcoming?: boolean;
  daysUntil?: number;
}

export interface MarketSymbolSchedule {
  symbol: string;
  assetClass: AssetClass;
  state: AssetMarketState;
  stateArabic: string;
  isOpen: boolean;
  tradingAllowed: boolean;
  currentSpreadMultiplier: number;
  nextEvent: string;
  nextEventArabic: string;
  nextEventTime: number;
  countdownSeconds: number;
  countdownText: string;
  preWeekendRisk: boolean;
  rolloverActive: boolean;
  activeHoliday?: MarketHoliday;
}

export interface MarketClosuresOverview {
  timestamp: number;
  utcTimeStr: string;
  dayOfWeek: string;
  isWeekend: boolean;
  activeSessions: MarketSessionStatus[];
  allSessions: MarketSessionStatus[];
  overlapWindow: {
    isOverlapActive: boolean;
    name: string;
    nameArabic: string;
    description: string;
    descriptionArabic: string;
  };
  assetClasses: Record<AssetClass, AssetClassMarketStatus>;
  weekendCloseCountdown: {
    isForexClosingSoon: boolean; // within 2 hours of Friday 22:00 UTC
    isWeekendActive: boolean;
    secondsUntilForexClose: number;
    secondsUntilForexOpen: number;
    closeTimeUtc: string;
    reopenTimeUtc: string;
    countdownText: string;
  };
  dailyRolloverCountdown: {
    isRolloverActive: boolean;
    secondsUntilRollover: number;
    rolloverWindowText: string;
    rolloverWindowTextArabic: string;
  };
  activeHolidaysToday: MarketHoliday[];
  upcomingHolidays: MarketHoliday[];
  botExecutionGuard: {
    isForexTradingAllowed: boolean;
    isCommoditiesAllowed: boolean;
    isIndicesAllowed: boolean;
    isCryptoAllowed: boolean;
    globalWarningMessage?: string;
    globalWarningMessageArabic?: string;
    riskMultiplier: number;
  };
}

// ==========================================
// Institutional Liquidity Heatmap & Order Flow Types
// ==========================================

export interface OrderBookLevel {
  price: number;
  quantity: number;
  totalUSD: number;
  ordersCount: number;
  isIceberg: boolean;
  isSpoofed: boolean;
  type: 'BID' | 'ASK';
  intensityPct: number; // 0-100%
}

export interface LiquidationCluster {
  priceLevel: number;
  estimatedVolumeUSD: number;
  leverageTier: '100x' | '50x' | '25x' | '10x';
  side: 'LONG_LIQUIDATION' | 'SHORT_LIQUIDATION';
  distancePct: number;
  isMagnetZone: boolean;
  descriptionArabic: string;
}

export interface CmeFuturesDomData {
  contractCode: string;
  pocPrice: number;
  valueAreaHigh: number;
  valueAreaLow: number;
  netCmeDelta: number;
  institutionalDeltaBias: 'STRONG_ACCUMULATION' | 'MILD_BUYING' | 'NEUTRAL' | 'MILD_SELLING' | 'STRONG_DISTRIBUTION';
  unfilledImbalancesCount: number;
  absorptionVolumeUSD: number;
}

export interface CotReportData {
  reportDate: string;
  assetName: string;
  commercialNetPosition: number;
  nonCommercialNetPosition: number;
  commercialLongPct: number;
  commercialShortPct: number;
  smartMoneyBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  historicalPercentile: number;
  summaryArabic: string;
  summaryEnglish: string;
}

export interface SpoofingDetectionMetric {
  spoofingRiskScore: number;
  fakeWallsDetected: Array<{
    price: number;
    side: 'BUY_WALL' | 'SELL_WALL';
    volumeUSD: number;
    detectedBehavior: 'CANCELED_BEFORE_FILL' | 'FLASH_APPEARANCE' | 'RETAIL_BAIT';
    confidencePct: number;
  }>;
  verifiedIcebergOrders: Array<{
    price: number;
    side: 'BUY' | 'SELL';
    hiddenVolumeEstimatedUSD: number;
    absorbedContracts: number;
    protectionStrength: 'HIGH' | 'MAXIMUM' | 'CRITICAL';
  }>;
  tapeAggressionRatio: number;
}

export interface CvdAbsorptionData {
  cvdValue: number; // Current cumulative volume delta
  cvdHistory: Array<{ timestamp: number; price: number; cvd: number }>;
  cvdDivergence: 'BULLISH_ABSORPTION' | 'BEARISH_ABSORPTION' | 'BULLISH_EXHAUSTION' | 'BEARISH_EXHAUSTION' | 'NEUTRAL';
  deltaImbalancePct: number; // Aggressive Buy % vs Sell %
  institutionalAbsorptionZone: string;
  divergenceSummaryArabic: string;
}

export interface OpenInterestSqueezeData {
  openInterestUSD: number;
  openInterestChange24hPct: number;
  fundingRatePct: number;
  predictedFundingRatePct: number;
  squeezeRegime: 'LONG_SQUEEZE_RISK' | 'SHORT_SQUEEZE_IMMINENT' | 'DELEVERAGING_CASCADE' | 'HEALTHY_ACCUMULATION';
  liquidationsFlushed4hUSD: number;
  estimatedNextCascadePrice: number;
  regimeSummaryArabic: string;
}

export interface FootprintImbalanceData {
  stackedBuyImbalances: Array<{ price: number; buyVolume: number; sellVolume: number; imbalanceRatio: number }>;
  stackedSellImbalances: Array<{ price: number; buyVolume: number; sellVolume: number; imbalanceRatio: number }>;
  unfinishedAuctions: Array<{ price: number; side: 'HIGH' | 'LOW'; magnetPowerPct: number; descriptionArabic: string }>;
  pointOfControlDelta: number;
  institutionalTapePace: 'ULTRA_FAST_SWEEP' | 'STEADY_ACCUMULATION' | 'ABSORPTION' | 'CHOP';
}

export interface FairValueGapData {
  activeFvgs: Array<{
    id: string;
    topPrice: number;
    bottomPrice: number;
    consequentEncroachment50: number; // 50% CE fill level
    type: 'BULLISH_FVG' | 'BEARISH_FVG';
    status: 'UNFILLED' | 'PARTIALLY_MITIGATED' | 'REBALANCED';
    timeframe: '15m' | '1h' | '4h';
  }>;
  nearestFvgMagnet: {
    targetPrice: number;
    type: 'BULLISH_FVG' | 'BEARISH_FVG';
    distancePct: number;
    descriptionArabic: string;
  } | null;
}

export interface SweepLiquidityTrapData {
  sweepEvents: Array<{
    id: string;
    levelType: 'PREVIOUS_DAY_HIGH' | 'PREVIOUS_DAY_LOW' | 'ASIAN_RANGE_HIGH' | 'ASIAN_RANGE_LOW' | 'EQUAL_HIGHS' | 'EQUAL_LOWS';
    sweptPrice: number;
    reactionPattern: 'TURTLE_SOUP_REVERSAL' | 'JUDAS_SWING_TRAP' | 'AGGRESSIVE_EXPANSION';
    sweepVolumeUSD: number;
    isConfirmedReversal: boolean;
    descriptionArabic: string;
  }>;
  equalHighsPoolPrice: number | null; // Double Top Liquidity Pool
  equalLowsPoolPrice: number | null; // Double Bottom Liquidity Pool
  activeTrapWarning: string | null;
}

export interface WhaleDarkPoolFlowData {
  whaleNetFlowUSD: number; // Negative = Outflow to Cold Storage, Positive = Inflow
  exchangeNetFlowStatus: 'HEAVY_SUPPLY_SHOCK_OUTFLOW' | 'STEADY_OUTFLOW' | 'NEUTRAL' | 'EXCHANGE_INFLOW_DUMP_RISK';
  darkPoolBlocksCount24h: number;
  largestDarkPoolTransferUSD: number;
  recentWhaleAlerts: Array<{
    timestamp: number;
    amountUSD: number;
    flowType: 'EXCHANGE_OUTFLOW' | 'EXCHANGE_INFLOW' | 'DARK_POOL_CROSS';
    entityLabel: string;
    impactArabic: string;
  }>;
}

export interface SymbolLiquidityHeatmap {
  symbol: string;
  assetClass: AssetClass;
  currentPrice: number;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  orderBookImbalanceRatio: number;
  dominantWall: {
    side: 'BUY_WALL' | 'SELL_WALL' | 'BALANCED';
    price: number;
    volumeUSD: number;
    distancePct: number;
  };
  liquidationClusters: LiquidationCluster[];
  primaryLongLiquidationPool: LiquidationCluster | null;
  primaryShortLiquidationPool: LiquidationCluster | null;
  totalLiquidityPoolAboveUSD: number;
  totalLiquidityPoolBelowUSD: number;
  liquidityGravityPull: 'PULL_UP_TO_SHORTS' | 'PULL_DOWN_TO_LONGS' | 'EQUILIBRIUM';
  cmeFutures?: CmeFuturesDomData;
  cotReport?: CotReportData;
  antiSpoofing: SpoofingDetectionMetric;
  
  // 6 Advanced Real Liquidity Engine Modules:
  cvdAbsorption: CvdAbsorptionData;
  openInterestSqueeze: OpenInterestSqueezeData;
  footprintImbalance: FootprintImbalanceData;
  fairValueGaps: FairValueGapData;
  sweepLiquidityTraps: SweepLiquidityTrapData;
  whaleDarkPoolFlow: WhaleDarkPoolFlowData;

  liquidityTradeBlueprint: {
    recommendedDirection: SignalDirection;
    sniperEntryZone: string;
    suggestedEntryPrice: number;
    protectedStopLoss: number;
    targetLiquidationPool1: number;
    targetLiquidationPool2: number;
    targetLiquidationPool3: number;
    fvgConsequentEncroachmentTarget?: number;
    cvdConfirmation: string;
    confluenceReasonArabic: string;
    confluenceReasonEnglish: string;
    smartMoneyAlphaScore: number;
  };
}

export interface DeepSeekAnalysisResult {
  symbol: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  mathematicalEdgeScore: number;
  expectedValueEV: number;
  optimalKellyFraction: number;
  reasoningReport: string;
  orderBookImbalanceAnalysis: string;
  riskRewardAudit: {
    recommendedEntry: number;
    hardStopLoss: number;
    tp1: number;
    tp2: number;
    calculatedRR: number;
    isMathematicallySound: boolean;
  };
  consensusVerdict: 'APPROVE' | 'REVISE' | 'REJECT';
  antiConflictCheck: {
    hasConflictingExposure: boolean;
    recommendation: string;
  };
  latencyMs: number;
  modelUsed: string;
  timestamp: number;
}

export interface VetoCondition {
  isVetoed: boolean;
  code?: 'VETO_SPREAD_WIDENING' | 'VETO_SUBPAR_RR' | 'VETO_LOW_EV' | 'VETO_MACRO_DIVERGENCE' | 'VETO_NEWS_VOLATILITY' | 'VETO_PRICE_OVEREXTENDED';
  reasonArabic?: string;
  reasonEnglish?: string;
}

export interface DualAiConsensusResult {
  symbol: string;
  timestamp: number;
  consensusDirection: 'BUY' | 'SELL' | 'WAIT' | 'HOLD';
  consensusScore: number;
  consensusGrade: 'AAA_PRIME' | 'AA_HIGH_CONFLUENCE' | 'A_MODERATE' | 'VETOED_PROTECTION' | 'NEUTRAL_WAIT';
  vetoCondition: VetoCondition;
  geminiInsight: {
    bias: string;
    biasScore: number;
    executiveSummary: string;
    target1: number;
    stopLoss: number;
    recommendedLot: number;
    liquidityZone?: string;
    status: 'ONLINE' | 'FALLBACK';
  };
  deepSeekAudit: {
    bias: string;
    mathematicalEdgeScore: number;
    expectedValueEV: number;
    optimalKellyFraction: number;
    reasoningReport: string;
    orderBookImbalance: string;
    verdict: 'APPROVE' | 'REVISE' | 'REJECT';
    model: string;
    latencyMs: number;
  };
  synthesisPlan: {
    finalAction: 'BUY' | 'SELL' | 'WAIT';
    suggestedLot: number;
    entryPrice: number;
    limitPullbackEntry?: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    riskRewardRatio: number;
    antiConflictVerified: boolean;
    zeroLossArmed: boolean;
    autoBreakEvenThreshold: number;
    dynamicAtrTrailingStep: number;
    newsVolatilityShieldActive: boolean;
    arabicSynthesisSummary: string;
    auditChecklist?: Array<{ item: string; passed: boolean; note: string }>;
  };
}

export interface PredictedCandleTrajectory {
  candleIndex: number;
  timeframeLabel: string;
  expectedDirection: 'BULLISH_EXPANSION' | 'BEARISH_EXPANSION' | 'LIQUIDITY_SWEEP_PULLBACK' | 'CONSOLIDATION';
  openPrice: number;
  predictedHigh: number;
  predictedLow: number;
  predictedClose: number;
  probabilityPct: number;
  tacticalActionArabic: string;
}

export interface LiveAiNextMovePayload {
  symbol: string;
  timestamp: number;
  isLive: boolean;
  currentPrice: number;
  spreadPips: number;
  atrValue: number;
  high24h: number;
  low24h: number;
  change24h: number;
  timeframe: string;
  bias: 'STRONG_BUY' | 'BUY' | 'NEUTRAL_WAIT' | 'SELL' | 'STRONG_SELL';
  confidenceScore: number;
  liquidityStructure: {
    bullishOrderBlock: { min: number; max: number; status: 'ACTIVE' | 'TESTED' | 'MITIGATED' };
    bearishOrderBlock: { min: number; max: number; status: 'ACTIVE' | 'TESTED' | 'MITIGATED' };
    fairValueGapTarget: number;
    nearestLiquidityPool: { price: number; type: 'BUY_SIDE' | 'SELL_SIDE'; volumeEst: string };
  };
  predictedTrajectory: PredictedCandleTrajectory[];
  dynamicLevels: {
    suggestedEntry: number;
    limitPullbackEntry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    autoBreakEvenTrigger: number;
    riskRewardRatio: number;
    safeLotSize: number;
    expectedValueEV: number;
  };
  nextMoveSummaryArabic: string;
  executiveActionPlanArabic: string[];
}

export interface TradeManagementEvaluation {
  tradeId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  originalStopLoss: number;
  proposedStopLoss: number;
  autoBreakEvenTriggered: boolean;
  atrTrailingTriggered: boolean;
  actionRequired: 'MOVE_SL_TO_BREAK_EVEN' | 'TRAIL_STOP_PROFIT' | 'HOLD_CURRENT' | 'CLOSE_EMERGENCY_DE_RISK';
  reasonArabic: string;
}

// --- Top 100 Crypto & Dual-Exchange Scalp Engine Interfaces ---

export interface CryptoCrossSymbol {
  symbol: string;
  baseAsset: string;
  name: string;
  binanceSymbol: string;
  bybitSymbol: string;
  binancePrice: number;
  bybitPrice: number;
  spreadPct: number;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUSD: number;
  whaleInflowScore: number;
  liquiditySweepState: 'SWEEP_COMPLETED' | 'ACCUMULATING' | 'COMPRESSION' | 'DISTRIBUTION' | 'NORMAL';
  gemScore: number;
  pumpProbability: number;
  whaleBuyVolumeRatio: number;
  category: 'DEFI' | 'LAYER1_2' | 'AI_BIGDATA' | 'MEME' | 'GAMING_METAVERSE' | 'INFRASTRUCTURE' | 'TOP_CAP';
  isDualVerified: boolean;
  isGemAlert: boolean;
  isWhaleAccumulating: boolean;
  recommendedScalpAction: 'STRONG_BUY_PUMP' | 'SCALP_LONG' | 'SCALP_SHORT' | 'WATCHING';
  lastUpdated: number;
}

export interface CryptoScalpTrade {
  id: string;
  slotIndex: number;
  symbol: string;
  baseAsset: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  lotSize: number;
  allocatedMarginUSD: number;
  leverage: number;
  pnlUSD: number;
  pnlPct: number;
  // 🛡️ Spread & Fee Protection Fields
  spreadPct: number;
  estimatedSpreadUSD: number;
  tradingFeesUSD: number;
  totalFrictionUSD?: number;
  frictionCoverageRatio?: number;
  grossPnLUSD: number;
  netPnLUSD: number;
  netPnLPct: number;
  breakEvenTargetPrice: number;
  executionPlatform: 'BINANCE' | 'BYBIT' | 'DUAL_VERIFIED';
  status: 'OPEN' | 'CLOSED';
  isBreakEvenLocked: boolean;
  trailingStopActive: boolean;
  peakPnlPct: number;
  openedAt: number;
  closedAt?: number;
  closeReason?: string;
  strategy: 'WHALE_PUMP_HUNTER' | 'LIQUIDITY_SWEEP_SCALP' | 'MOMENTUM_BREAKOUT';
  crossExchangeVerified: boolean;
  dynamicWeightReason?: string;
  notionalValueUSD?: number;
  riskPerTradeUSD?: number;
  riskPerTradePct?: number;
}

export interface CryptoPortfolioAllocation {
  totalEquityUSD: number;
  cryptoAllocatedUSD: number;
  cryptoAllocatedPct: number;
  maxDailyLossPct: number;
  currentDailyLossUSD: number;
  currentDailyLossPct: number;
  isDailyCircuitBreakerActive: boolean;
  maxConcurrentTrades: number;
  activeTradesCount: number;
  availableSlots: number;
  perTradeMarginAllocationUSD: number;
  riskPerTradeUSD: number;
  riskPerTradePct: number;
  binanceBalanceUSD: number;
  binanceConnected: boolean;
  bybitBalanceUSD: number;
  bybitConnected: boolean;
  isRealWalletConnected: boolean;
  realBrokerStatusArabic: string;
  freeEquityUSD: number;
  usedMarginUSD: number;
  freeMarginPct: number;
  accountTier: 'MICRO' | 'SMALL' | 'STANDARD' | 'PRO';
  accountTierArabic: string;
  dynamicMarginRangeUSD: string;
  minOrderSizeUSD: number;
  lastBybitError?: string;
  serverOutboundIp?: string;
}

export interface ForexAiAnalysis {
  agentRole: 'FOREX_MACRO_SPECIALIST';
  currencyStrengthMatrix: Record<string, 'STRONG' | 'NEUTRAL' | 'WEAK'>;
  goldMacroBias: 'BULLISH' | 'BEARISH' | 'RANGE_BOUND';
  dxyImpactSummary: string;
  bestForexPairs: Array<{
    pair: string;
    bias: 'BUY' | 'SELL';
    confluenceReason: string;
    recommendedLot: number;
  }>;
  executiveGuidanceArabic: string;
  activeSessionArabic: string;
  maxDrawdownStatus: string;
  timestamp: number;
}

export interface CryptoAiAnalysis {
  agentRole: 'CRYPTO_WHALE_SCALP_SPECIALIST';
  marketRegimeArabic: string;
  topGemsIdentified: Array<{
    symbol: string;
    gemScore: number;
    pumpProbability: number;
    whaleSignalArabic: string;
    action: string;
  }>;
  scalpExecutionStatus: {
    activeScalpSlotsUsed: number;
    maxSlots: number;
    scalpEngineStatusArabic: string;
    recommendedTargetTakeProfit: string;
    recommendedStopLoss: string;
  };
  whaleAccumulationRadarSummary: string;
  capitalAllocationAdviceArabic: string;
  crossExchangeSyncStatusArabic: string;
  timestamp: number;
}






