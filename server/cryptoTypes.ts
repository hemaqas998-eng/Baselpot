import { MarketSymbol } from '../src/types.js';

export interface CryptoCrossSymbol {
  symbol: string;           // e.g. 'BTC/USDT'
  baseAsset: string;        // e.g. 'BTC'
  name: string;             // e.g. 'Bitcoin'
  binanceSymbol: string;    // 'BTCUSDT'
  bybitSymbol: string;      // 'BTCUSDT'
  binancePrice: number;
  bybitPrice: number;
  spreadPct: number;
  price: number;            // Consolidated Fair Price
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUSD: number;
  whaleInflowScore: number; // 0-100%
  liquiditySweepState: 'SWEEP_COMPLETED' | 'ACCUMULATING' | 'COMPRESSION' | 'DISTRIBUTION' | 'NORMAL';
  gemScore: number;         // 0-100%
  pumpProbability: number;  // 0-100%
  whaleBuyVolumeRatio: number; // e.g. 2.8x normal volume
  category: 'DEFI' | 'LAYER1_2' | 'AI_BIGDATA' | 'MEME' | 'GAMING_METAVERSE' | 'INFRASTRUCTURE' | 'TOP_CAP';
  isDualVerified: boolean;  // Matched on both Binance & Bybit
  isGemAlert: boolean;
  isWhaleAccumulating: boolean;
  recommendedScalpAction: 'STRONG_BUY_PUMP' | 'SCALP_LONG' | 'SCALP_SHORT' | 'WATCHING';
  lastUpdated: number;
}

export interface CryptoScalpTrade {
  id: string;
  slotIndex: number;        // 1 to 5 (Max 5 concurrent)
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
  maxDailyLossPct: number;        // 15% strict capital guard
  currentDailyLossUSD: number;
  currentDailyLossPct: number;
  isDailyCircuitBreakerActive: boolean;
  maxConcurrentTrades: number;    // Exactly 5
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
}

export interface DedicatedAiAgentState {
  agentId: 'FOREX_MACRO_AGENT' | 'CRYPTO_SCALP_AGENT';
  name: string;
  roleArabic: string;
  status: 'ACTIVE' | 'CALIBRATING' | 'RESTRICTED_LOSS';
  focusAssets: string[];
  totalEvaluated: number;
  highConvictionTradesDetected: number;
  winRatePct: number;
  lastAnalysisTimestamp: number;
  currentHypothesisArabic: string;
  activeRiskControlArabic: string;
}

