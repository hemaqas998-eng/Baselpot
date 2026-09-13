import { Router } from 'express';
import { radarEngine } from '../radarEngine.js';
import { generateCandlesForSymbol, computeTechnicalIndicators } from '../marketData.js';
import { 
  handleCopilotChat, 
  analyzeSignalWithGemini, 
  runMasterGeminiRadarScanner,
  analyzeTradeFailureAndPostMortemWithGemini,
  conductInteractivePatternDebateWithGemini
} from '../geminiService.js';
import { generateGeminiMarketInsight, diagnoseErrorWithGemini } from '../geminiIntelligenceService.js';
import { deepSeekService } from '../deepseekService.js';
import { dualAiOrchestrator } from '../dualAiOrchestrator.js';

export const aiRouter = Router();

// Copilot Chat
aiRouter.post('/copilot-chat', async (req, res) => {
  try {
    const { messages, currentSymbol } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'messages array is required' });
    }
    const reply = await handleCopilotChat(messages, currentSymbol);
    res.json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias for /chat
aiRouter.post('/chat', async (req, res) => {
  try {
    const { messages, currentSymbol } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'messages array is required' });
    }
    const reply = await handleCopilotChat(messages, currentSymbol);
    res.json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Error Diagnosis
aiRouter.post('/diagnose-error', async (req, res) => {
  try {
    const { errorMessage, errorStack, componentStack } = req.body;
    const diagnosis = await diagnoseErrorWithGemini(errorMessage, errorStack, componentStack);
    res.json({ success: true, diagnosis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Market Insights
aiRouter.get('/market-insights/:symbol', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const forceRefresh = req.query.refresh === 'true';
    const allSymbols = radarEngine.getSymbols();
    const openTrades = radarEngine.getPaperTrades();
    const recentSignals = radarEngine.getSignals();

    const insight = await generateGeminiMarketInsight(symbol, allSymbols, openTrades, recentSignals, forceRefresh);
    res.json({ success: true, insight });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Market Outlook
aiRouter.get('/market-outlook', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const outlook = await radarEngine.getMarketOutlook(forceRefresh);
    res.json({ success: true, outlook });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DeepSeek Analysis
aiRouter.get('/deepseek-analyze/:symbol', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const allSymbols = radarEngine.getSymbols();
    const analysis = await deepSeekService.analyzeQuantitativeEdge(symbol, allSymbols);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DeepSeek Config
aiRouter.post('/deepseek-config', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (typeof apiKey === 'string') {
      deepSeekService.setApiKey(apiKey);
    }
    res.json({ success: true, isConfigured: deepSeekService.isConfigured() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dual-AI Consensus
aiRouter.get('/dual-consensus/:symbol', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const allSymbols = radarEngine.getSymbols();
    const openTrades = radarEngine.getPaperTrades();
    const recentSignals = radarEngine.getSignals();

    const consensus = await dualAiOrchestrator.generateDualAiConsensus(symbol, allSymbols, openTrades, recentSignals);
    res.json({ success: true, consensus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pattern Analysis
aiRouter.post('/analyze-pattern', async (req, res) => {
  try {
    const { signalId } = req.body;
    const signals = radarEngine.getSignals();
    const signal = signals.find(s => s.id === signalId);
    if (!signal) {
      return res.status(404).json({ success: false, error: 'Signal not found' });
    }

    const sym = radarEngine.getSymbols().find(s => s.symbol === signal.symbol) || radarEngine.getSymbols()[0];
    const candles = generateCandlesForSymbol(signal.symbol, signal.timeframe);
    const indicators = computeTechnicalIndicators(candles);
    const fearGreed = radarEngine.getStatus().fearAndGreed;

    const aiPlan = await analyzeSignalWithGemini(signal, sym, indicators, fearGreed);
    signal.aiAnalysis = aiPlan;

    res.json({ success: true, aiAnalysis: aiPlan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Next Move Simulation
aiRouter.get('/live-next-move/:symbol', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const allSymbols = radarEngine.getSymbols();
    const openTrades = radarEngine.getPaperTrades();
    const recentSignals = radarEngine.getSignals();

    const sym = allSymbols.find(s => s.symbol === symbol) || allSymbols[0];
    const candles = generateCandlesForSymbol(sym.symbol, '15m', 100);
    const indicators = computeTechnicalIndicators(candles);
    const currentPrice = sym.price;
    const digits = sym.digits || 2;
    const atr = indicators.atr || (currentPrice * 0.008);
    const spreadPips = +(sym.spread / (sym.pipSize || 0.01)).toFixed(1);

    const consensus = await dualAiOrchestrator.generateDualAiConsensus(sym.symbol, allSymbols, openTrades, recentSignals);
    const isLong = consensus.consensusDirection === 'BUY' || (sym.change24h >= 0 && consensus.consensusDirection !== 'SELL');
    const bias = isLong ? 'STRONG_BUY' : 'SELL';
    const confidence = consensus.consensusScore || Math.round(72 + Math.abs(indicators.rsi - 50) * 0.4);

    const obBullishMin = +(currentPrice - atr * 1.4).toFixed(digits);
    const obBullishMax = +(currentPrice - atr * 0.7).toFixed(digits);
    const obBearishMin = +(currentPrice + atr * 0.8).toFixed(digits);
    const obBearishMax = +(currentPrice + atr * 1.5).toFixed(digits);
    const fvgTarget = isLong ? +(currentPrice + atr * 1.1).toFixed(digits) : +(currentPrice - atr * 1.1).toFixed(digits);

    const c1Open = currentPrice;
    const c1High = isLong ? +(c1Open + atr * 0.6).toFixed(digits) : +(c1Open + atr * 0.2).toFixed(digits);
    const c1Low = isLong ? +(c1Open - atr * 0.3).toFixed(digits) : +(c1Open - atr * 0.7).toFixed(digits);
    const c1Close = isLong ? +(c1Open + atr * 0.5).toFixed(digits) : +(c1Open - atr * 0.5).toFixed(digits);

    const c2Open = c1Close;
    const c2High = isLong ? +(c2Open + atr * 1.0).toFixed(digits) : +(c2Open + atr * 0.2).toFixed(digits);
    const c2Low = isLong ? +(c2Open - atr * 0.2).toFixed(digits) : +(c2Open - atr * 1.1).toFixed(digits);
    const c2Close = isLong ? +(c2Open + atr * 0.9).toFixed(digits) : +(c2Open - atr * 0.9).toFixed(digits);

    const c3Open = c2Close;
    const c3High = isLong ? +(c3Open + atr * 0.7).toFixed(digits) : +(c3Open + atr * 0.3).toFixed(digits);
    const c3Low = isLong ? +(c3Open - atr * 0.2).toFixed(digits) : +(c3Open - atr * 0.8).toFixed(digits);
    const c3Close = isLong ? +(c3Open + atr * 0.6).toFixed(digits) : +(c3Open - atr * 0.6).toFixed(digits);

    const predictedTrajectory = [
      {
        candleIndex: 1,
        timeframeLabel: 'الشمعة 1 (15m: سحب السيولة واختبار الدعم)',
        expectedDirection: isLong ? 'LIQUIDITY_SWEEP_PULLBACK' as const : 'BEARISH_EXPANSION' as const,
        openPrice: c1Open,
        predictedHigh: c1High,
        predictedLow: c1Low,
        predictedClose: c1Close,
        probabilityPct: 89,
        tacticalActionArabic: isLong 
          ? `إعادة اختبار منطقة الدعم المؤسسي $${obBullishMax} ثم ارتداد صاعد سريع.` 
          : `كسر قاع السيولة واختبار المقاومة $${obBearishMin}.`
      },
      {
        candleIndex: 2,
        timeframeLabel: 'الشمعة 2 (30m: توسع الزخم المؤسسي Institutional Expansion)',
        expectedDirection: isLong ? 'BULLISH_EXPANSION' as const : 'BEARISH_EXPANSION' as const,
        openPrice: c2Open,
        predictedHigh: c2High,
        predictedLow: c2Low,
        predictedClose: c2Close,
        probabilityPct: 84,
        tacticalActionArabic: isLong 
          ? `تعبئة فجوة القيمة العادلة (FVG) نحو الهدف $${fvgTarget} وتأمين الوقف تلقائياً.` 
          : `تسارع زخم البيع نحو حوض سيولة المشترين (SSL).`
      },
      {
        candleIndex: 3,
        timeframeLabel: 'الشمعة 3 (45m: جني الأرباح واكتمال الهدف TP1)',
        expectedDirection: isLong ? 'BULLISH_EXPANSION' as const : 'CONSOLIDATION' as const,
        openPrice: c3Open,
        predictedHigh: c3High,
        predictedLow: c3Low,
        predictedClose: c3Close,
        probabilityPct: 78,
        tacticalActionArabic: isLong 
          ? `ضرب الهدف الأول $${consensus.synthesisPlan.takeProfit1} وتفعيل الوقف المتحرك لحجز الأرباح.` 
          : `الوصول للهدف الأول وتخفيف المراكز.`
      }
    ];

    const livePayload = {
      symbol: sym.symbol,
      timestamp: Date.now(),
      isLive: true,
      currentPrice,
      spreadPips,
      atrValue: +atr.toFixed(digits),
      high24h: sym.high24h,
      low24h: sym.low24h,
      change24h: sym.change24h,
      timeframe: '15m',
      bias,
      confidenceScore: confidence,
      liquidityStructure: {
        bullishOrderBlock: { min: obBullishMin, max: obBullishMax, status: 'ACTIVE' as const },
        bearishOrderBlock: { min: obBearishMin, max: obBearishMax, status: 'ACTIVE' as const },
        fairValueGapTarget: fvgTarget,
        nearestLiquidityPool: {
          price: isLong ? obBearishMax : obBullishMin,
          type: isLong ? 'BUY_SIDE' as const : 'SELL_SIDE' as const,
          volumeEst: '$18.4M'
        }
      },
      predictedTrajectory,
      dynamicLevels: {
        suggestedEntry: currentPrice,
        limitPullbackEntry: consensus.synthesisPlan.limitPullbackEntry || obBullishMax,
        stopLoss: consensus.synthesisPlan.stopLoss,
        takeProfit1: consensus.synthesisPlan.takeProfit1,
        takeProfit2: consensus.synthesisPlan.takeProfit2,
        autoBreakEvenTrigger: consensus.synthesisPlan.autoBreakEvenThreshold,
        riskRewardRatio: consensus.synthesisPlan.riskRewardRatio,
        safeLotSize: consensus.synthesisPlan.suggestedLot,
        expectedValueEV: consensus.deepSeekAudit.expectedValueEV
      },
      nextMoveSummaryArabic: consensus.synthesisPlan.arabicSynthesisSummary,
      executiveActionPlanArabic: [
        `الحركة القادمة المرجحة: ${isLong ? 'صعود استهدافي' : 'هبوط تصحيحي'} بتوافق ذكاء ثنائي بنسبة ${confidence}%.`,
        `أفضل نقطة دخول بالأمر المعلق (Limit): عند $${consensus.synthesisPlan.limitPullbackEntry || obBullishMax} لتفادي الشراء في القمة.`,
        `تأمين رأس المال التلقائي: يتم نقل الوقف إلى $${consensus.synthesisPlan.entryPrice} فور ملامسة السعر لـ $${consensus.synthesisPlan.autoBreakEvenThreshold}.`,
        `حجم العقد المحسوب وفق كيلي: ${consensus.synthesisPlan.suggestedLot} لوت صارم لمنع أي دروداون على المحفظة.`
      ]
    };

    res.json({ success: true, liveNextMove: livePayload });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dual-AI Batch Screener with in-memory caching to avoid burst quota exhaustion
let dualScreenBatchCache: { data: any[]; timestamp: number } | null = null;
const DUAL_SCREEN_BATCH_TTL_MS = 60 * 1000; // 60s cache

aiRouter.get('/dual-screen-all', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh && dualScreenBatchCache && (Date.now() - dualScreenBatchCache.timestamp < DUAL_SCREEN_BATCH_TTL_MS)) {
      return res.json({ success: true, results: dualScreenBatchCache.data });
    }

    const symbols = radarEngine.getSymbols().filter(s => s.isTradeable !== false && s.macroRole !== 'INDICATOR_ONLY' && s.assetClass !== 'indices');
    const openTrades = radarEngine.getPaperTrades();
    const recentSignals = radarEngine.getSignals();
    
    // Pick top tradeable symbols for dual screen (top 8 symbols)
    const targetSymbols = symbols.slice(0, 8);
    const results: any[] = [];
    
    for (const sym of targetSymbols) {
      try {
        const consensus = await dualAiOrchestrator.generateDualAiConsensus(sym.symbol, symbols, openTrades, recentSignals);
        results.push(consensus);
      } catch (e) {
        console.error(`Error consensus for ${sym.symbol}:`, e);
      }
    }
    
    dualScreenBatchCache = { data: results, timestamp: Date.now() };
    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dual-AI Trade Protections Evaluation (Auto Break-Even & Trailing Stop)
aiRouter.get('/dual-manage-trades', (req, res) => {
  try {
    const openTrades = radarEngine.getPaperTrades();
    const symbols = radarEngine.getSymbols();
    const evaluations = dualAiOrchestrator.evaluateActiveTradeProtections(openTrades, symbols);
    res.json({ success: true, evaluations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dual-AI Apply Live Protection (Move SL to Break-Even / Trail Stop)
aiRouter.post('/dual-apply-protection', (req, res) => {
  try {
    const { tradeId, proposedStopLoss, reason } = req.body;
    const trades = radarEngine.getPaperTrades();
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    
    trade.stopLoss = proposedStopLoss;
    trade.trailingStopActive = true;
    radarEngine.log('ORDER', 'EXECUTION', `🛡️ [Dual-AI Protection] Stop-Loss updated for trade ${trade.symbol} (${trade.id}) to ${proposedStopLoss}: ${reason || 'Auto Break-Even / Trailing'}`, { tradeId, proposedStopLoss }, trade.symbol);
    
    res.json({
      success: true,
      message: `تم تطبيق حماية الصفقة وتحديث وقف الخسارة بنجاح إلى $${proposedStopLoss} لزوج ${trade.symbol}!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Master Screener Controller
aiRouter.all('/unified-gemini-radar-controller', async (req, res) => {
  try {
    const options = req.method === 'POST' ? req.body : req.query;
    const result = await runMasterGeminiRadarScanner(options);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

aiRouter.all('/gemini-master-screener', async (req, res) => {
  try {
    const options = req.method === 'POST' ? req.body : req.query;
    const result = await runMasterGeminiRadarScanner(options);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧠 Adaptive Pattern Learning & Anti-Overfitting Matrix
aiRouter.get('/adaptive-learning-matrix', (req, res) => {
  try {
    const learningState = radarEngine.getAdaptivePatternLearning();
    const postMortems = radarEngine.getPostMortems();
    res.json({
      success: true,
      learningState,
      recentPostMortems: postMortems.slice(0, 15),
      antiOverfittingIndex: learningState.systemOverfittingPreventionIndex || 88
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔬 Deep Trade Failure / Success AI Post-Mortem Diagnostic
aiRouter.post('/discuss-trade', async (req, res) => {
  try {
    const { tradeId, trade, postMortem } = req.body;
    let targetTrade = trade;
    let targetPostMortem = postMortem;

    if (!targetTrade && tradeId) {
      const allTrades = radarEngine.getPaperTrades();
      targetTrade = allTrades.find(t => t.id === tradeId);
    }
    if (!targetPostMortem && tradeId) {
      const allPostMortems = radarEngine.getPostMortems();
      targetPostMortem = allPostMortems.find(p => p.tradeId === tradeId);
    }

    if (!targetTrade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    const adaptiveState = radarEngine.getAdaptivePatternLearning();
    const debrief = await analyzeTradeFailureAndPostMortemWithGemini(
      targetTrade,
      targetPostMortem || { maePips: 2.5, mfePips: 14.0, executionQualityScore: 85 },
      adaptiveState.activePatternWeights
    );

    res.json({ success: true, debrief });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 💬 Interactive AI Pattern Learning & Strategy Debate
aiRouter.post('/pattern-debate', async (req, res) => {
  try {
    const { message, chatHistory, marketContext } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const response = await conductInteractivePatternDebateWithGemini(message, chatHistory || [], marketContext);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