// Top 100 Cross-Exchange (Binance Spot & Bybit Perpetuals) High-Liquidity Crypto Assets
export const TOP_100_CRYPTO_SYMBOLS_METADATA = [
  { base: 'BTC', name: 'Bitcoin (بيتكوين)', category: 'TOP_CAP', digits: 2, defaultPrice: 76800 },
  { base: 'ETH', name: 'Ethereum (إيثيريوم)', category: 'TOP_CAP', digits: 2, defaultPrice: 2390 },
  { base: 'SOL', name: 'Solana (سولانا)', category: 'LAYER1_2', digits: 2, defaultPrice: 98.5 },
  { base: 'BNB', name: 'Binance Coin (بينانس كوين)', category: 'TOP_CAP', digits: 2, defaultPrice: 585.0 },
  { base: 'XRP', name: 'Ripple (ريبل)', category: 'TOP_CAP', digits: 4, defaultPrice: 1.45 },
  { base: 'DOGE', name: 'Dogecoin (دوجكوين)', category: 'MEME', digits: 4, defaultPrice: 0.185 },
  { base: 'ADA', name: 'Cardano (كاردانو)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.62 },
  { base: 'SUI', name: 'Sui Network (شبكة سوي)', category: 'LAYER1_2', digits: 3, defaultPrice: 2.35 },
  { base: 'AVAX', name: 'Avalanche (أفالانش)', category: 'LAYER1_2', digits: 2, defaultPrice: 25.4 },
  { base: 'NEAR', name: 'NEAR Protocol (بروتوكول نير)', category: 'AI_BIGDATA', digits: 3, defaultPrice: 4.85 },
  { base: 'LINK', name: 'Chainlink (تشينلينك)', category: 'INFRASTRUCTURE', digits: 2, defaultPrice: 14.2 },
  { base: 'PEPE', name: 'Pepe Token (بيبي)', category: 'MEME', digits: 6, defaultPrice: 0.0000085 },
  { base: 'WIF', name: 'dogwifhat (دوج ويف هات)', category: 'MEME', digits: 3, defaultPrice: 1.85 },
  { base: 'APT', name: 'Aptos (أبتوس)', category: 'LAYER1_2', digits: 2, defaultPrice: 8.9 },
  { base: 'FET', name: 'Artificial Superintelligence Alliance', category: 'AI_BIGDATA', digits: 3, defaultPrice: 1.15 },
  { base: 'RENDER', name: 'Render Network (ريندر)', category: 'AI_BIGDATA', digits: 3, defaultPrice: 5.4 },
  { base: 'INJ', name: 'Injective (إنجكتيف)', category: 'DEFI', digits: 2, defaultPrice: 18.2 },
  { base: 'TIA', name: 'Celestia (سيليستيا)', category: 'INFRASTRUCTURE', digits: 3, defaultPrice: 4.6 },
  { base: 'ARB', name: 'Arbitrum (أربتروم)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.58 },
  { base: 'OP', name: 'Optimism (أوبتيمزم)', category: 'LAYER1_2', digits: 3, defaultPrice: 1.42 },
  { base: 'POL', name: 'Polygon Ecosystem Token (بوليجون)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.38 },
  { base: 'KAS', name: 'Kaspa (كاسبا)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.125 },
  { base: 'FTM', name: 'Sonic / Fantom (فانتوم)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.68 },
  { base: 'ICP', name: 'Internet Computer (آي سي بي)', category: 'LAYER1_2', digits: 2, defaultPrice: 9.2 },
  { base: 'TON', name: 'Toncoin (تون كوين)', category: 'LAYER1_2', digits: 3, defaultPrice: 4.95 },
  { base: 'SEI', name: 'Sei Network (شبكة ساي)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.38 },
  { base: 'FLOKI', name: 'Floki (فلوكي)', category: 'MEME', digits: 6, defaultPrice: 0.00014 },
  { base: 'BONK', name: 'Bonk (بونك)', category: 'MEME', digits: 6, defaultPrice: 0.000019 },
  { base: 'SHIB', name: 'Shiba Inu (شيبا إينو)', category: 'MEME', digits: 6, defaultPrice: 0.000016 },
  { base: 'GALA', name: 'Gala Games (جالا)', category: 'GAMING_METAVERSE', digits: 5, defaultPrice: 0.024 },
  { base: 'STX', name: 'Stacks (ستاكس)', category: 'LAYER1_2', digits: 3, defaultPrice: 1.62 },
  { base: 'TAO', name: 'Bittensor (بيتنسور)', category: 'AI_BIGDATA', digits: 1, defaultPrice: 485.0 },
  { base: 'AAVE', name: 'Aave Protocol (آفي)', category: 'DEFI', digits: 2, defaultPrice: 195.0 },
  { base: 'UNI', name: 'Uniswap (يونيسواب)', category: 'DEFI', digits: 2, defaultPrice: 8.8 },
  { base: 'LDO', name: 'Lido DAO (ليدو)', category: 'DEFI', digits: 3, defaultPrice: 1.35 },
  { base: 'RUNE', name: 'THORChain (ثورتشين)', category: 'DEFI', digits: 3, defaultPrice: 4.7 },
  { base: 'PENDLE', name: 'Pendle Finance (بندل)', category: 'DEFI', digits: 3, defaultPrice: 4.1 },
  { base: 'JUP', name: 'Jupiter (جوبيتر)', category: 'DEFI', digits: 4, defaultPrice: 0.95 },
  { base: 'PYTH', name: 'Pyth Network (بيث نتورك)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.36 },
  { base: 'W', name: 'Wormhole (وورمهول)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.28 },
  { base: 'ONDO', name: 'Ondo Finance (أوندو فاينانس - أصول العالم الحقيقي RWA)', category: 'DEFI', digits: 3, defaultPrice: 0.88 },
  { base: 'OM', name: 'MANTRA (مانترا RWA)', category: 'DEFI', digits: 3, defaultPrice: 3.4 },
  { base: 'STRK', name: 'Starknet (ستارك نت)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.42 },
  { base: 'DYDX', name: 'dYdX Protocol', category: 'DEFI', digits: 3, defaultPrice: 1.15 },
  { base: 'BLUR', name: 'Blur Marketplace', category: 'DEFI', digits: 4, defaultPrice: 0.22 },
  { base: 'ENS', name: 'Ethereum Name Service', category: 'INFRASTRUCTURE', digits: 2, defaultPrice: 22.5 },
  { base: 'ENA', name: 'Ethena Labs (إيثينا)', category: 'DEFI', digits: 4, defaultPrice: 0.48 },
  { base: 'NOT', name: 'Notcoin (نوت كوين)', category: 'MEME', digits: 5, defaultPrice: 0.0072 },
  { base: 'REZ', name: 'Renzo Protocol', category: 'DEFI', digits: 4, defaultPrice: 0.038 },
  { base: 'IO', name: 'io.net (الحوسبة السحابية اللامركزية والذكاء الاصطناعي)', category: 'AI_BIGDATA', digits: 3, defaultPrice: 1.95 },
  { base: 'ZRO', name: 'LayerZero (لاير زيرو)', category: 'INFRASTRUCTURE', digits: 3, defaultPrice: 3.85 },
  { base: 'BB', name: 'BounceBit (باونس بيت)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.31 },
  { base: 'LISTA', name: 'Lista DAO', category: 'DEFI', digits: 4, defaultPrice: 0.36 },
  { base: 'ATH', name: 'Aethir (إيثر كلاود والذكاء الاصطناعي)', category: 'AI_BIGDATA', digits: 4, defaultPrice: 0.062 },
  { base: 'PIXEL', name: 'Pixels Game (بيكسلز)', category: 'GAMING_METAVERSE', digits: 4, defaultPrice: 0.16 },
  { base: 'PORTAL', name: 'Portal Gaming', category: 'GAMING_METAVERSE', digits: 4, defaultPrice: 0.25 },
  { base: 'AI', name: 'Sleepless AI', category: 'AI_BIGDATA', digits: 4, defaultPrice: 0.44 },
  { base: 'XAI', name: 'Xai Gaming Network', category: 'GAMING_METAVERSE', digits: 4, defaultPrice: 0.22 },
  { base: 'MANTA', name: 'Manta Network', category: 'LAYER1_2', digits: 3, defaultPrice: 0.72 },
  { base: 'ALT', name: 'AltLayer (ألت لاير)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.11 },
  { base: 'JTO', name: 'Jito Solana Liquid Staking', category: 'DEFI', digits: 3, defaultPrice: 2.8 },
  { base: 'ORDI', name: 'Ordinals Bitcoin', category: 'INFRASTRUCTURE', digits: 2, defaultPrice: 35.0 },
  { base: '1000SATS', name: 'Satoshi (ساتوشي)', category: 'MEME', digits: 6, defaultPrice: 0.00022 },
  { base: 'BOME', name: 'Book of Meme (بومي)', category: 'MEME', digits: 5, defaultPrice: 0.0084 },
  { base: 'MEW', name: 'cat in a dogs world', category: 'MEME', digits: 5, defaultPrice: 0.0078 },
  { base: 'POPCAT', name: 'Popcat (بوب كات)', category: 'MEME', digits: 4, defaultPrice: 1.25 },
  { base: 'BRETT', name: 'Brett Base (بريت)', category: 'MEME', digits: 4, defaultPrice: 0.13 },
  { base: 'DOGS', name: 'Dogs TON Community', category: 'MEME', digits: 6, defaultPrice: 0.00062 },
  { base: 'TURBO', name: 'Turbo AI Meme', category: 'MEME', digits: 5, defaultPrice: 0.0075 },
  { base: 'JASMY', name: 'JasmyCoin (إنترنت الأشياء IoT)', category: 'INFRASTRUCTURE', digits: 5, defaultPrice: 0.021 },
  { base: 'BEAM', name: 'Beam Gaming DAO', category: 'GAMING_METAVERSE', digits: 5, defaultPrice: 0.017 },
  { base: 'RON', name: 'Ronin Network (رونين جيمنج)', category: 'GAMING_METAVERSE', digits: 3, defaultPrice: 1.45 },
  { base: 'AXS', name: 'Axie Infinity (أكسي إنفينيتي)', category: 'GAMING_METAVERSE', digits: 2, defaultPrice: 5.2 },
  { base: 'SAND', name: 'The Sandbox (ذا ساندبوكس)', category: 'GAMING_METAVERSE', digits: 4, defaultPrice: 0.32 },
  { base: 'MANA', name: 'Decentraland (ديسنترالاند)', category: 'GAMING_METAVERSE', digits: 4, defaultPrice: 0.34 },
  { base: 'CHZ', name: 'Chiliz (تشيليز للرياضة)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.065 },
  { base: 'CFX', name: 'Conflux Network (كونفلكس)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.145 },
  { base: 'ROSE', name: 'Oasis Network (أواسيس الخصوصية)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.072 },
  { base: 'MINA', name: 'Mina Protocol (مينا بروتوكول ZK)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.52 },
  { base: 'ASTR', name: 'Astar Network', category: 'LAYER1_2', digits: 4, defaultPrice: 0.064 },
  { base: 'IOTA', name: 'IOTA Network', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.17 },
  { base: 'NEO', name: 'Neo Smart Economy', category: 'LAYER1_2', digits: 2, defaultPrice: 11.5 },
  { base: 'EOS', name: 'EOS Network', category: 'LAYER1_2', digits: 4, defaultPrice: 0.54 },
  { base: 'ALGO', name: 'Algorand (ألغوراند)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.155 },
  { base: 'HBAR', name: 'Hedera (هيديرا هاشغراف)', category: 'LAYER1_2', digits: 4, defaultPrice: 0.115 },
  { base: 'VET', name: 'VeChain (فيتشين)', category: 'INFRASTRUCTURE', digits: 4, defaultPrice: 0.028 },
  { base: 'QNT', name: 'Quant Network (كوانت إنتروبيرابيليتي)', category: 'INFRASTRUCTURE', digits: 2, defaultPrice: 78.0 },
  { base: 'THETA', name: 'Theta Network (ثيتا لبث الفيديو والذكاء الاصطناعي)', category: 'INFRASTRUCTURE', digits: 3, defaultPrice: 1.45 },
  { base: 'EGLD', name: 'MultiversX (سابقاً إليروند)', category: 'LAYER1_2', digits: 2, defaultPrice: 24.5 },
  { base: 'FLOW', name: 'Flow Dapper Labs', category: 'LAYER1_2', digits: 3, defaultPrice: 0.62 },
  { base: 'CRV', name: 'Curve DAO Token', category: 'DEFI', digits: 4, defaultPrice: 0.35 },
  { base: 'SNX', name: 'Synthetix (سينثيتكس)', category: 'DEFI', digits: 3, defaultPrice: 1.55 },
  { base: 'COMP', name: 'Compound Finance', category: 'DEFI', digits: 2, defaultPrice: 48.0 },
  { base: 'MKR', name: 'MakerDAO (صانع DAI)', category: 'DEFI', digits: 1, defaultPrice: 1620.0 },
  { base: 'DYM', name: 'Dymension (دايمنشن)', category: 'INFRASTRUCTURE', digits: 3, defaultPrice: 1.55 },
  { base: 'AEVO', name: 'Aevo Perpetual Options', category: 'DEFI', digits: 4, defaultPrice: 0.38 },
  { base: 'WLD', name: 'Worldcoin (سام ألتمان)', category: 'AI_BIGDATA', digits: 3, defaultPrice: 1.85 },
  { base: 'GMX', name: 'GMX Exchange Decentralized Perps', category: 'DEFI', digits: 2, defaultPrice: 26.5 },
  { base: 'WEN', name: 'Wen Solana Cat Meme', category: 'MEME', digits: 6, defaultPrice: 0.000095 },
  { base: 'NFP', name: 'NFPrompt AI Web3', category: 'AI_BIGDATA', digits: 4, defaultPrice: 0.21 }
];
